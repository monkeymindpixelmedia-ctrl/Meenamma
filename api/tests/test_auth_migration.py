from types import SimpleNamespace

from scripts.migrate_profiles_to_supabase_auth import missing_emails, normalized_emails
from api.referrals import make_referral_code


def test_normalized_emails_accepts_profile_dicts_and_auth_users():
    rows = [{"email": " Meena@Example.com "}, SimpleNamespace(email="other@example.com")]

    assert normalized_emails(rows) == {"meena@example.com", "other@example.com"}


def test_missing_emails_returns_only_profiles_without_auth_users():
    profiles = [{"email": "meena@example.com"}, {"email": "new@example.com"}]
    auth_users = [SimpleNamespace(email="MEENA@example.com")]

    assert missing_emails(profiles, auth_users) == ["new@example.com"]


def test_referral_code_uses_display_name_and_user_id_prefix():
    assert make_referral_code("Meena & Family", "abcd1234-0000-0000-0000-000000000000") == "MEENABCD"


def test_referral_code_defaults_when_name_is_missing():
    assert make_referral_code(None, "1234abcd-0000-0000-0000-000000000000") == "USER1234"
