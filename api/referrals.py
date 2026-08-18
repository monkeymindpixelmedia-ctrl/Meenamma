"""Pure referral-code helpers shared by the API and migration tests."""

import re
from typing import Optional


def make_referral_code(display_name: Optional[str], user_id: str) -> str:
    """Create the stable, human-readable code shown in a user's referral link."""
    base_name = re.sub(r"[^a-zA-Z0-9]", "", display_name or "USER")[:4].upper() or "USER"
    short_id = str(user_id).replace("-", "")[:4].upper()
    return f"{base_name}{short_id}"
