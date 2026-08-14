# SuperTokens authentication setup and test playbook

Meenamma uses SuperTokens for authentication and Supabase for application data. Browser authentication
uses `/api/auth`; application profile data remains in `public.profiles`.

## Required configuration

Configure these backend variables locally and in every Vercel environment that serves the API:

- `SUPERTOKENS_CONNECTION_URI`
- `SUPERTOKENS_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_URL` (the public website origin)
- `API_URL` (the public API origin; use the website origin for this same-origin Vercel app)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

The Create React App build needs these variables at build time:

- `REACT_APP_SUPERTOKENS_APP_NAME` (optional; defaults to `Meenamma`)
- `REACT_APP_SUPERTOKENS_API_DOMAIN`
- `REACT_APP_SUPERTOKENS_WEBSITE_DOMAIN`
- `REACT_APP_API_URL`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

Never expose `GOOGLE_CLIENT_SECRET`, `SUPERTOKENS_API_KEY`, or the Supabase service-role key through a
`REACT_APP_*` variable. Those values are compiled into public browser JavaScript.

The linked Vercel project must be configured separately; local `.env` files are not uploaded by a
build. Add variables for Production, Preview, and Development as appropriate, then redeploy so the
frontend build receives its `REACT_APP_*` values.

## Google OAuth

In the Google Cloud Console OAuth client, add the website origin to **Authorized JavaScript origins**.
Add this exact **Authorized redirect URI** for every deployed website domain:

```text
<WEBSITE_DOMAIN>/auth/callback/google
```

For local development, register `http://localhost:3000` as an origin and
`http://localhost:3000/auth/callback/google` as a redirect URI. Keep the client secret on the backend.

## Database migration and seed

Apply migrations through `20260814000014_m14_supertokens_identity.sql` before creating new users. M14
detaches `public.profiles.id` from `auth.users` while preserving existing rows.

Then seed from the repository root:

```powershell
python -m pip install -r api/requirements.txt
python api/seed.py
```

The seed is idempotent. It creates or updates email/password recipe users, maps existing Supabase
profile UUIDs through SuperTokens user-ID mapping, and marks operator seed accounts verified. The admin
email and password must come from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Email verification

Email verification is `REQUIRED`. Unverified email/password sessions can only bootstrap their profile
and use verification endpoints; protected application APIs reject them. The verification page is
`/auth/verify-email`.

Without a custom delivery service, SuperTokens uses its default email service. This works for functional
testing but may use a shared sender and land in spam. Configure custom SMTP/email delivery before relying
on a branded production sender.

## Local run

Run the API and frontend in separate terminals:

```powershell
uvicorn api.index:app --reload --port 8000
```

```powershell
Set-Location frontend
npm install
npm start
```

Use `http://localhost:3000`. Frontend and backend must agree on `/api/auth` as the SuperTokens API base
path and `/auth` as the website auth base path.

## Browser test matrix

1. Register a new email. Confirm `/auth/verify-email` opens, sends one message, and protected pages stay
   unavailable before verification.
2. Open the verification link. Confirm it verifies the token and then opens `/dashboard`.
3. Sign out, sign in with email/password, and refresh a protected page. Confirm the session survives.
4. Use **Continue with Google**. Confirm Google returns to `/auth/callback/google`, creates a profile only
   on first sign-in, and opens `/dashboard`.
5. Sign out and confirm `/dashboard`, `/profile`, and `/admin` redirect to `/login`.
6. Try an expired verification link and confirm the resend action works.
7. Confirm an ordinary user cannot open `/admin` and an assigned operator still can.

Automated auth checks:

```powershell
python -m pytest api/tests/test_supertokens_auth.py -q
Set-Location frontend
npm test -- --watchAll=false
```
