"""Pure referral-code helpers shared by the API and migration tests."""

import re
from datetime import datetime, timedelta, timezone
from typing import Optional

REFERRAL_WINDOW_DAYS = 90
STUDENT_CYCLE_DAYS = 60
STUDENT_TARGET_AMOUNT = 5050
STUDENT_TARGET_PAISE = STUDENT_TARGET_AMOUNT * 100


def make_referral_code(display_name: Optional[str], user_id: str) -> str:
    """Create the stable, human-readable code shown in a user's referral link."""
    base_name = re.sub(r"[^a-zA-Z0-9]", "", display_name or "USER")[:4].upper() or "USER"
    short_id = str(user_id).replace("-", "")[:4].upper()
    return f"{base_name}{short_id}"


def make_student_serial(user_id: str) -> str:
    """Generate a unique student serial code in standard format MNM-STU-XXXX."""
    clean_id = str(user_id).replace("-", "").upper()
    suffix = clean_id[:4] if len(clean_id) >= 4 else "0001"
    return f"MNM-STU-{suffix}"


def referral_window(created_at, now: Optional[datetime] = None) -> dict:
    """Return the elapsed/remaining days in the 90-day referral window."""
    if isinstance(created_at, datetime):
        joined_at = created_at
    else:
        joined_at = datetime.fromisoformat(str(created_at).replace("Z", "+00:00"))
    if joined_at.tzinfo is None:
        joined_at = joined_at.replace(tzinfo=timezone.utc)
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    elapsed = max(0, (current - joined_at).days)
    elapsed = min(REFERRAL_WINDOW_DAYS, elapsed)
    remaining = max(0, REFERRAL_WINDOW_DAYS - elapsed)
    return {
        "window_days": REFERRAL_WINDOW_DAYS,
        "days_elapsed": elapsed,
        "days_remaining": remaining,
        "window_active": elapsed < REFERRAL_WINDOW_DAYS,
        "expires_at": (joined_at + timedelta(days=REFERRAL_WINDOW_DAYS)).isoformat(),
    }


def student_savings_milestone(cycle_start, total_saved_paise: int = 0, now: Optional[datetime] = None) -> dict:
    """Return student 60-day cycle metrics and ₹5,050 target progress."""
    if not cycle_start:
        start_date = datetime.now(timezone.utc)
    elif isinstance(cycle_start, datetime):
        start_date = cycle_start
    else:
        start_date = datetime.fromisoformat(str(cycle_start).replace("Z", "+00:00"))

    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)

    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)

    elapsed = max(0, (current - start_date).days)
    remaining = max(0, STUDENT_CYCLE_DAYS - elapsed)
    saved_amount = round(total_saved_paise / 100)
    is_milestone_completed = saved_amount >= STUDENT_TARGET_AMOUNT
    progress_percent = min(100, round((total_saved_paise / STUDENT_TARGET_PAISE) * 100)) if STUDENT_TARGET_PAISE > 0 else 0

    return {
        "cycle_days": STUDENT_CYCLE_DAYS,
        "days_elapsed": min(STUDENT_CYCLE_DAYS, elapsed),
        "days_remaining": remaining,
        "cycle_active": elapsed <= STUDENT_CYCLE_DAYS,
        "saved_amount": saved_amount,
        "target_amount": STUDENT_TARGET_AMOUNT,
        "is_milestone_completed": is_milestone_completed,
        "progress_percent": progress_percent,
        "commission_eligible": is_milestone_completed or elapsed <= STUDENT_CYCLE_DAYS,
        "expires_at": (start_date + timedelta(days=STUDENT_CYCLE_DAYS)).isoformat(),
    }

