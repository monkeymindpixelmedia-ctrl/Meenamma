from types import SimpleNamespace

from scripts.migrate_profiles_to_supabase_auth import missing_emails, normalized_emails


def test_normalized_emails_accepts_profile_dicts_and_auth_users():
    rows = [{"email": " Meena@Example.com "}, SimpleNamespace(email="other@example.com")]

    assert normalized_emails(rows) == {"meena@example.com", "other@example.com"}


def test_missing_emails_returns_only_profiles_without_auth_users():
    profiles = [{"email": "meena@example.com"}, {"email": "new@example.com"}]
    auth_users = [SimpleNamespace(email="MEENA@example.com")]

    assert missing_emails(profiles, auth_users) == ["new@example.com"]
