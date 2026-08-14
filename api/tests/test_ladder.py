"""Unit tests for the savings ladder math. No network, no database, no env vars."""
from datetime import date, timedelta

import pytest

from api import ladder

ANCHOR = date(2026, 8, 14)
STEP = 500  # Rs 5/day


def d(offset: int) -> date:
    return ANCHOR + timedelta(days=offset)


# ---------- cycle_day ----------
def test_anchor_is_day_one():
    assert ladder.cycle_day(ANCHOR, ANCHOR) == 1


def test_cycle_day_climbs_then_resets():
    assert ladder.cycle_day(d(29), ANCHOR) == 30
    assert ladder.cycle_day(d(30), ANCHOR) == 1
    assert ladder.cycle_day(d(59), ANCHOR) == 30
    assert ladder.cycle_day(d(60), ANCHOR) == 1


def test_cycle_day_rejects_dates_before_anchor():
    with pytest.raises(ValueError):
        ladder.cycle_day(d(-1), ANCHOR)


# ---------- accrual amounts ----------
def test_accrual_is_step_times_day():
    assert ladder.accrual_paise(STEP, 1) == 500
    assert ladder.accrual_paise(STEP, 30) == 15000


@pytest.mark.parametrize("bad_day", [0, 31, -1])
def test_accrual_rejects_out_of_range_day(bad_day):
    with pytest.raises(ValueError):
        ladder.accrual_paise(STEP, bad_day)


def test_accrual_rejects_non_positive_step():
    with pytest.raises(ValueError):
        ladder.accrual_paise(0, 1)


def test_ninety_day_sweep_resets_every_cycle_and_totals_465_step():
    """Three full cycles: the ladder must reset on schedule and each cycle cost 465 * step."""
    amounts = [ladder.accrual_for_date(STEP, d(i), ANCHOR) for i in range(90)]

    assert amounts[:3] == [500, 1000, 1500]
    for cycle_start in (0, 30, 60):
        cycle = amounts[cycle_start:cycle_start + 30]
        assert cycle[0] == STEP, "cycle must restart at one step"
        assert cycle[-1] == STEP * 30, "cycle must peak at 30 steps"
        assert sum(cycle) == ladder.cycle_total_paise(STEP)
    assert sum(amounts) == 3 * ladder.cycle_total_paise(STEP)


def test_cycle_total_multiple_is_465():
    assert ladder.CYCLE_TOTAL_MULTIPLE == 465
    assert ladder.cycle_total_paise(100) == 46500


def test_no_accrual_exceeds_the_mandate_ceiling():
    ceiling = ladder.mandate_max_paise(STEP)
    assert all(ladder.accrual_for_date(STEP, d(i), ANCHOR) <= ceiling for i in range(90))


# ---------- due_paise ----------
def test_due_sums_only_unsettled():
    rows = [
        {"amount_paise": 500, "settled_at": "2026-08-15T00:00:00Z"},
        {"amount_paise": 1000, "settled_at": None},
        {"amount_paise": 1500},
    ]
    assert ladder.due_paise(rows) == 2500


def test_due_of_nothing_is_zero():
    assert ladder.due_paise([]) == 0


def test_missed_settlement_keeps_accruing():
    """A user who never settles owes the running total, not one period's worth."""
    rows = [{"amount_paise": ladder.accrual_for_date(STEP, d(i), ANCHOR), "settled_at": None}
            for i in range(14)]
    assert ladder.due_paise(rows) == STEP * (14 * 15 // 2)


# ---------- weekly windows are NOT equal ----------
def test_weekly_windows_climb_across_the_cycle():
    """Only the monthly total is fixed; each week costs more than the last."""
    amounts = [ladder.accrual_for_date(STEP, d(i), ANCHOR) for i in range(30)]
    weeks = [sum(amounts[i:i + 7]) for i in range(0, 28, 7)]
    assert weeks == [28 * STEP, 77 * STEP, 126 * STEP, 175 * STEP]
    assert weeks == sorted(weeks) and len(set(weeks)) == 4


# ---------- quantity lever ----------
def test_whole_rupee_amount_maps_cleanly_to_quantity():
    quantity, charge, remainder = ladder.settlement_split(14000)  # Rs 140
    assert (quantity, charge, remainder) == (140, 14000, 0)


def test_sub_rupee_remainder_rolls_forward():
    quantity, charge, remainder = ladder.settlement_split(14050)
    assert (quantity, charge, remainder) == (140, 14000, 50)


def test_whole_rupee_steps_never_leave_a_remainder():
    for step in (100, 500, 1000):
        for day in range(1, 31):
            _, _, remainder = ladder.settlement_split(ladder.accrual_paise(step, day))
            assert remainder == 0


def test_settlement_split_rejects_negative():
    with pytest.raises(ValueError):
        ladder.settlement_split(-1)


# ---------- covered_accruals ----------
def _rows(count: int):
    return [{"id": f"r{i}", "debit_date": d(i),
             "amount_paise": ladder.accrual_for_date(STEP, d(i), ANCHOR), "settled_at": None}
            for i in range(count)]


def test_capture_settles_oldest_first():
    rows = _rows(7)
    covered, total = ladder.covered_accruals(rows, 28 * STEP)
    assert [r["id"] for r in covered] == [f"r{i}" for i in range(7)]
    assert total == 28 * STEP


def test_partial_capture_never_settles_a_day_it_cannot_pay_in_full():
    rows = _rows(7)
    # Rs 20 covers days 1+2+3 (5+10+15) exactly; day 4 costs Rs 20 and must stay unsettled.
    covered, total = ladder.covered_accruals(rows, 3000)
    assert [r["id"] for r in covered] == ["r0", "r1", "r2"]
    assert total == 3000


def test_already_settled_rows_are_skipped():
    rows = _rows(3)
    rows[0]["settled_at"] = "2026-08-15T00:00:00Z"
    covered, total = ladder.covered_accruals(rows, 1000)
    assert [r["id"] for r in covered] == ["r1"]
    assert total == 1000


def test_capture_larger_than_debt_settles_everything():
    rows = _rows(5)
    covered, total = ladder.covered_accruals(rows, 10_000_000)
    assert len(covered) == 5
    assert total == ladder.due_paise(rows)


# ---------- sweep scheduling ----------
def test_daily_cadence_sweeps_every_day_after_the_first():
    assert not ladder.should_sweep(ANCHOR, "daily", ANCHOR), "day 1 has nothing to collect yet"
    assert all(ladder.should_sweep(d(i), "daily", ANCHOR) for i in range(1, 10))


def test_weekly_sweep_lands_the_day_after_a_full_week():
    assert ladder.should_sweep(d(7), "weekly", ANCHOR)
    assert ladder.should_sweep(d(14), "weekly", ANCHOR)
    assert not any(ladder.should_sweep(d(i), "weekly", ANCHOR) for i in range(1, 7))


def test_weekly_sweep_collects_a_whole_week():
    """The sweep on day 8 must collect days 1-7, i.e. 28 * step."""
    rows = _rows(7)
    assert ladder.should_sweep(d(7), "weekly", ANCHOR)
    assert ladder.due_paise(rows) == 28 * STEP


def test_monthly_sweep_collects_a_full_cycle():
    rows = _rows(30)
    assert ladder.should_sweep(d(30), "monthly", ANCHOR)
    assert ladder.due_paise(rows) == ladder.cycle_total_paise(STEP)


def test_manual_cadence_never_sweeps():
    assert not any(ladder.should_sweep(d(i), "manual", ANCHOR) for i in range(60))


def test_unknown_cadence_is_rejected():
    with pytest.raises(ValueError):
        ladder.should_sweep(d(1), "fortnightly", ANCHOR)


def test_notification_fires_a_day_before_the_debit():
    """NPCI wants ~24h notice, so notify on day 7 for the day 8 weekly debit."""
    assert ladder.should_notify(d(6), "weekly", ANCHOR)
    assert not ladder.should_notify(d(5), "weekly", ANCHOR)
    for offset in range(1, 30):
        assert ladder.should_notify(d(offset - 1), "daily", ANCHOR)
