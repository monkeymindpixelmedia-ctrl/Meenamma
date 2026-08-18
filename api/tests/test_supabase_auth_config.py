import asyncio
import base64
import json

import pytest
from starlette.requests import Request

from api import supabase_auth_config as auth


def request_with_token(token=None):
    headers = [] if token is None else [(b"authorization", f"Bearer {token}".encode())]
    return Request({"type": "http", "headers": headers, "query_string": b"", "path": "/"})


def unsigned_token(claims):
    payload = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip("=")
    return f"header.{payload}.signature"


def test_missing_supabase_token_is_rejected():
    with pytest.raises(Exception) as raised:
        asyncio.run(auth.verified_session(request_with_token()))

    assert raised.value.status_code == 401


def test_supabase_jwt_fallback_extracts_user_identity(monkeypatch):
    monkeypatch.setattr(auth, "get_sb_admin", lambda: None)
    token = unsigned_token({"sub": "google-user-1", "email": "GoogleUser@example.com"})

    session = asyncio.run(auth.verified_session(request_with_token(token)))

    assert session.get_user_id() == "google-user-1"
    assert session.email == "googleuser@example.com"


def test_supabase_admin_validation_uses_the_user_returned_by_auth(monkeypatch):
    class FakeAuth:
        def get_user(self, token):
            assert token == "access-token"
            return type("Response", (), {
                "user": type("User", (), {
                    "id": "verified-user",
                    "email": "verified@example.com",
                })(),
            })()

    monkeypatch.setattr(auth, "get_sb_admin", lambda: type("Admin", (), {"auth": FakeAuth()})())

    session = asyncio.run(auth.verified_session(request_with_token("access-token")))

    assert session.get_user_id() == "verified-user"
    assert session.email == "verified@example.com"
