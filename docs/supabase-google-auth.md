# Supabase Google sign-in and sign-up

The frontend now uses `supabase.auth.signInWithOAuth({ provider: "google" })`.
The same flow handles both an existing Google user and a new Google user; new
users are sent to the existing Meenamma onboarding route after the callback.

## Hosted Supabase setup

1. In Supabase Dashboard, open **Authentication → Providers → Google** and enable
   Google with the Google OAuth client ID and client secret.
2. In Google Cloud, add the Supabase callback URI shown on that provider page to
   **Authorized redirect URIs**. It is normally
   `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In **Authentication → URL Configuration**, set:
   - **Site URL**: `https://meenamma.org`
   - **Redirect URLs** (add all of the following):
     - `http://localhost:3000/**`
     - `http://localhost:5173/**`
     - `https://meenamma.org/**`
     - `https://earn.meenamma.org/**`
     - `https://earn.meenamma.org/auth/callback/google`
     - `https://referrals.meenamma.org/**`
     - `org.meenamma.earn://auth-callback`
     - `org.meenamma.customer://auth-callback`

The browser redirect URL must match the Supabase allow-list. If an unlisted redirect
URL is requested, Supabase GoTrue rejects it and falls back to Site URL (`meenamma.org`).
The frontend contains an automatic cross-subdomain bridge (`meenamma_auth_target=earn`)
that bounces users back to `earn.meenamma.org` with their authenticated session if a fallback occurs.

After enabling Google, verify the provider is active with:

```powershell
Invoke-RestMethod "$env:NEXT_PUBLIC_SUPABASE_URL/auth/v1/settings" `
  -Headers @{ apikey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY }
```

The connected project currently reports `external.google = true`, so the
provider is enabled. The OAuth authorize endpoint also returns a redirect for
the local callback URL.

## Existing profile migration

The old SuperTokens accounts are not automatically copied into Supabase Auth.
Run the migration checker in its default dry-run mode first:

```powershell
api\venv\Scripts\python.exe scripts\migrate_profiles_to_supabase_auth.py
```

Only after reviewing the missing email list should you add `--apply`; that sends
Supabase invitation emails and is an external account change.
