# Test Credentials — Meenamma (Supabase)

## Architecture (June 2026 migration)
- Auth: Supabase Auth (GoTrue) — frontend uses supabase-js signInWithPassword/signUp; FastAPI verifies Supabase JWT (ES256 via JWKS)
- DB: Supabase PostgreSQL (project sejfusqyxtmejbwppexe). MongoDB REMOVED.
- Frontend sends `Authorization: Bearer <supabase access_token>` on all /api calls (axios interceptor in lib/api.js)

## Admin account (Store Manager)
- Email: admin@meenamma.in
- Password: TempleGold@2026
- Role: admin (staff_role_assignments role=ops_admin in Supabase)

## Demo user (Quick Demo button on /login)
- Email: demo@meenamma.in
- Password: meenamma2026
- Seeded with kudam "Sunday Feast" ~335/500

## Auth flow
- Login/Register happen directly against Supabase from the browser (no /api/auth/login endpoint anymore)
- GET /api/auth/me — returns profile (requires Bearer token)
- PATCH /api/me — update profile
- To get a token via curl:
  POST https://sejfusqyxtmejbwppexe.supabase.co/auth/v1/token?grant_type=password
  headers: apikey: <REACT_APP_SUPABASE_ANON_KEY from frontend/.env>
  body: {"email":"demo@meenamma.in","password":"meenamma2026"}

## Admin panel
- /admin route (admin role only). Admin endpoints under /api/admin/* (stats, products CRUD, bookings + status PATCH, kudams, users, upload).

## Public endpoints
- GET /api/products, GET /api/stats/live (Live Catch Dashboard), GET /api/health

## Razorpay (TEST MODE)
- Key ID: rzp_test_TP3j9GPluzWOLf (in backend/.env)
- Test card: 4111 1111 1111 1111, any future expiry, any CVV
