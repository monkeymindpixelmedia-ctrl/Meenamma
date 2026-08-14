import importlib
import re
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest


ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture()
def seed(monkeypatch):
    import supabase
    import supertokens_python
    from supertokens_python.recipe import emailpassword, emailverification, session

    calls = {"recipes": {}}
    fake_sb = object()

    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "offline-service-role")
    monkeypatch.setattr(supabase, "create_client", lambda *_args, **_kwargs: fake_sb)
    monkeypatch.setattr(supertokens_python, "init", lambda **kwargs: calls.setdefault("init", kwargs))

    def record_recipe(name):
        def init_recipe(*args, **kwargs):
            calls["recipes"][name] = (args, kwargs)
            return name

        return init_recipe

    monkeypatch.setattr(emailpassword, "init", record_recipe("emailpassword"))
    monkeypatch.setattr(emailverification, "init", record_recipe("emailverification"))
    monkeypatch.setattr(session, "init", record_recipe("session"))

    sys.modules.pop("api.seed", None)
    module = importlib.import_module("api.seed")
    yield module, calls
    sys.modules.pop("api.seed", None)


def test_seed_initializes_required_email_verification(seed):
    _, calls = seed

    assert calls["init"]["recipe_list"] == ["emailpassword", "emailverification", "session"]
    assert calls["recipes"]["emailverification"] == ((), {"mode": "REQUIRED"})


def test_existing_emailpassword_identity_is_resolved_as_recipe_user_id(seed, monkeypatch):
    module, _ = seed
    looked_up = []
    method = SimpleNamespace(
        recipe_id="emailpassword",
        recipe_user_id="recipe-user-id",
        has_same_email_as=lambda email: email == "admin@example.test",
    )
    user = SimpleNamespace(id="primary-user-id", login_methods=[method])
    monkeypatch.setattr(module, "sign_up", lambda *_args: module.EmailAlreadyExistsError())
    monkeypatch.setattr(
        module,
        "list_users_by_account_info",
        lambda tenant, info: looked_up.append((tenant, info.email)) or [user],
    )
    monkeypatch.setattr(
        module, "update_email_or_password", lambda *_args, **_kwargs: module.UpdateEmailOrPasswordOkResult()
    )

    user_id, recipe_user_id = module._emailpassword_identity(
        "admin@example.test", "replacement-password"
    )

    assert looked_up == [("public", "admin@example.test")]
    assert user_id == "primary-user-id"
    assert isinstance(recipe_user_id, module.RecipeUserId)
    assert recipe_user_id.get_as_string() == "recipe-user-id"


def test_existing_emailpassword_identity_has_seed_password_updated(seed, monkeypatch):
    module, _ = seed
    updates = []
    method = SimpleNamespace(
        recipe_id="emailpassword", recipe_user_id="recipe-id", has_same_email_as=lambda _email: True
    )
    user = SimpleNamespace(id="user-id", login_methods=[method])
    monkeypatch.setattr(module, "sign_up", lambda *_args: module.EmailAlreadyExistsError())
    monkeypatch.setattr(module, "list_users_by_account_info", lambda *_args: [user])
    monkeypatch.setattr(
        module,
        "update_email_or_password",
        lambda recipe_id, **kwargs: updates.append((recipe_id, kwargs))
        or module.UpdateEmailOrPasswordOkResult(),
    )

    module._emailpassword_identity("admin@example.test", "replacement-password")

    assert updates[0][0].get_as_string() == "recipe-id"
    assert updates[0][1] == {"password": "replacement-password"}


def test_unverified_seed_email_is_verified_directly_with_token(seed, monkeypatch):
    module, _ = seed
    events = []
    recipe_user_id = module.RecipeUserId("recipe-id")
    monkeypatch.setattr(
        module,
        "is_email_verified",
        lambda *_args, **_kwargs: events.append("checked") or False,
    )
    monkeypatch.setattr(
        module,
        "create_email_verification_token",
        lambda *_args, **_kwargs: events.append("token-created")
        or module.CreateEmailVerificationTokenOkResult("verification-token"),
    )
    monkeypatch.setattr(
        module,
        "verify_email_using_token",
        lambda tenant, token: events.append((tenant, token))
        or module.VerifyEmailUsingTokenOkResult(SimpleNamespace()),
    )

    module._verify_seed_email("admin@example.test", recipe_user_id)

    assert events == ["checked", "token-created", ("public", "verification-token")]


def test_existing_profile_still_creates_and_verifies_supertokens_identity(seed, monkeypatch):
    module, _ = seed
    events = []

    class Profiles:
        def select(self, _columns):
            return self

        def eq(self, _column, _value):
            return self

        def execute(self):
            return SimpleNamespace(data=[{"id": "existing-profile-id"}])

    monkeypatch.setattr(module, "sb", SimpleNamespace(table=lambda _name: Profiles()))
    monkeypatch.setattr(
        module,
        "_emailpassword_identity",
        lambda email, password: events.append(("identity", email, password))
        or ("supertokens-id", module.RecipeUserId("recipe-id")),
    )
    monkeypatch.setattr(
        module,
        "_verify_seed_email",
        lambda email, _recipe_id: events.append(("verified", email)),
    )
    monkeypatch.setattr(
        module,
        "_map_profile_id",
        lambda st_id, profile_id: events.append(("mapped", st_id, profile_id)) or profile_id,
    )

    result = module.ensure_user("admin@example.test", "password", "Admin")

    assert result == "existing-profile-id"
    assert events == [
        ("identity", "admin@example.test", "password"),
        ("verified", "admin@example.test"),
        ("mapped", "supertokens-id", "existing-profile-id"),
    ]


def test_existing_same_user_id_mapping_is_accepted(seed, monkeypatch):
    module, _ = seed
    monkeypatch.setattr(
        module,
        "create_user_id_mapping",
        lambda *_args: module.UserIdMappingAlreadyExistsError(True, "existing-profile-id"),
    )
    monkeypatch.setattr(
        module,
        "get_user_id_mapping",
        lambda *_args: module.GetUserIdMappingOkResult(
            "supertokens-id", "existing-profile-id"
        ),
    )

    assert module._map_profile_id("supertokens-id", "existing-profile-id") == "existing-profile-id"


def test_conflicting_user_id_mapping_is_rejected(seed, monkeypatch):
    module, _ = seed
    monkeypatch.setattr(
        module,
        "create_user_id_mapping",
        lambda *_args: module.UserIdMappingAlreadyExistsError(True, "other-profile-id"),
    )
    monkeypatch.setattr(
        module,
        "get_user_id_mapping",
        lambda *_args: module.GetUserIdMappingOkResult("supertokens-id", "other-profile-id"),
    )

    with pytest.raises(RuntimeError, match="Refusing to overwrite"):
        module._map_profile_id("supertokens-id", "requested-profile-id")


def test_new_profile_is_inserted_under_supertokens_user_id(seed, monkeypatch):
    module, _ = seed
    inserted = []

    class Profiles:
        def select(self, _columns):
            return self

        def eq(self, _column, _value):
            return self

        def insert(self, row):
            inserted.append(row)
            return self

        def execute(self):
            return SimpleNamespace(data=[])

    monkeypatch.setattr(module, "sb", SimpleNamespace(table=lambda _name: Profiles()))
    monkeypatch.setattr(
        module,
        "_emailpassword_identity",
        lambda *_args: ("supertokens-id", module.RecipeUserId("recipe-id")),
    )
    monkeypatch.setattr(module, "_verify_seed_email", lambda *_args: None)

    result = module.ensure_user("new@example.test", "password", "New User")

    assert result == "supertokens-id"
    assert inserted == [
        {"id": "supertokens-id", "email": "new@example.test", "display_name": "New User"}
    ]


@pytest.fixture()
def auth_docs():
    return (ROOT / "auth_testing.md").read_text(encoding="utf-8")


def test_auth_docs_list_backend_and_frontend_environment_names_without_values(auth_docs):
    names = {
        "SUPERTOKENS_CONNECTION_URI",
        "SUPERTOKENS_API_KEY",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "APP_URL",
        "API_URL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "REACT_APP_SUPERTOKENS_APP_NAME",
        "REACT_APP_SUPERTOKENS_API_DOMAIN",
        "REACT_APP_SUPERTOKENS_WEBSITE_DOMAIN",
        "REACT_APP_API_URL",
    }

    for name in names:
        assert re.search(rf"^- `{name}`(?:\s|$)", auth_docs, re.MULTILINE)
        assert not re.search(rf"`{name}\s*=", auth_docs)


def test_auth_docs_give_exact_google_callback_urls(auth_docs):
    assert "<WEBSITE_DOMAIN>/auth/callback/google" in auth_docs
    assert "http://localhost:3000/auth/callback/google" in auth_docs


def test_auth_docs_require_m14_before_seed_command(auth_docs):
    migration = auth_docs.index("20260814000014_m14_supertokens_identity.sql")
    seed_command = auth_docs.index("python api/seed.py")

    assert migration < seed_command


def test_auth_docs_explain_required_verification_and_default_delivery(auth_docs):
    assert "Email verification is `REQUIRED`" in auth_docs
    assert "SuperTokens uses its default email service" in auth_docs


def test_auth_docs_include_local_commands_and_auth_test_matrix(auth_docs):
    commands = (
        "uvicorn api.index:app --reload --port 8000",
        "npm start",
        "python -m pytest api/tests/test_supertokens_auth.py -q",
        "npm test -- --watchAll=false",
    )

    assert all(command in auth_docs for command in commands)
    assert all(f"{number}. " in auth_docs for number in range(1, 8))


def test_auth_docs_warn_that_backend_secrets_must_not_reach_browser(auth_docs):
    warning = re.search(r"Never expose .*?public browser JavaScript\.", auth_docs, re.DOTALL)

    assert warning is not None
    assert "GOOGLE_CLIENT_SECRET" in warning.group()
    assert "SUPERTOKENS_API_KEY" in warning.group()
    assert "service-role key" in warning.group()
