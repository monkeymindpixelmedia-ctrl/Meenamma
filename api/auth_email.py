import asyncio
import html
import os

from supertokens_python.ingredients.emaildelivery.types import (
    EmailDeliveryConfig,
    EmailDeliveryInterface,
)
from supertokens_python.recipe.emailpassword.types import PasswordResetEmailTemplateVars
from supertokens_python.recipe.emailverification.types import VerificationEmailTemplateVars

from api.notify import send_email


class ResendVerificationService(EmailDeliveryInterface[VerificationEmailTemplateVars]):
    async def send_email(self, template_vars: VerificationEmailTemplateVars, user_context: dict) -> None:
        link = html.escape(template_vars.email_verify_link, quote=True)
        body = (
            '<div style="font-family:Georgia,serif;color:#4A1C17;max-width:560px">'
            "<h2>Verify your Meenamma email</h2>"
            "<p>Confirm your email address to open your kudam.</p>"
            f'<p><a href="{link}" style="background:#4A1C17;color:#fff;padding:12px 18px;'
            'text-decoration:none">Verify email</a></p>'
            "<p>If you did not create this account, you can ignore this message.</p>"
            "</div>"
        )
        response = await asyncio.to_thread(
            send_email,
            template_vars.user.email,
            "Verify your Meenamma email",
            body,
        )
        if response is None:
            raise RuntimeError("Resend email delivery is not configured")


def verification_email_delivery():
    if not os.environ.get("RESEND_API_KEY"):
        return None
    return EmailDeliveryConfig(service=ResendVerificationService())


class ResendPasswordResetService(EmailDeliveryInterface[PasswordResetEmailTemplateVars]):
    async def send_email(self, template_vars: PasswordResetEmailTemplateVars, user_context: dict) -> None:
        link = html.escape(template_vars.password_reset_link, quote=True)
        body = (
            '<div style="font-family:Georgia,serif;color:#4A1C17;max-width:560px">'
            "<h2>Reset your Meenamma password</h2>"
            "<p>Use the link below to choose a new password. It expires in one hour.</p>"
            f'<p><a href="{link}" style="background:#4A1C17;color:#fff;padding:12px 18px;'
            'text-decoration:none">Reset password</a></p>'
            "<p>If you did not request this, you can ignore this message and your "
            "password stays unchanged.</p>"
            "</div>"
        )
        response = await asyncio.to_thread(
            send_email,
            template_vars.user.email,
            "Reset your Meenamma password",
            body,
        )
        if response is None:
            raise RuntimeError("Resend email delivery is not configured")


def password_reset_email_delivery():
    if not os.environ.get("RESEND_API_KEY"):
        return None
    return EmailDeliveryConfig(service=ResendPasswordResetService())
