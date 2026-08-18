"""Pure referral-code helpers shared by the API and migration tests."""

import re
from datetime import datetime, timedelta, timezone
from typing import Optional

REFERRAL_WINDOW_DAYS = 90


def make_referral_code(display_name: Optional[str], user_id: str) -> str:
    """Create the stable, human-readable code shown in a user's referral link."""
    base_name = re.sub(r"[^a-zA-Z0-9]", "", display_name or "USER")[:4].upper() or "USER"
    short_id = str(user_id).replace("-", "")[:4].upper()
    return f"{base_name}{short_id}"


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
