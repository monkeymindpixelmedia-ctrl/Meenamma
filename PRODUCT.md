# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18 + Tailwind CSS + Framer Motion + Lucide React + Supabase Auth / Postgres + FastAPI + Razorpay UPI + WhatsApp Service

## Users

- **Savers:** Individuals and households seeking a low-friction, culturally resonant daily micro-savings mechanism ("Kudam") to build wealth incrementally in small daily steps (₹1 to ₹100/day).
- **Women Micro-Entrepreneurs:** Local women stock agency partners and delivery agents participating in neighborhood-level fulfillment and distribution across Tamil Nadu and Chennai postal districts.
- **Operations & Admins:** Regional managers reviewing partner applications, tracking area-wise delivery coverage, and monitoring savings mandate volume and referral loops.

## Product Purpose

Meenamma digitizes the traditional Tamil micro-savings ceremony ("Kudam"). Savers choose a daily step amount that accumulates over time and settles on a recurring schedule via automated UPI payment mandates. Alongside daily micro-savings, Meenamma creates economic opportunities for women through local micro-fulfillment partner networks.

## Positioning

A South-Asian Neo-Traditional micro-savings and micro-enterprise platform combining Tamil financial rituals with automated bank sweeps, transparent local partner networks, and peer referral loops.

## Operating Context

- Mobile and desktop web browsers, designed mobile-first for quick daily check-ins.
- Localized pincode operations across Chennai (83 PIN zones) and Tamil Nadu (2,023 PIN zones).
- Multi-channel touchpoints: web app dashboards, WhatsApp notifications, and automated recurring payment mandates.

## Capabilities and Constraints

- **Daily Kudam Savings:** Flexible daily step sizing (₹1–₹100/day), savings growth visualizer, and periodic UPI settlement via Razorpay mandates.
- **Authentication & Profiles:** Supabase Auth with Google OAuth, email/password fallback, and profile bootstrapping.
- **Referral Loop System:** User-specific referral links with attribution windows (90-day lock) and partner onboarding incentives.
- **Partner Network Operations:** Multi-tier onboarding for women stock agencies and delivery partners, area-wise PIN mapping, and estimated monthly earnings calculation.
- **Operations Admin Portal:** Protected `/admin` interface with metrics for partner approvals, pincode coverage, and mandate settlements.
- **WhatsApp Communication:** Automated transaction receipts, mandate reminders, and onboarding assistance.

## Brand Commitments

- **Name:** Meenamma (மீனம்மை / மீ)
- **Visual Identity:** South-Asian Neo-Traditional dark theme (deep obsidian canvas `#070605`, translucent glass surfaces, neon gold accents `#FFD700`, electric amber `#F59E0B`, and Tamil heritage typography "மீ").
- **Tone:** Direct, grounded, culturally rooted, respectful, and reliable. No exaggerated financial claims.

## Evidence on Hand

- React frontend with active dashboard, onboarding flow, and savings visualizers (`frontend/src/`).
- Supabase migrations and SQL schema for profiles, partner applications, referrals, and delivery zones (`supabase/migrations/`).
- FastAPI backend routes with SuperTokens/Supabase auth and Razorpay integration (`api/`).
- WhatsApp messaging service (`whatsapp-service/`).

## Product Principles

1. **Ritual over Friction:** Make daily micro-savings feel as natural and dignified as dropping coins into a traditional home Kudam.
2. **Real Local Utility:** Tie digital growth directly to real-world opportunities for women partners in local neighborhoods.
3. **Radical Transparency:** Always display clear calculation bases, fees, payout schedules, and mandate terms without hidden clauses.
4. **Resilient Performance:** Ensure lightweight mobile web performance and fault-tolerant background webhook processing.

## Accessibility & Inclusion

- Support bilingual context (English and Tamil scripts) where appropriate.
- Maintain WCAG AA contrast standards across obsidian-and-gold color tokens.
- Ensure touch targets (minimum 44x44px) and clear feedback states on mobile browsers.
