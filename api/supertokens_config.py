import os

from fastapi import HTTPException
from supertokens_python import InputAppInfo, SupertokensConfig, init
from supertokens_python.asyncio import get_user
from supertokens_python.framework.fastapi import get_middleware
from supertokens_python.recipe import (dashboard, emailpassword, emailverification, session,
                                       thirdparty)
from supertokens_python.recipe.emailverification import EmailVerificationClaim
from supertokens_python.recipe.session.framework.fastapi import verify_session
from supertokens_python.recipe.session.interfaces import SessionContainer

from api.auth_email import password_reset_email_delivery, verification_email_delivery


API_BASE_PATH = "/api/auth"

app_url_env = (
    os.environ.get("WEBSITE_DOMAIN")
    or os.environ.get("APP_URL")
    or os.environ.get("NEXT_PUBLIC_APP_URL")
)
api_url_env = (
    os.environ.get("API_DOMAIN")
    or os.environ.get("API_URL")
    or os.environ.get("NEXT_PUBLIC_BACKEND_URL")
)
vercel_url = os.environ.get("VERCEL_URL")

if app_url_env:
    APP_URL = app_url_env
elif vercel_url:
    APP_URL = f"https://{vercel_url}"
else:
    APP_URL = "http://localhost:3000"

if api_url_env:
    API_URL = api_url_env
elif vercel_url:
    API_URL = f"https://{vercel_url}"
else:
    API_URL = APP_URL

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
GOOGLE_ENABLED = bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)

recipe_list = [emailpassword.init(email_delivery=password_reset_email_delivery())]
if GOOGLE_ENABLED:
    google = thirdparty.ProviderInput(
        config=thirdparty.ProviderConfig(
            third_party_id="google",
            clients=[thirdparty.ProviderClientConfig(
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET,
            )],
        )
    )
    recipe_list.append(thirdparty.init(
        sign_in_and_up_feature=thirdparty.SignInAndUpFeature(providers=[google])))
recipe_list.extend([
    emailverification.init(mode="REQUIRED", email_delivery=verification_email_delivery()),
    session.init(),
    dashboard.init(),
])

init(
    app_info=InputAppInfo(
        app_name="Meenamma",
        api_domain=API_URL,
        website_domain=APP_URL,
        api_base_path=API_BASE_PATH,
        website_base_path="/auth",
    ),
    framework="fastapi",
    supertokens_config=SupertokensConfig(
        connection_uri=os.environ.get("SUPERTOKENS_CONNECTION_URI") or "http://localhost:3567",
        api_key=os.environ.get("SUPERTOKENS_API_KEY") or None,
    ),
    recipe_list=recipe_list,
)

supertokens_middleware = get_middleware()
verified_session = verify_session()


def _ignore_email_verification(validators, _session, _context):
    return [validator for validator in validators if validator.id != EmailVerificationClaim.key]


bootstrap_session = verify_session(override_global_claim_validators=_ignore_email_verification)


async def session_identity(auth_session: SessionContainer) -> tuple[str, str]:
    user_id = auth_session.get_user_id()
    user = await get_user(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="SuperTokens user not found")
    email = None
    if user.emails:
        email = user.emails[0]
    elif hasattr(user, "login_methods") and user.login_methods:
        for lm in user.login_methods:
            if getattr(lm, "email", None):
                email = lm.email
                break
    if not email:
        raise HTTPException(status_code=401, detail="SuperTokens user email not found")
    return user.id, email
