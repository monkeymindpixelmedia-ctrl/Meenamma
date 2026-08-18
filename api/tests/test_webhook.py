"""Razorpay webhook tests (T3 — payment_webhook_events).

The locally-started server uses RAZORPAY_WEBHOOK_SECRET=test_webhook_secret
(scripts/start_api.sh default). Signatures are computed locally over the exact
raw body bytes, matching the SDK's HMAC-SHA256 scheme.
"""
import hashlib
import hmac
import json
import os
from types import SimpleNamespace
import requests
import pytest
from pathlib import Path
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")
load_dotenv("/app/frontend/.env")

BASE_URL = os.getenv("REACT_APP_BACKEND_URL", os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:8000")).rstrip("/")
API = f"{BASE_URL}/api"
SUPABASE_URL = os.getenv("REACT_APP_SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
SUPABASE_ANON = os.getenv("REACT_APP_SUPABASE_ANON_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
WEBHOOK_SECRET = "test_webhook_secret"

DEMO_EMAIL = "demo@meenamma.in"
DEMO_PASSWORD = "meenamma2026"
ADMIN_EMAIL = "admin@meenamma.in"
ADMIN_PASSWORD = "TempleGold@2026"


def _login(email, password):
    r = requests.post(f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                      headers={"apikey": SUPABASE_ANON, "Content-Type": "application/json"},
                      json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def demo_headers():
    return {"Authorization": f"Bearer {_login(DEMO_EMAIL, DEMO_PASSWORD)}"}


@pytest.fixture(scope="module")
def admin_headers():
    return {"Authorization": f"Bearer {_login(ADMIN_EMAIL, ADMIN_PASSWORD)}"}


def _sig(body: bytes) -> str:
    return hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()


def _post(body: bytes, signature: str):
    return requests.post(f"{API}/payments/webhook", data=body,
                         headers={"X-Razorpay-Signature": signature}, timeout=30)


def _event(event_id, event, entity):
    payload = {"event_id": event_id, "event": event, "account_id": "acc_test_123",
               "payload": {"payment": {"entity": entity}}}
    body = json.dumps(payload).encode()
    return body, payload


def _webhook_rows(admin_headers):
    r = requests.get(f"{API}/admin/webhooks", headers=admin_headers)
    assert r.status_code == 200
    return r.json()


def _new_booking_order(demo_headers):
    """Create a pending booking; returns (razorpay_order_id, amount_paise)."""
    prods = requests.get(f"{API}/products").json()
    prod = next((p for p in prods if p.get("available")), prods[0])
    o = requests.post(f"{API}/payments/create-order", headers=demo_headers, json={
        "purpose": "booking", "product_id": prod["id"], "qty_kg": 0.5,
        "pickup_date": "2026-09-06",
    })
    assert o.status_code == 200, o.text
    return o.json()["order_id"], o.json()["amount"]


def test_webhook_503_when_unconfigured():
    from fastapi.testclient import TestClient
    import api.index as index
    old = os.environ.get("RAZORPAY_WEBHOOK_SECRET")
    os.environ.pop("RAZORPAY_WEBHOOK_SECRET", None)
    try:
        c = TestClient(index.app)
        r = c.post("/api/payments/webhook", content=b"{}",
                   headers={"X-Razorpay-Signature": "x"})
        assert r.status_code == 503
    finally:
        if old is not None:
            os.environ["RAZORPAY_WEBHOOK_SECRET"] = old


def test_webhook_bad_signature_400_records_event(admin_headers):
    evt_id = f"evt_bad_{os.urandom(4).hex()}"
    body, _ = _event(evt_id, "payment.captured",
                     {"id": "pay_x", "order_id": "order_x", "amount": 100})
    r = _post(body, "deadbeef" * 8)
    assert r.status_code == 400, r.text
    rows = _webhook_rows(admin_headers)
    ev = next((x for x in rows if x["provider_event_id"] == evt_id), None)
    assert ev and ev["signature_valid"] is False and ev["processed_at"] is None


def test_webhook_captured_confirms_order(admin_headers, demo_headers):
    rzp_order_id, amount = _new_booking_order(demo_headers)
    pay_id = "pay_WB" + os.urandom(4).hex()
    body, _ = _event(f"evt_{pay_id}", "payment.captured",
                     {"id": pay_id, "order_id": rzp_order_id, "amount": amount,
                      "currency": "INR", "method": "upi"})
    r = _post(body, _sig(body))
    assert r.status_code == 200, r.text
    assert r.json()["ok"] is True and r.json()["processed"] is True

    # order shows up confirmed via the customer's bookings list
    bookings = requests.get(f"{API}/bookings", headers=demo_headers).json()
    match = [b for b in bookings if b["pickup_date"] == "2026-09-06" and b["status"] == "confirmed"]
    assert match, f"no confirmed booking for webhook-captured order; bookings: {bookings[:5]}"
    assert match[0]["delivery_window"] == "6:00 AM"

    # webhook event marked processed and linked to the payment attempt
    rows = _webhook_rows(admin_headers)
    ev = next((x for x in rows if x["provider_event_id"] == f"evt_{pay_id}"), None)
    assert ev and ev["signature_valid"] is True and ev["processed_at"] is not None
    assert ev["payment_attempt_id"] is not None


def test_webhook_duplicate_event_idempotent(admin_headers):
    evt_id = f"evt_dup_{os.urandom(4).hex()}"
    body, _ = _event(evt_id, "payment.captured",
                     {"id": "pay_dup", "order_id": "order_nonexistent", "amount": 100})
    r1 = _post(body, _sig(body))
    assert r1.status_code == 200
    r2 = _post(body, _sig(body))
    assert r2.status_code == 200
    assert r2.json()["already_processed"] is True
    events = [x for x in _webhook_rows(admin_headers) if x["provider_event_id"] == evt_id]
    assert len(events) == 1


def test_webhook_failed_marks_attempt(demo_headers):
    kudams = requests.get(f"{API}/kudams", headers=demo_headers).json()
    assert kudams
    o = requests.post(f"{API}/payments/create-order", headers=demo_headers,
                      json={"purpose": "deposit", "amount": 10, "kudam_id": kudams[0]["id"]})
    assert o.status_code == 200
    rzp_order_id = o.json()["order_id"]
    pay_id = "pay_WF" + os.urandom(4).hex()
    body, _ = _event(f"evt_{pay_id}", "payment.failed",
                     {"id": pay_id, "order_id": rzp_order_id, "amount": 1000})
    r = _post(body, _sig(body))
    assert r.status_code == 200, r.text
    assert r.json()["ok"] is True


def test_webhook_subscription_charge_credits_kudam(monkeypatch):
    """Autopay debits carry a subscription_id (no order_id); the webhook must
    credit the customer's active kudam so collected money actually lands."""
    import api.index as index

    credits = []
    kudams_db = {"k1": {"id": "k1", "profile_id": "u1", "saved_paise": 5000,
                        "goal_paise": 100000, "status": "active", "created_at": "2026-08-01T00:00:00Z"}}
    deposits_db = []
    webhook_db = []

    class Resp:
        def __init__(self, data):
            self.data = data

    class Q:
        def __init__(self, table):
            self.table = table
            self._filters, self._order, self._limit = {}, None, None
            self._op = None

        def select(self, cols):
            return self

        def eq(self, k, v):
            self._filters[k] = v
            return self

        def order(self, col, desc=False):
            self._order = (col, desc)
            return self

        def limit(self, n):
            self._limit = n
            return self

        def insert(self, row):
            self._op = ("insert", row)
            return self

        def update(self, upd):
            self._op = ("update", upd)
            return self

        def execute(self):
            if self._op:
                op, arg = self._op
                if op == "insert" and self.table == "kudam_deposits":
                    deposits_db.append(arg)
                    return Resp([{"id": "d1"}])
                if op == "insert" and self.table == "payment_webhook_events":
                    webhook_db.append(arg)
                    return Resp([{"id": "w1"}])
                if op == "update" and self.table == "kudams":
                    kudams_db[self._filters.get("id", "k1")].update(arg)
                    return Resp([kudams_db[self._filters.get("id", "k1")]])
                return Resp([{}])
            if self.table == "kudam_deposits":
                pid = self._filters.get("provider_payment_id")
                return Resp([d for d in deposits_db if d.get("provider_payment_id") == pid])
            if self.table == "profiles":
                sub = self._filters.get("autopay_subscription_id")
                return Resp([{"id": "u1"}] if sub == "sub_daily1" else [])
            if self.table == "kudams":
                rows = [d for d in kudams_db.values()
                        if d.get("status") == self._filters.get("status", d.get("status"))
                        and d.get("profile_id") == self._filters.get("profile_id")]
                if self._order:
                    rows = sorted(rows, key=lambda r: r[self._order[0]], reverse=self._order[1])
                return Resp(rows[:1] if self._limit else rows)
            return Resp([])

    class FakeSB:
        def table(self, t):
            return Q(t)

        def rpc(self, fn, params):
            return SimpleNamespace(execute=lambda: Resp([{"status": "settled"}]))

    def fake_apply(kudam_id, amount_paise, source, payment_id=None):
        credits.append((kudam_id, amount_paise, source, payment_id))
        deposits_db.append({"kudam_id": kudam_id, "provider_payment_id": payment_id})
        k = kudams_db[kudam_id]
        k["saved_paise"] += amount_paise
        return k

    monkeypatch.setattr(index, "sb", FakeSB())
    monkeypatch.setattr(index, "apply_kudam_deposit", fake_apply)
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    from fastapi.testclient import TestClient
    c = TestClient(index.app)

    pay_id = "pay_sub" + os.urandom(4).hex()
    body, _ = _event(f"evt_{pay_id}", "payment.captured",
                     {"id": pay_id, "subscription_id": "sub_daily1",
                      "amount": 3500, "currency": "INR", "method": "upi"})
    r = c.post("/api/payments/webhook", content=body,
               headers={"X-Razorpay-Signature": _sig(body)})
    assert r.status_code == 200, r.text
    assert r.json()["autopay_credited"] is True
    assert credits == [("k1", 3500, "autopay", pay_id)], credits
    assert kudams_db["k1"]["saved_paise"] == 8500

    # retry with the same payment id must not double-credit
    r2 = c.post("/api/payments/webhook", content=body,
                headers={"X-Razorpay-Signature": _sig(body)})
    assert r2.status_code == 200, r2.text
    assert r2.json()["autopay_credited"] is True
    assert len(credits) == 1, credits


def test_webhook_subscription_unknown_ignored(monkeypatch):
    """A subscription id we don't track must not credit anything."""
    import api.index as index

    class Q:
        def __init__(self, table):
            self.table = table
            self._filters = {}
            self._op = None

        def select(self, cols):
            return self

        def eq(self, k, v):
            self._filters[k] = v
            return self

        def order(self, col, desc=False):
            return self

        def limit(self, n):
            return self

        def insert(self, row):
            self._op = ("insert", row)
            return self

        def update(self, upd):
            self._op = ("update", upd)
            return self

        def execute(self):
            if self._op and self.table == "payment_webhook_events":
                return SimpleNamespace(data=[{"id": "w1"}])
            if self.table == "kudam_deposits":
                return SimpleNamespace(data=[])
            return SimpleNamespace(data=[])

    class FakeSB:
        def table(self, t):
            return Q(t)

        def rpc(self, fn, params):
            return SimpleNamespace(execute=lambda: SimpleNamespace(data=[]))

    monkeypatch.setattr(index, "sb", FakeSB())
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    from fastapi.testclient import TestClient
    c = TestClient(index.app)

    pay_id = "pay_unk" + os.urandom(4).hex()
    body, _ = _event(f"evt_{pay_id}", "payment.captured",
                     {"id": pay_id, "subscription_id": "sub_ghost", "amount": 500})
    r = c.post("/api/payments/webhook", content=body,
               headers={"X-Razorpay-Signature": _sig(body)})
    assert r.status_code == 200, r.text
    assert r.json()["autopay_credited"] is False
