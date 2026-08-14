"""Offline acceptance tests for the quantity-lever savings workflow."""

import asyncio
import json
from copy import deepcopy
from datetime import date
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from api import index


class MemoryQuery:
    def __init__(self, db, name):
        self.db = db
        self.name = name
        self.filters = []
        self.operation = ("select", None)
        self.sort = None
        self.row_limit = None

    def select(self, _columns):
        return self

    def eq(self, column, value):
        self.filters.append(("eq", column, value))
        return self

    def is_(self, column, value):
        self.filters.append(("is", column, value))
        return self

    def order(self, column, desc=False):
        self.sort = (column, desc)
        return self

    def limit(self, value):
        self.row_limit = value
        return self

    def insert(self, row):
        self.operation = ("insert", deepcopy(row))
        return self

    def update(self, values):
        self.operation = ("update", deepcopy(values))
        return self

    def upsert(self, values, on_conflict=None):
        self.operation = ("upsert", (deepcopy(values), on_conflict))
        return self

    def _matches(self, row):
        for kind, column, value in self.filters:
            if kind == "eq" and row.get(column) != value:
                return False
            if kind == "is" and value == "null" and row.get(column) is not None:
                return False
        return True

    def execute(self):
        operation, values = self.operation
        rows = self.db.rows.setdefault(self.name, [])
        if operation == "upsert":
            values, conflict = values
            values = values if isinstance(values, list) else [values]
            keys = (conflict or "id").split(",")
            for value in values:
                current = next((row for row in rows
                                if all(row.get(key) == value.get(key) for key in keys)), None)
                if current is None:
                    rows.append(value)
                else:
                    current.update(value)
            return SimpleNamespace(data=deepcopy(values))
        if operation == "insert":
            if self.name == "autopay_accruals":
                duplicate = any(
                    row.get("profile_id") == values.get("profile_id")
                    and row.get("debit_date") == values.get("debit_date")
                    for row in rows
                )
                if duplicate:
                    raise RuntimeError("duplicate profile/date")
            if self.name == "payment_webhook_events":
                duplicate = any(
                    row.get("provider_event_id") == values.get("provider_event_id")
                    or row.get("payload_hash") == values.get("payload_hash")
                    for row in rows
                )
                if duplicate:
                    raise RuntimeError("duplicate webhook")
            rows.append(values)
            return SimpleNamespace(data=[deepcopy(values)])
        matched = [row for row in rows if self._matches(row)]
        if operation == "update":
            for row in matched:
                row.update(values)
            return SimpleNamespace(data=deepcopy(matched))
        if self.sort:
            column, desc = self.sort
            matched.sort(key=lambda row: row.get(column) or "", reverse=desc)
        if self.row_limit is not None:
            matched = matched[:self.row_limit]
        return SimpleNamespace(data=deepcopy(matched))


class MemorySupabase:
    def __init__(self, **rows):
        self.rows = {name: deepcopy(value) for name, value in rows.items()}

    def table(self, name):
        return MemoryQuery(self, name)


class FakeRequest:
    def __init__(self, payload):
        self._body = json.dumps(payload).encode()
        self.headers = {"X-Razorpay-Signature": "valid"}

    async def body(self):
        return self._body


@pytest.mark.parametrize("step", [-5, 0, 101, 200])
def test_subscription_rejects_steps_outside_product_choices(step):
    with pytest.raises(ValidationError):
        index.AutopaySubscribeIn(step_amount=step, cadence="weekly")


@pytest.mark.parametrize("step", [1, 2, 5, 6, 10, 11, 100])
@pytest.mark.parametrize("cadence", ["daily", "weekly", "monthly", "manual"])
def test_subscription_accepts_every_product_step_and_cadence(step, cadence):
    body = index.AutopaySubscribeIn(step_amount=step, cadence=cadence)

    assert body.step_amount == step
    assert body.cadence == cadence


def test_pending_subscription_retry_reuses_provider_subscription(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "secret")
    monkeypatch.setattr(index, "shared_plan_id",
                        lambda *_args: pytest.fail("retry created another plan"))
    monkeypatch.setattr(index.rzp.subscription, "create",
                        lambda *_args, **_kwargs: pytest.fail("retry created another subscription"))
    user = _profile("u1", cadence="weekly", subscription_id="sub_pending", step=500)
    user["autopay_status"] = "pending"

    result = index.autopay_subscribe(
        index.AutopaySubscribeIn(step_amount=5, cadence="weekly"), user)

    assert result["subscription_id"] == "sub_pending"
    assert result["step_amount"] == 5
    assert result["cadence"] == "weekly"


def test_active_subscription_must_be_cancelled_before_replacement():
    user = _profile("u1", cadence="weekly", subscription_id="sub_active", step=500)

    with pytest.raises(index.HTTPException) as conflict:
        index.autopay_subscribe(
            index.AutopaySubscribeIn(step_amount=10, cadence="monthly"), user)

    assert conflict.value.status_code == 409


class RpcSupabase:
    def __init__(self, result):
        self.result = result
        self.calls = []

    def rpc(self, name, params):
        self.calls.append((name, deepcopy(params)))
        return SimpleNamespace(execute=lambda: SimpleNamespace(data=[deepcopy(self.result)]))

    def table(self, name):
        pytest.fail(f"settlement bypassed RPC and accessed {name} directly")


@pytest.mark.parametrize(
    ("status", "expected"),
    [("settled", True), ("duplicate", True), ("no_covered", False), ("no_kudam", False)],
)
def test_captured_payment_delegates_once_to_atomic_rpc(monkeypatch, status, expected):
    db = RpcSupabase({"status": status, "credited_paise": 1500 if expected else 0})
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setattr(index, "apply_kudam_deposit",
                        lambda *_args: pytest.fail("settlement inserted a deposit directly"))

    settled = index._settle_autopay_payment("u1", {"id": "pay_1", "amount": 1500})

    assert settled is expected
    assert db.calls == [("settle_autopay_payment", {
        "p_profile_id": "u1",
        "p_payment_id": "pay_1",
        "p_captured_paise": 1500,
    })]


def test_initial_subscription_authorization_returns_no_covered_from_rpc(monkeypatch):
    db = RpcSupabase({"status": "no_covered", "credited_paise": 0})
    monkeypatch.setattr(index, "sb", db)

    settled = index._settle_autopay_payment("u1", {"id": "pay_auth", "amount": 100})

    assert settled is False
    assert len(db.calls) == 1


@pytest.mark.parametrize("event", ["payment.captured", "payment.failed"])
def test_subscription_webhook_dispatches_without_reclassifying_debt(monkeypatch, event):
    db = MemorySupabase(payment_webhook_events=[])
    captured = []
    failed = []
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "secret")
    monkeypatch.setattr(index.rzp.utility, "verify_webhook_signature",
                        lambda *_args, **_kwargs: None)
    monkeypatch.setattr(index, "_credit_autopay_deposit",
                        lambda subscription_id, entity: captured.append((subscription_id, entity)) or True)
    monkeypatch.setattr(index, "_record_failed_autopay",
                        lambda subscription_id, entity: failed.append((subscription_id, entity)) or True)
    payload = {
        "event_id": f"evt_{event}",
        "event": event,
        "payload": {"payment": {"entity": {
            "id": "pay_1", "subscription_id": "sub_1", "amount": 2800,
        }}},
    }

    response = asyncio.run(index.razorpay_webhook(FakeRequest(payload)))

    assert response["ok"] is True
    if event == "payment.captured":
        assert len(captured) == 1 and failed == []
    else:
        assert captured == [] and len(failed) == 1


def test_payment_link_capture_with_order_id_uses_profile_notes(monkeypatch):
    db = MemorySupabase(payment_webhook_events=[])
    settlements = []
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "secret")
    monkeypatch.setattr(index.rzp.utility, "verify_webhook_signature",
                        lambda *_args, **_kwargs: None)
    monkeypatch.setattr(index, "_process_captured_payment", lambda *_args: None)
    monkeypatch.setattr(index, "_settle_autopay_payment",
                        lambda profile_id, entity: settlements.append((profile_id, entity)) or True)
    payload = {
        "event_id": "evt_manual",
        "event": "payment.captured",
        "payload": {"payment": {"entity": {
            "id": "pay_manual", "order_id": "order_link", "amount": 2800,
            "notes": {"profile_id": "u1"},
        }}},
    }

    response = asyncio.run(index.razorpay_webhook(FakeRequest(payload)))

    assert response["autopay_credited"] is True
    assert settlements == [("u1", payload["payload"]["payment"]["entity"])]


def test_payment_link_paid_uses_link_notes_and_replay_is_idempotent(monkeypatch):
    db = MemorySupabase(payment_webhook_events=[])
    settlements = []
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "secret")
    monkeypatch.setattr(index.rzp.utility, "verify_webhook_signature",
                        lambda *_args, **_kwargs: None)
    monkeypatch.setattr(index, "_settle_autopay_payment",
                        lambda profile_id, entity: settlements.append((profile_id, entity)) or True)
    payment = {"id": "pay_link", "order_id": "order_link", "amount": 2800}
    payload = {
        "event_id": "evt_link",
        "event": "payment_link.paid",
        "payload": {
            "payment": {"entity": payment},
            "payment_link": {"entity": {"id": "plink_1", "notes": {"profile_id": "u1"}}},
        },
    }
    request = FakeRequest(payload)

    first = asyncio.run(index.razorpay_webhook(request))
    replay = asyncio.run(index.razorpay_webhook(request))

    assert first["autopay_credited"] is True
    assert replay == {"ok": True, "already_processed": True}
    assert settlements == [("u1", payment)]


def _profile(profile_id, cadence="weekly", subscription_id="sub_1", step=500):
    return {
        "id": profile_id,
        "email": f"{profile_id}@example.com",
        "display_name": profile_id,
        "step_paise": step,
        "autopay_cadence": cadence,
        "cycle_anchor_date": "2026-08-14",
        "autopay_subscription_id": subscription_id,
        "autopay_status": "active",
    }


def _accruals(profile_id, count=7, step=500):
    return [
        {
            "id": f"{profile_id}-a{offset}",
            "profile_id": profile_id,
            "debit_date": f"2026-08-{14 + offset:02d}",
            "cycle_day": offset + 1,
            "amount_paise": step * (offset + 1),
            "settled_at": None,
        }
        for offset in range(count)
    ]


def test_daily_accrual_is_idempotent_and_replays_from_dates(monkeypatch):
    db = MemorySupabase(profiles=[_profile("u1")], autopay_accruals=[])
    monkeypatch.setattr(index, "sb", db)
    target = date(2026, 8, 16)

    first = index.run_daily_accruals(target)
    second = index.run_daily_accruals(target)

    assert first["accrued"] == second["accrued"] == 1
    assert db.rows["autopay_accruals"] == [{
        "profile_id": "u1", "debit_date": "2026-08-16",
        "cycle_day": 3, "amount_paise": 1500,
    }]


def test_weekly_predebit_sets_quantity_and_queues_t24_notice(monkeypatch):
    profile = _profile("u1")
    db = MemorySupabase(
        profiles=[profile],
        autopay_accruals=_accruals("u1"),
        notification_outbox=[],
    )
    edits = []
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setattr(index.rzp.subscription, "edit",
                        lambda subscription_id, payload: edits.append((subscription_id, payload)))
    monkeypatch.setattr(index, "drain_notification_outbox",
                        lambda _sb: {"sent": 0, "failed": 0})

    result = index.run_predebit_sweep(date(2026, 8, 20))
    replay = index.run_predebit_sweep(date(2026, 8, 20))

    assert result["scheduled"] == 1 and result["failed"] == 0
    assert replay["scheduled"] == 0 and replay["skipped"] == 1
    assert edits == [("sub_1", {
        "quantity": 140, "schedule_change_at": "cycle_end", "customer_notify": False,
    })]
    notice = db.rows["notification_outbox"][0]
    assert notice["event_key"] == "autopay_predebit"
    assert notice["payload"]["amount"] == 140
    assert notice["payload"]["debit_date"] == "2026-08-21"


def test_provider_update_failure_isolated_and_debt_stays_unsettled(monkeypatch):
    profiles = [_profile("bad", subscription_id="sub_bad"),
                _profile("good", subscription_id="sub_good")]
    accruals = _accruals("bad") + _accruals("good")
    db = MemorySupabase(
        profiles=profiles, autopay_accruals=accruals, notification_outbox=[])
    edits = []

    def edit(subscription_id, payload):
        edits.append((subscription_id, payload))
        if subscription_id == "sub_bad":
            raise RuntimeError("UPI subscriptions reject quantity changes")

    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setattr(index.rzp.subscription, "edit", edit)
    monkeypatch.setattr(index, "drain_notification_outbox",
                        lambda _sb: {"sent": 0, "failed": 0})

    result = index.run_predebit_sweep(date(2026, 8, 20))

    assert result["failed"] == 1 and result["scheduled"] == 1
    assert [subscription_id for subscription_id, _ in edits] == ["sub_bad", "sub_good"]
    assert all(row["settled_at"] is None for row in db.rows["autopay_accruals"])
    assert {row["event_key"] for row in db.rows["notification_outbox"]} == {
        "autopay_update_failed", "autopay_predebit",
    }


def test_balance_above_mandate_ceiling_duns_without_provider_call(monkeypatch):
    profile = _profile("u1", step=100)
    debt = [{"id": "old", "profile_id": "u1", "debit_date": "2026-07-01",
             "amount_paise": 46_501, "settled_at": None}]
    db = MemorySupabase(
        profiles=[profile], autopay_accruals=debt, notification_outbox=[])
    edits = []
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setattr(index.rzp.subscription, "edit", lambda *args: edits.append(args))
    monkeypatch.setattr(index, "drain_notification_outbox",
                        lambda _sb: {"sent": 0, "failed": 0})

    result = index.run_predebit_sweep(date(2026, 8, 20))

    assert result["dunning"] == 1
    assert edits == []
    assert db.rows["notification_outbox"][0]["event_key"] == "autopay_dunning"
    assert db.rows["autopay_accruals"][0]["settled_at"] is None


def test_manual_payment_link_uses_exact_unsettled_due(monkeypatch):
    db = MemorySupabase(autopay_accruals=_accruals("u1"))
    requests = []
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "secret")
    monkeypatch.setattr(index.rzp.payment_link, "create",
                        lambda payload: requests.append(payload) or {
                            "id": "plink_1", "short_url": "https://rzp.test/link",
                        })

    result = index.autopay_payment_link({
        "id": "u1", "email": "u1@example.com", "display_name": "Amma",
    })

    assert requests[0]["amount"] == 14_000
    assert requests[0]["notes"] == {"profile_id": "u1", "kind": "autopay_accruals"}
    assert requests[0]["accept_partial"] is False
    assert result["amount"] == 140 and result["currency"] == "INR"


def test_manual_enrolment_starts_accrual_without_razorpay(monkeypatch):
    profile = _profile("u1", cadence="manual", subscription_id=None)
    profile["autopay_status"] = "none"
    db = MemorySupabase(profiles=[profile], autopay_accruals=[])
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.delenv("RAZORPAY_KEY_ID", raising=False)
    monkeypatch.delenv("RAZORPAY_KEY_SECRET", raising=False)
    monkeypatch.setattr(index.rzp.subscription, "create",
                        lambda *_args, **_kwargs: pytest.fail("manual enrolment called Razorpay"))

    result = index.autopay_subscribe(
        index.AutopaySubscribeIn(step_amount=5, cadence="manual"),
        {"id": "u1", "_role": "user"},
    )

    saved = db.rows["profiles"][0]
    assert result["manual"] is True
    assert saved["autopay_status"] == "active"
    assert saved["autopay_cadence"] == "manual"
    assert saved["step_paise"] == 500
    assert saved["autopay_subscription_id"] is None


def test_manual_enrolment_cancels_pending_provider_subscription(monkeypatch):
    profile = _profile("u1", cadence="weekly", subscription_id="sub_pending", step=500)
    profile["autopay_status"] = "pending"
    db = MemorySupabase(profiles=[profile], autopay_accruals=[])
    cancellations = []
    monkeypatch.setattr(index, "sb", db)
    monkeypatch.setattr(index.rzp.subscription, "cancel",
                        lambda subscription_id: cancellations.append(subscription_id))

    result = index.autopay_subscribe(
        index.AutopaySubscribeIn(step_amount=10, cadence="manual"),
        {**profile, "_role": "user"},
    )

    saved = db.rows["profiles"][0]
    assert cancellations == ["sub_pending"]
    assert result["manual"] is True
    assert saved["autopay_subscription_id"] is None
    assert saved["autopay_status"] == "active"
    assert saved["autopay_cadence"] == "manual"


def test_cancel_failure_preserves_local_subscription_state(monkeypatch):
    profile = _profile("u1", cadence="weekly", subscription_id="sub_active", step=500)
    db = MemorySupabase(profiles=[profile])
    monkeypatch.setattr(index, "sb", db)

    def fail_cancel(_subscription_id):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(index.rzp.subscription, "cancel", fail_cancel)

    with pytest.raises(index.HTTPException) as failure:
        index.autopay_cancel({**profile, "_role": "user"})

    assert failure.value.status_code == 502
    assert db.rows["profiles"][0]["autopay_status"] == "active"
    assert db.rows["profiles"][0]["autopay_subscription_id"] == "sub_active"


def test_subscription_verification_is_bound_to_current_profile(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "secret")
    monkeypatch.setattr(index.rzp.utility, "verify_subscription_payment_signature",
                        lambda *_args, **_kwargs: pytest.fail("mismatched subscription was verified"))

    with pytest.raises(index.HTTPException) as mismatch:
        index.autopay_verify(
            index.AutopayVerifyIn(
                razorpay_payment_id="pay_1",
                razorpay_subscription_id="sub_other",
                razorpay_signature="sig_1",
            ),
            {"id": "u1", "autopay_subscription_id": "sub_expected"},
        )

    assert mismatch.value.status_code == 400


def test_cron_requires_configured_bearer_secret(monkeypatch):
    request = SimpleNamespace(headers={})
    monkeypatch.delenv("AUTOPAY_CRON_SECRET", raising=False)
    monkeypatch.delenv("CRON_SECRET", raising=False)
    with pytest.raises(index.HTTPException) as unconfigured:
        index.require_cron(request)
    assert unconfigured.value.status_code == 503

    monkeypatch.setenv("AUTOPAY_CRON_SECRET", "correct-secret")
    with pytest.raises(index.HTTPException) as unauthorized:
        index.require_cron(request)
    assert unauthorized.value.status_code == 401

    index.require_cron(SimpleNamespace(
        headers={"Authorization": "Bearer correct-secret"}))
