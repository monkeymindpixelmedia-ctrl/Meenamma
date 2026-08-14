import asyncio
from types import SimpleNamespace

import pytest
from supertokens_python.ingredients.emaildelivery.types import EmailDeliveryConfig

from api import auth_email


def verification_template(email="member@example.test", link=None):
    return SimpleNamespace(
        user=SimpleNamespace(email=email),
        email_verify_link=link or "https://app.example.test/auth/verify-email?token=test-token",
    )


def test_resend_receives_recipient_subject_and_escaped_verification_link(monkeypatch):
    sent = []
    unsafe_link = (
        'https://app.example.test/auth/verify-email?token=<token>&next="/dashboard"'
    )

    def fake_send_email(recipient, subject, body):
        sent.append((recipient, subject, body))
        return {"id": "email-1"}

    monkeypatch.setattr(auth_email, "send_email", fake_send_email)

    asyncio.run(auth_email.ResendVerificationService().send_email(
        verification_template(link=unsafe_link), {}))

    recipient, subject, body = sent[0]
    assert recipient == "member@example.test"
    assert subject == "Verify your Meenamma email"
    assert (
        'href="https://app.example.test/auth/verify-email?token=&lt;token&gt;'
        '&amp;next=&quot;/dashboard&quot;"'
    ) in body


def test_missing_resend_api_key_keeps_default_email_delivery(monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)

    assert auth_email.verification_email_delivery() is None


def test_configured_resend_api_key_creates_email_delivery_config(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "unit-test-resend-key")

    delivery = auth_email.verification_email_delivery()

    assert isinstance(delivery, EmailDeliveryConfig)
    assert isinstance(delivery.service, auth_email.ResendVerificationService)


def test_configured_service_propagates_send_failure(monkeypatch):
    def failing_send_email(_recipient, _subject, _body):
        raise RuntimeError("Resend request failed")

    monkeypatch.setattr(auth_email, "send_email", failing_send_email)

    with pytest.raises(RuntimeError, match="Resend request failed"):
        asyncio.run(auth_email.ResendVerificationService().send_email(
            verification_template(), {}))
