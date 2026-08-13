# Meenamma — PRD

## Original Problem Statement
Build a premium, high-end mobile app strictly following the "Temple Gold & Henna" aesthetic (Deep Henna #4A1C17, Temple Gold #C5A059, Sandalwood #F4EBD0; Cormorant Garamond + Montserrat). Savings Mandala widget (60fps), Anti-Slop Protocol, "Ritual" splash. Meenamma = premium seafood pre-booking + micro-savings (Kudam cycles).

## User Choices
- Mobile-first React web app; full scope Splash → Landing → Dashboard → Storefront
- Razorpay TEST keys (rzp_test_TP3j9GPluzWOLf)
- **June 2026 pivot (user-mandated): FULL migration MongoDB+custom JWT → Supabase (Auth + PostgreSQL). MongoDB is DEAD.**
- Landing overhaul: Narrative Scroll Journey + Live Catch Dashboard with REAL computed stats; 15 seeded products
- Tamil/English toggle: deferred

## Architecture (current)
- Frontend: React 18 (CRA) + Tailwind + Framer Motion + supabase-js 2.49.4
  - Auth in browser via supabase-js (signInWithPassword/signUp); axios interceptor (lib/api.js) attaches `Authorization: Bearer <supabase access_token>` on all /api calls
- Backend: FastAPI single server.py — verifies Supabase JWT locally (ES256 via JWKS, HS256 fallback via auth.get_user); all data via supabase-py (service role key, bypasses RLS); PostgREST session hardened (keepalive_expiry=15s, transport retries=2)
- DB: Supabase Postgres project sejfusqyxtmejbwppexe. Schema M1–M12 in /app/supabase/migration (M12 = kudams/kudam_deposits/kudam_payment_attempts + profile app fields, applied via Management API)
  - profiles (display_name, daily_plan, pincode, upi_id; trigger auto-creates on auth signup)
  - products (display_en jsonb holds name/tamil_name/origin/story/handling; media jsonb; status published/draft/archived ↔ available toggle; species+cuts FKs auto-managed)
  - bookings = orders + order_items + payment_attempts + payments (order snapshots immutable after draft; statuses: pending_payment→confirmed→ready→delivered/cancelled)
  - savings = kudams (goal_paise/saved_paise) + kudam_deposits + kudam_payment_attempts
  - admin role = staff_role_assignments role=ops_admin
- Migrations/DDL: apply via Supabase Management API `POST /v1/projects/sejfusqyxtmejbwppexe/database/query` with the user's sbp_ token (user provided; DDL blocked over PostgREST)
- Seed: /app/backend/seed.py (idempotent — admin+demo users, ops_admin role, demo kudam, 15 products)

## Implemented (June 2026 — Supabase migration session)
- Full backend rewrite to Supabase (auth/me, PATCH /me, kudams CRUD+deposits, rewards, products, bookings, Razorpay create-order/verify for deposits & bookings, admin stats/products CRUD/bookings/kudams/users/upload, GET /api/stats/live)
- Frontend: AuthContext on supabase-js sessions; Login/Register wired to GoTrue; session persistence + logout; Admin statuses → confirmed/ready/delivered/cancelled
- Landing overhaul: cinematic AI-editorial hero (Kasimedu dawn boats), Live Catch Dashboard (6 animated real counters from /api/stats/live), 4-chapter Narrative Scroll Journey, Two Paths, footer
- 15 products seeded (6 original Unsplash + 9 AI editorial photos); fixture/duplicate products archived
- mailer_autoconfirm enabled on Supabase (no email confirmation needed)
- Quick Demo buttons (demo + admin autofill) preserved and working

## Testing
- iteration_1..3 (old Mongo era): obsolete
- iteration_3 (Supabase era, June 2026): 27/27 backend pytest (/app/backend/tests/test_supabase_api.py), 100% frontend (login, register ritual, dashboard kudam create + persistence, market 15 products, admin all tabs, session reload, logout). Transient PostgREST disconnect fixed post-test (keepalive/retry).

## Credentials
- Admin: admin@meenamma.in / TempleGold@2026 · Demo: demo@meenamma.in / meenamma2026 (see /app/memory/test_credentials.md — includes curl token recipe)

## Implemented (June 2026 — Reservations + Ceremony session)
- **Off-season Catch Reservations**: unavailable fish → "Off the boat — Reserve with 25%" (Market sheet reserve mode, no date, advance breakdown); POST /api/reservations/create-order (25% advance via Razorpay, guarded: published fish rejected); admin toggling fish back available flips reservations reserved→arrived + queues notification_outbox row (event catch_arrived — email sending itself NOT wired yet, MOCKED as outbox log); user completes on dashboard (date picker + 75% balance) → confirmed order. M13 migration (public.reservations) applied + saved to /app/supabase/migration.
- **Kudam Gold Shimmer Ceremony**: full-screen henna overlay, 34 falling gold flakes, pulsing gold rings, shimmer-sweep, gradient-animated "The Kudam is full." heading, glowing mandala — triggers when any deposit completes a kudam.
- Dashboard "Reserved catches · Your place in the queue" section; demo account holds one completed Ooli reservation (₹230 advance → ₹920 confirmed order). Kaala kept off-season as the reservation demo fixture.
- NOTE: a parallel job added UPI Autopay (Razorpay subscriptions: /api/autopay/subscribe|verify|cancel, simulate-deposit, autopay UI) — untested here (needs real UPI mandate).
- Tested: iteration_4 — 12/12 backend, 100% frontend (reserve sheet, dashboard section, celebration overlay).

## Backlog
- P1: Real email sending for catch-arrived + booking alerts (notification_outbox is queued; plug Resend/SendGrid worker — user chose "mail", riders/delivery later)
- P1: Delivery slot picker (6 AM / 7 AM) on booking sheet
- P1: Razorpay webhook endpoint (payment_webhook_events table already exists in schema)
- P2: Redeem kudam balance against a booking
- P3: Tamil/English bilingual toggle (locale column + display_ta jsonb already in schema)
- Cosmetic: React Router v7 future-flag console warnings
