import asyncio
import importlib
import inspect
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest


ROOT = Path(__file__).resolve().parents[2]
AUTH_ENV = {
    "SUPERTOKENS_CONNECTION_URI": "http://supertokens.invalid:3567",
    "SUPERTOKENS_API_KEY": "unit-test-api-key",
    "API_DOMAIN": "http://api.example.test",
    "WEBSITE_DOMAIN": "http://web.example.test",
    "GOOGLE_CLIENT_ID": "unit-test-google-client",
    "GOOGLE_CLIENT_SECRET": "unit-test-google-secret",
    "SUPABASE_URL": "https://database.example.test",
    "SUPABASE_SERVICE_ROLE_KEY": "unit-test-service-role-key",
}


@pytest.fixture()
def configured_auth(monkeypatch):
    import supertokens_python
    import supertokens_python.asyncio as supertokens_asyncio
    from supertokens_python.framework import fastapi as supertokens_fastapi
    from supertokens_python.recipe import emailpassword, emailverification, session, thirdparty
    from supertokens_python.recipe.session.framework import fastapi as session_fastapi

    calls = {"recipes": {}, "verify_session": []}
    fake_values = dict(AUTH_ENV)
    for name, value in fake_values.items():
        monkeypatch.setenv(name, value)

    def fake_init(**kwargs):
        calls["init"] = kwargs

    def recipe_recorder(name):
        def record(*args, **kwargs):
            calls["recipes"][name] = (args, kwargs)
            return name

        return record

    class FakeMiddleware:
        pass

    def fake_verify_session(**kwargs):
        async def dependency():
            return None

        calls["verify_session"].append((kwargs, dependency))
        return dependency

    async def fake_get_user(user_id, user_context=None):
        calls["identity_user_id"] = user_id
        return SimpleNamespace(
            id="server-canonical-id",
            emails=["verified@example.test"],
            login_methods=[SimpleNamespace(email="verified@example.test")],
        )

    monkeypatch.setattr(supertokens_python, "init", fake_init)
    monkeypatch.setattr(emailpassword, "init", recipe_recorder("emailpassword"))
    monkeypatch.setattr(emailverification, "init", recipe_recorder("emailverification"))
    monkeypatch.setattr(session, "init", recipe_recorder("session"))
    monkeypatch.setattr(thirdparty, "init", recipe_recorder("thirdparty"))
    monkeypatch.setattr(supertokens_fastapi, "get_middleware", lambda: FakeMiddleware)
    monkeypatch.setattr(session_fastapi, "verify_session", fake_verify_session)
    monkeypatch.setattr(supertokens_asyncio, "get_user", fake_get_user)

    sys.modules.pop("api.supertokens_config", None)
    auth = importlib.import_module("api.supertokens_config")
    yield auth, calls, fake_values, FakeMiddleware
    sys.modules.pop("api.index", None)
    sys.modules.pop("api.supertokens_config", None)


def test_auth_configures_required_recipes_google_and_official_middleware(configured_auth):
    auth, calls, values, fake_middleware = configured_auth

    init_call = calls["init"]
    assert init_call["framework"] == "fastapi"
    assert init_call["supertokens_config"].connection_uri == values["SUPERTOKENS_CONNECTION_URI"]
    assert init_call["supertokens_config"].api_key == values["SUPERTOKENS_API_KEY"]
    assert init_call["app_info"].api_base_path == "/api/auth"
    assert init_call["recipe_list"] == ["emailpassword", "thirdparty", "emailverification", "session"]
    verification_args, verification_kwargs = calls["recipes"]["emailverification"]
    assert (verification_args or (verification_kwargs["mode"],)) == ("REQUIRED",)
    assert auth.supertokens_middleware is fake_middleware

    _, thirdparty_kwargs = calls["recipes"]["thirdparty"]
    provider_input = thirdparty_kwargs["sign_in_and_up_feature"].providers[0]
    provider = provider_input.config
    assert provider.third_party_id == "google"
    assert provider.clients[0].client_id == values["GOOGLE_CLIENT_ID"]
    assert provider.clients[0].client_secret == values["GOOGLE_CLIENT_SECRET"]


def test_missing_google_credentials_omit_google_provider(configured_auth, monkeypatch):
    _, calls, _, _ = configured_auth
    monkeypatch.delenv("GOOGLE_CLIENT_ID")
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET")
    calls["recipes"].clear()
    sys.modules.pop("api.supertokens_config", None)

    importlib.import_module("api.supertokens_config")

    thirdparty_call = calls["recipes"].get("thirdparty")
    providers = [] if thirdparty_call is None else (
        thirdparty_call[1]["sign_in_and_up_feature"].providers)
    google_providers = [provider for provider in providers
                        if provider.config.third_party_id == "google"]
    assert google_providers == []


def test_auth_config_endpoint_reports_google_disabled_without_credentials(
        configured_auth, monkeypatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID")
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET")
    sys.modules.pop("api.supertokens_config", None)
    importlib.import_module("api.supertokens_config")
    index = importlib.import_module("api.index")

    route = next(route for route in index.api.routes if route.path == "/api/config/auth")
    result = route.endpoint()
    if inspect.isawaitable(result):
        result = asyncio.run(result)

    assert result == {"google_enabled": False}


def test_auth_config_endpoint_reports_google_enabled_when_configured(configured_auth):
    index = importlib.import_module("api.index")

    route = next(route for route in index.api.routes if route.path == "/api/config/auth")
    result = route.endpoint()
    if inspect.isawaitable(result):
        result = asyncio.run(result)

    assert result == {"google_enabled": True}


def test_bootstrap_session_bypasses_only_email_verification(configured_auth):
    _, calls, _, _ = configured_auth
    overrides = [kwargs.get("override_global_claim_validators")
                 for kwargs, _ in calls["verify_session"]]
    assert None in overrides
    bootstrap_override = next(override for override in overrides if override is not None)
    validators = [SimpleNamespace(id="st-ev"), SimpleNamespace(id="tenant"),
                  SimpleNamespace(id="custom")]

    remaining = bootstrap_override(validators, None, {})
    if inspect.isawaitable(remaining):
        remaining = asyncio.run(remaining)

    assert [validator.id for validator in remaining] == ["tenant", "custom"]


def test_session_identity_uses_server_user_record(configured_auth):
    auth, calls, _, _ = configured_auth

    class Session:
        def get_user_id(self):
            return "server-user-id"

        def get_access_token_payload(self):
            raise AssertionError("identity must not come from client-controlled session claims")

    identity = asyncio.run(auth.session_identity(Session()))

    assert identity == ("server-canonical-id", "verified@example.test")
    assert calls["identity_user_id"] == "server-user-id"


def test_profile_bootstrap_uses_session_identity_not_client_email(configured_auth, monkeypatch):
    _, _, _, _ = configured_auth
    index = importlib.import_module("api.index")
    upserts = []

    class ProfilesQuery:
        def upsert(self, row, **kwargs):
            upserts.append((row, kwargs))
            return self

        def execute(self):
            return SimpleNamespace(data=[])

    monkeypatch.setattr(index, "sb", SimpleNamespace(table=lambda name: ProfilesQuery()))

    class Session:
        def get_user_id(self):
            return "server-user-id"

    malicious_body = SimpleNamespace(
        name="Test Family", phone=None, address=None, pincode=None,
        daily_plan=None, upi_id=None, locale=None, email="attacker@example.test",
    )
    result = asyncio.run(index.bootstrap_profile(malicious_body, Session()))

    assert result == {"ok": True}
    assert upserts[0][0]["id"] == "server-canonical-id"
    assert upserts[0][0]["email"] == "verified@example.test"
    assert "attacker@example.test" not in upserts[0][0].values()


def test_supertokens_version_is_pinned():
    requirements = (ROOT / "api" / "requirements.txt").read_text(encoding="utf-8")
    assert "supertokens-python==0.31.3" in requirements.splitlines()


def test_profile_auth_users_foreign_key_migration_is_idempotent():
    migration = (ROOT / "supabase" / "migration" /
                 "20260814000014_m14_supertokens_identity.sql").read_text(encoding="utf-8").lower()

    assert "pg_constraint" in migration
    assert "public.profiles" in migration
    assert "auth.users" in migration
    assert "contype = 'f'" in migration
    assert "drop constraint" in migration
    assert "%i" in migration
