# Meenamma — PRD

## Original Problem Statement
Build a premium, high-end mobile app strictly following the "Temple Gold & Henna" aesthetic (Deep Henna #4A1C17, Temple Gold #C5A059, Sandalwood #F4EBD0; Cormorant Garamond + Montserrat). Implement the Savings Mandala widget exactly as provided (smooth 60fps), Anti-Slop Protocol (no generic Material defaults), a "Ritual" splash screen with editorial feel, and the provided Design DNA. Meenamma = premium seafood pre-booking + micro-savings (Kudam cycles).

## User Choices
- Mobile-first React web app (not Flutter/Next.js — env constraint accepted by user)
- Full scope: Splash → Landing → Sovereign Dashboard → Artisan Storefront
- Razorpay TEST keys provided by user (rzp_test_TP3j9GPluzWOLf)
- Auth: user asked Better Auth → not feasible (Node-only); user approved JWT email/password (bcrypt + httpOnly cookies)
- Tamil/English toggle: deferred

## Architecture
- Frontend: React 18 (CRA) + Tailwind (custom tokens) + Framer Motion + lucide-react, mobile shell max-w-md
- Backend: FastAPI single server.py — auth, kudams, products, bookings, Razorpay payments
- DB: MongoDB (users, kudams, deposits, products, bookings, transactions, login_attempts)
- Payments: Razorpay checkout.js on frontend; create-order + signature verify on backend

## Implemented (June 2026)
- Ritual splash: animated mandala draw-in, Tamil மீ monogram, MEENAMMA reveal, auto-nav ~4.2s
- Landing: editorial hero, "Begin Your Kudam" / "View Today's Catch" CTAs, mandala proverb section, 3-step ritual cards
- JWT auth: register/login/logout/me/refresh, bcrypt, admin seeding, brute-force lockout (X-Forwarded-For aware), indexes
- Sovereign Dashboard: SavingsMandala (rotating henna ring + liquid gold fill + shimmer wave), multi-kudam, quick amounts, Razorpay deposits, bookings list
- Artisan Storefront: 6 seeded Tamil Nadu catches with oval cameo photos, source-story bloom reveal, qty+date pre-booking via Razorpay
- Bottom nav (Temple/Kudam/Catch) for logged-in users
- "The Curator" admin panel at /admin (admin role only; user chose this over migrating to Payload CMS template): Overview stats, product CRUD, all bookings with status workflow (confirmed/ready/collected/cancelled), all kudams, patron list. Crown icon on dashboard header opens it.

## Testing (iteration_1)
- Backend 13/13 after brute-force fix; Frontend 23/23 assertions passed
- Razorpay order creation hits live test API; payment completion not automated (test card 4111 1111 1111 1111)

## Credentials
- Admin: admin@meenamma.in / TempleGold@2026 (see /app/memory/test_credentials.md)

## Backlog
- P0: Razorpay webhook endpoint for out-of-band payment confirmation
- P1: Tamil/English bilingual toggle; kudam completion celebration animation; redeem kudam balance against a booking
- P2: Booking pickup reminders; admin catch management; deposit history timeline on dashboard; Mongo transactions for deposit writes
