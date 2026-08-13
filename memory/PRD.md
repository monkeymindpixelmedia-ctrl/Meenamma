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
- Ritual splash, light Minimal Temple theme (#FAF5E6 bg, henna text, white cards, gold borders), responsive editorial masonry (3-col desktop / edge-to-edge mobile with sticky bottom nav + FAB)
- Dual-mode dashboard: Daily Kudam (plan ₹1/5/10, Pay-₹X-today, quick deposits, completion celebration + 20% feast discount reward) vs Fresh Catch (masonry market, slide-up booking sheet, server-computed prices w/ discount redemption)
- JWT auth (bcrypt, httpOnly cookies, brute-force lockout w/ X-Forwarded-For); 3-step signup ritual (details+PIN serviceability → plan selection → simulated UPI connect → welcome screen); pincode/upi_id persisted
- Quick Demo logins on /login: demo user (demo@meenamma.in/meenamma2026, seeded w/ 66% Sunday Feast kudam) + Store Admin; password visibility toggle
- Profile page /profile (edit name/plan/pincode/UPI via PATCH /api/me)
- Premium numerals: Bodoni Moda (large), Playfair Display tabular (small), gold ₹; contrast pass
- Store Manager admin /admin: stats, product CRUD with image upload (POST /api/admin/upload → /api/uploads/*), availability toggle switch, order status workflow, kudams, customers
- Success toast on deposits; empty-orders CTA; haptic feedback

## Testing
- iteration_1: dark MVP (fixed brute-force proxy IP); iteration_2 (redesign): 22/22 backend + all frontend; iteration_3 (polish): found register pincode persistence bug → FIXED; login-verification run: 27/27 backend, 100% frontend all login paths, session persistence, mobile
- 'Login not working' report: not reproducible after fixes (stale lockouts cleared + register persistence); all paths verified by testing agent

## Credentials
- Admin: admin@meenamma.in / TempleGold@2026 (see /app/memory/test_credentials.md)

## Backlog
- P0: Razorpay webhook endpoint for out-of-band payment confirmation
- P1: Tamil/English bilingual toggle; kudam completion celebration animation; redeem kudam balance against a booking
- P2: Booking pickup reminders; admin catch management; deposit history timeline on dashboard; Mongo transactions for deposit writes
