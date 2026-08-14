"""Pure ladder math for the incremental savings autopay.

Everything here is a function of dates and integers — no database, no Razorpay, no clock.
That is deliberate: the accrual schedule is replayable and testable in isolation, and the
settlement sweep can be reasoned about without a payment provider in the loop.

The design splits two clocks:

  * the *accrual* clock runs daily and moves no money
        cycle_day    = ((debit_date - anchor) mod 30) + 1     -> 1..30
        amount_paise = step_paise * cycle_day
  * the *settlement* clock charges the sum of everything not yet settled

Cadence only decides when the sweep runs, never the arithmetic. A missed settlement therefore
needs no special case: its accruals stay unsettled and roll into the next sweep.
"""

from datetime import date, timedelta

_ONE_DAY = timedelta(days=1)

# Ladder length. Day 30 accrues 30 * step, then the ladder resets to day 1.
CYCLE_DAYS = 30

# 1 + 2 + ... + 30 = 465. One full cycle costs 465 * step.
CYCLE_TOTAL_MULTIPLE = CYCLE_DAYS * (CYCLE_DAYS + 1) // 2

# Razorpay charges plan.item.amount * quantity. We use a shared plan priced at Rs 1 per unit
# and vary quantity, which is the only way one plan can bill an amount that changes per cycle.
PLAN_UNIT_PAISE = 100

# How many days between settlement sweeps. 'manual' never auto-sweeps; the user pays a link.
CADENCE_DAYS = {"daily": 1, "weekly": 7, "monthly": 30}
CADENCES = frozenset(CADENCE_DAYS) | {"manual"}


def cycle_day(debit_date: date, anchor: date) -> int:
    """Which rung of the ladder `debit_date` sits on, 1..CYCLE_DAYS.

    The anchor date is day 1. Derived from dates alone, so re-running the accrual cron for a
    past date always produces the same answer.
    """
    if debit_date < anchor:
        raise ValueError(f"debit_date {debit_date} precedes cycle anchor {anchor}")
    return ((debit_date - anchor).days % CYCLE_DAYS) + 1


def accrual_paise(step_paise: int, day: int) -> int:
    """What day `day` of a cycle adds to the ladder."""
    if step_paise <= 0:
        raise ValueError(f"step_paise must be positive, got {step_paise}")
    if not 1 <= day <= CYCLE_DAYS:
        raise ValueError(f"cycle day must be 1..{CYCLE_DAYS}, got {day}")
    return step_paise * day


def accrual_for_date(step_paise: int, debit_date: date, anchor: date) -> int:
    """Convenience: the ladder amount for a calendar date."""
    return accrual_paise(step_paise, cycle_day(debit_date, anchor))


def cycle_total_paise(step_paise: int) -> int:
    """Sum of one complete 30-day ladder."""
    return step_paise * CYCLE_TOTAL_MULTIPLE


def mandate_max_paise(step_paise: int) -> int:
    """Ceiling to authorise the Razorpay subscription with.

    Debt is unbounded in principle because unpaid accruals keep growing, but a balance above
    one full cycle means the user has not settled in over 30 days. That is a dunning case, not
    a charge attempt, so capping at one cycle is safe.
    """
    return cycle_total_paise(step_paise)


def due_paise(accruals) -> int:
    """Total owed: every accrual that has not been settled.

    This single expression serves daily, weekly, monthly and pay-whenever-you-have-it.
    """
    return sum(a["amount_paise"] for a in accruals if not a.get("settled_at"))


def settlement_split(amount_paise: int):
    """Split an owed amount into what Razorpay can charge and what rolls forward.

    Returns ``(quantity, charge_paise, remainder_paise)``. The quantity lever bills in whole
    rupees, so any sub-rupee remainder cannot be collected this sweep and stays unsettled —
    consistent with how unpaid accruals behave everywhere else. With whole-rupee steps the
    remainder is always zero.
    """
    if amount_paise < 0:
        raise ValueError(f"amount_paise must be non-negative, got {amount_paise}")
    quantity = amount_paise // PLAN_UNIT_PAISE
    charge_paise = quantity * PLAN_UNIT_PAISE
    return quantity, charge_paise, amount_paise - charge_paise


def covered_accruals(accruals, charge_paise: int):
    """Which unsettled accruals a captured payment pays off, oldest first.

    Only rows the payment covers *in full* are returned, so a partial capture never marks a
    day as settled. Returns ``(rows, total_paise)``.
    """
    remaining = charge_paise
    covered = []
    unsettled = sorted(
        (a for a in accruals if not a.get("settled_at")),
        key=lambda a: (a["debit_date"], a.get("id") or ""),
    )
    for a in unsettled:
        if a["amount_paise"] > remaining:
            break
        remaining -= a["amount_paise"]
        covered.append(a)
    return covered, charge_paise - remaining


def should_sweep(today: date, cadence: str, anchor: date) -> bool:
    """Whether a settlement sweep runs today.

    A sweep lands on the day *after* the last accrual it collects, so the weekly sweep on
    day 8 collects days 1-7 (28 * step) rather than a partial week.
    """
    if cadence not in CADENCES:
        raise ValueError(f"unknown cadence {cadence!r}")
    period = CADENCE_DAYS.get(cadence)
    if period is None:  # 'manual' — collected by payment link, never swept
        return False
    elapsed = (today - anchor).days
    return elapsed > 0 and elapsed % period == 0


def should_notify(today: date, cadence: str, anchor: date) -> bool:
    """Whether tomorrow's debit needs its pre-debit notification sent today.

    NPCI requires roughly 24h notice before each mandate debit, which is why the sweep is two
    stages: notify and set the quantity today, let Razorpay charge tomorrow.
    """
    return should_sweep(today + _ONE_DAY, cadence, anchor)
