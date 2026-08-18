# Phase 1: Operations, Partner Network, and Growth - Research

**Researched:** 2026-08-19
**Domain:** Partner onboarding, Supabase/Postgres operations, referral attribution, admin analytics, and tutorial video delivery
**Confidence:** HIGH for repository facts and Supabase patterns; MEDIUM for the recommended partner and revenue model; MEDIUM/LOW for the Remotion/HyperFrames integration boundary because no direct official adapter was found

## User Constraints

No `*-CONTEXT.md` file exists for this phase. Therefore there are no additional locked decisions, discretion areas, or deferred ideas to copy from CONTEXT.md.

The following constraints are confirmed by the project roadmap and state and must be preserved:

- Authentication uses Supabase Auth with Google and password sign-in.
- The protected `/dashboard` route contains Daily Kudam and savings controls.
- Referral codes and referral windows are implemented in the current branch.
- Existing Supabase schema and API should be extended rather than replaced.
- Phase 1 must cover the nine requirements R1-R9: pincode-wise women stock-agency counts, area-wise women delivery-partner counts, both signups, both approximate monthly revenue figures, referral links, signup tutorial media, and an admin dashboard.

## Phase Requirements

| ID | Description | Research support |
|---|---|---|
| R1 | Pincode-wise total number of women stock agencies | Use approved active partner records plus normalized stock-agency service locations; aggregate with `count(distinct partner_id)` by six-digit pincode. |
| R2 | Area-wise total number of women delivery partners | Link delivery partners to existing `delivery_zones`/`delivery_zone_coverage`; aggregate distinct approved active partners by canonical area key. |
| R3 | Stock agency signup | Add a dedicated authenticated partner-application flow and state machine; do not overload customer `/profile/bootstrap`. |
| R4 | Delivery partner signup | Reuse the same flow with role-specific details and one-to-many delivery coverage rows. |
| R5 | Approximate stock agency monthly revenue | Store immutable monthly estimates with explicit basis, input values, formula version, and confidence; do not label order GMV as personal income. |
| R6 | Approximate delivery partner monthly revenue | Calculate from completed deliveries and configured payout/incentive rules, with self-reported fallback clearly marked as estimated. |
| R7 | Referral link | Preserve the current `profiles.referral_code`, `profiles.referred_by`, local `meenamma_ref`, and 90-day window; attach a separate immutable attribution to partner applications. |
| R8 | Signup tutorial using Remotion and HyperFrames | Use a separate versioned video workspace and shared tutorial manifest; render a reviewed static MP4, then publish it as content/media consumed by the CRA app. |
| R9 | Admin dashboard | Extend the protected `/admin` surface with lazy-loaded partner metrics, application review, revenue estimates, filters, and paginated detail endpoints. |

## Business Answers (Non-Technical)

This section answers the nine questions in simple business language. These are planning numbers, not promises. The product does not yet have stock-agency or delivery-partner records, so current partner counts should be shown as **0 recorded / awaiting signup** until applications are approved.

### 1. Tamil Nadu and Chennai PIN-code baseline

A PIN code means a unique six-digit postal code, not the number of post-office branches. The current working baseline is **83 unique PIN codes in Chennai district** and **2,023 unique PIN codes across Tamil Nadu**. Chennai district is different from the wider Chennai metropolitan area; the app should use the district/service-area value selected by Operations.

The table below has all 38 Tamil Nadu districts. It is a planning baseline calculated from a current district-mapped PIN directory and should be refreshed before launch from the official [India Post PIN-code list](https://www.indiapost.gov.in/rti/pincodelist). The district mapping snapshot used for this estimate is available in the [India postal PIN/LGD dataset](https://github.com/bilal-webdev/india-postal-pincode-dataset).

| District | Unique PIN codes |
|---|---:|
| Ariyalur | 29 |
| Chengalpattu | 58 |
| Chennai | 83 |
| Coimbatore | 106 |
| Cuddalore | 67 |
| Dharmapuri | 32 |
| Dindigul | 58 |
| Erode | 59 |
| Kallakurichi | 32 |
| Kancheepuram | 30 |
| Kanniyakumari | 65 |
| Karur | 36 |
| Krishnagiri | 37 |
| Madurai | 57 |
| Mayiladuthurai | 51 |
| Nagapattinam | 39 |
| Namakkal | 58 |
| Perambalur | 24 |
| Pudukkottai | 53 |
| Ramanathapuram | 58 |
| Ranipet | 40 |
| Salem | 89 |
| Sivaganga | 66 |
| Tenkasi | 50 |
| Thanjavur | 101 |
| The Nilgiris | 46 |
| Theni | 30 |
| Thiruvarur | 72 |
| Thoothukudi | 91 |
| Tiruchirappalli | 89 |
| Tirunelveli | 77 |
| Tirupathur | 27 |
| Tiruppur | 65 |
| Tiruvallur | 60 |
| Tiruvannamalai | 70 |
| Vellore | 51 |
| Viluppuram | 58 |
| Virudhunagar | 59 |
| **Tamil Nadu total** | **2,023** |

Note: Postal and government sources may spell this district as `Thiruvallur` or `Tiruvallur`. For the product, normalize the spelling to **Tiruvallur** and count it once so the dashboard has 38 districts and does not create a duplicate row.

### 2. Area-wise women delivery partners and how to recruit drivers

There is no verified partner count yet. The dashboard should calculate the actual number as:

`approved + active + women-led delivery partners, counted once per service area`

For a Chennai pilot, a practical launch target is **20 women delivery partners** across four operating zones. This is a recruitment target, not the current count:

| Chennai launch area | Suggested active-driver target | Reason |
|---|---:|---|
| North Chennai | 5 | Dense residential and market routes |
| Central Chennai | 5 | High order frequency and short routes |
| West Chennai | 4 | Wider routes and lower initial density |
| South Chennai | 6 | Larger spread of residential communities |
| **Pilot target** | **20** | Review after the first 30 days |

Driver planning formula:

`drivers required = ceiling(expected deliveries per day / 20 deliveries per driver × 1.2 peak buffer)`

Example: 300 deliveries per day needs `300 / 20 × 1.2 = 18` drivers, so recruit **20** to cover leave, peak days, and onboarding gaps. Recruit through women’s self-help groups, local community organisations, existing customer referrals, neighbourhood WhatsApp groups, and a simple interest form until the partner app is ready. The dashboard should show both the actual approved count and the target gap, for example `12 active / 20 target = 8 more needed`.

### 3. Stock-agency signup

The stock-agency signup app is **not ready yet**. Until it is released, use a temporary manual process:

1. Share a short Google Form or WhatsApp/phone registration link.
2. Capture name, phone, business name, address, district, PIN code, storage capacity, product categories, bank/UPI details, and women-led status.
3. Operations calls the applicant, checks the location and documents, and marks the application `pending`, `approved`, or `rejected` in an internal sheet.
4. Move approved agencies into the app after the signup flow is released.

No agency should be shown as active in metrics until Operations approves it.

### 4. Delivery-partner signup

The delivery-partner signup app is also **not ready yet**. Use the same temporary form/WhatsApp process and collect name, phone, district, preferred service areas/PIN codes, vehicle type, availability, emergency contact, bank/UPI details, and women-led status. Operations then verifies the person, provides a short route/safety orientation, and adds the partner to the approved-driver list.

When the app is ready, the flow should be: choose “Delivery Partner” → create/login to account → select areas → upload required documents → submit → wait for review → receive approval and start accepting routes.

### 5. Approximate monthly stock-agency revenue

Use the phrase **estimated monthly agency margin**, not guaranteed income or net profit. A simple launch model is:

`monthly gross margin = orders per day × average order value × 26 operating days × 8% agency margin`

| Agency level | Example calculation | Estimated gross margin | Example monthly operating costs | Approx. balance before tax |
|---|---|---:|---:|---:|
| Starter | 15 orders/day × ₹650 × 26 × 8% | ₹20,280 | ₹8,000 | ₹12,280 |
| Growing | 30 orders/day × ₹700 × 26 × 8% | ₹43,680 | ₹15,000 | ₹28,680 |
| Established | 50 orders/day × ₹800 × 26 × 8% | ₹83,200 | ₹25,000 | ₹58,200 |

Example: a growing agency processes `30 × 26 = 780` orders per month. At an average basket of ₹700, order value is `780 × ₹700 = ₹5,46,000`; at 8%, the estimated agency margin is **₹43,680** before rent, staff, packing, electricity, spoilage, transport, and tax. The final percentage must be approved by Meenamma Finance.

### 6. Approximate monthly delivery-partner revenue

Use the phrase **estimated delivery payout**, because the final amount depends on the approved per-delivery rate, incentives, distance, cancellations, and expenses. A simple example is:

`gross payout = completed deliveries per day × payout per delivery × 26 operating days`

| Working pattern | Example calculation | Estimated gross payout | Example fuel/data cost | Approx. balance before tax |
|---|---|---:|---:|---:|
| Part-time | 10 deliveries/day × ₹35 × 26 | ₹9,100 | ₹1,500 | ₹7,600 |
| Regular | 20 deliveries/day × ₹40 × 26 | ₹20,800 | ₹4,000 | ₹16,800 |
| Full-time | 30 deliveries/day × ₹45 × 26 | ₹35,100 | ₹6,000 | ₹29,100 |

Example: a regular partner completes `20 × 26 = 520` deliveries in a month. At ₹40 per completed delivery, the gross payout is **₹20,800**. Meenamma should show the number of completed deliveries, rate, incentive, and deductions separately so the partner can understand how the amount was calculated.

### 7. Referral link screenshots

The referral link can follow the current project pattern:

`https://<meenamma-domain>/register?ref=<referral_code>`

There is no production screenshot yet because the partner signup screen is not ready. The screenshot to capture after implementation should show:

```text
┌────────────────────────────────────────┐
│ Invite women to grow with Meenamma     │
│ Your referral link                      │
│ meenamma.app/register?ref=MEENA123     │
│ [ Copy link ]     [ Share on WhatsApp ]│
│ Referrals joined: 0   Reward: Pending   │
└────────────────────────────────────────┘
```

Acceptance check for the real screenshot: opening the link must preserve the code through login/email confirmation, reject self-referrals, and show the referral source after successful signup. Do not use a placeholder screenshot as proof that the feature is complete.

### 8. Signup tutorial and signup-page screenshots

The signup tutorial and partner signup page are **not yet available to screenshot**. The first screenshot pack should contain:

1. Partner-role selection: `Stock Agency` or `Delivery Partner`.
2. Basic details form and PIN/area selection.
3. Document/verification upload state.
4. Review-pending confirmation page.
5. Approved status and next steps.

Recommended tutorial sequence: 45–60 seconds, with one clear action per screen—choose role, create account, fill details, choose area, submit, wait for approval, and start earning. For the Meenamma visual direction, use the existing obsidian `#070605` canvas, glass surfaces, neon gold `#FFD700` accents, serif headings, and tabular-monospace figures. Keep large, readable text and two clear focal points per frame so the video reads on a phone; publish one reviewed static MP4 and poster after the UI is final.

### 9. Admin dashboard explanation

The admin dashboard is the Operations control room. It should answer “how many partners do we have, where are they, what needs review, and what are the estimated payouts?” in one place.

| Dashboard area | What it shows |
|---|---|
| Summary cards | Active stock agencies, active women delivery partners, covered PIN codes/areas, pending applications, estimated agency margin, and estimated delivery payout |
| Stock agencies | District/PIN-wise agency count, approval status, capacity, and last activity |
| Delivery partners | Area-wise active-driver count, target count, gap to target, availability, and completed deliveries |
| Application queue | New, pending, approved, rejected, and suspended applications with reviewer notes |
| Revenue view | Month, partner type, completed orders/deliveries, formula inputs, estimated gross amount, costs/adjustments, and confidence/basis |
| Referral view | Referral code, applications started, approved partners, and resulting active partner count |

Example operational reading: `Chennai South — 4 active drivers / 6 target — 2 recruitment gap`. An admin can filter by district, PIN code, partner type, women-led verification state, status, and month; export summary data; and open a partner record for review. Customer-facing users must not see private documents, phone numbers, reviewer notes, or other partners’ revenue information.

## Summary

The existing repository already has the right foundation: React 18 with CRA, Supabase Auth in the browser, a FastAPI `/api` router, a service-role Supabase client on the server, migration-managed Postgres schema, existing staff-role assignments and RLS, a protected `/admin` page, and referral code/window logic. The phase should add a partner domain beside `profiles`, `orders`, and `delivery_zone_coverage`, not create a second authentication or API stack.

The recommended model is a core `partner_profiles`/`partner_applications` record with a `partner_type` of `stock_agency` or `delivery_partner`, explicit review states, a self-attested/verified women-led status, normalized service-area rows, immutable referral attribution, and monthly revenue-estimate snapshots. Only `approved` + `active` + eligible women-led records should contribute to R1/R2. Application owners should see their own records; all review, aggregate, and sensitive revenue operations should stay behind FastAPI and the existing admin guard.

Revenue must be presented as an estimate, not a financial fact. Use server-side formulas over auditable inputs and configured compensation rules, store the formula version, and distinguish platform-derived, self-reported, and hybrid estimates. The dashboard should query Postgres aggregates/RPCs rather than downloading all partner rows into Python or the browser.

For the tutorial, keep video production outside the CRA bundle. Remotion is the React-oriented authoring/preview path; HyperFrames is HTML/CSS-native and deterministic. Current primary documentation describes both as rendering systems but does not document a direct integration adapter. Share a versioned storyboard/content manifest between the two, choose one approved output per locale, and host the resulting MP4/poster through existing content and Supabase Storage patterns. Do not generate videos per signup or expose HeyGen/HyperFrames credentials in browser code.

**Primary recommendation:** Add migration-managed partner/application, location, attribution, and revenue-snapshot tables; expose narrowly scoped FastAPI endpoints; use Postgres aggregate queries for metrics; and publish a reviewed, static, versioned tutorial asset produced from a shared Remotion/HyperFrames manifest.

## Current Repository Findings

### Confirmed reusable implementation

| Area | Confirmed finding | Planning implication | Confidence |
|---|---|---|---|
| Frontend | `frontend/src/App.js` already protects `/dashboard`, `/profile`, `/referral`, and `/admin`; `AdminOnly` checks `user.role === "admin"`. | Add partner signup routes and an admin partner tab within the existing router/shell. Preserve the current protected route pattern. | HIGH |
| Auth | `frontend/src/context/AuthContext.js` uses `supabase.auth.signUp`, `signInWithPassword`, Google OAuth, session listeners, and `/auth/me`. | Partner signup should reuse AuthContext/session handling but call a new partner endpoint after authentication. Do not create a second auth context. | HIGH |
| API client | `frontend/src/lib/api.js` injects the Supabase access token into Axios requests. | New endpoints need no new client transport; add typed-ish helper functions or direct `api` calls following existing patterns. | HIGH |
| API | `api/index.py` creates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY`, verifies the session through `verified_session`, syncs profiles, and uses `get_admin_user` for `/admin/*`. | Keep service-role access server-only; every new user endpoint still needs the current-user dependency, and every admin endpoint needs an explicit staff/admin dependency. | HIGH |
| Profiles | `profiles` has identity, status, `display_name`, phone/email, optional `pincode`, `referral_code`, `referred_by`, and savings fields. | Do not use `profiles.pincode` as a partner service location; it is optional customer/profile data. Add partner-specific normalized location rows. | HIGH |
| Staff authorization | `staff_role_assignments` has `ops_admin`, `catalogue_manager`, `fulfilment_manager`, `support_agent`, and `finance_manager`; `app_has_staff_role()` is security-definer and time-window aware. | Partners are not staff roles. Keep partner type/status in partner tables and use existing staff roles for review access. Start with `ops_admin` for the current admin page; add route-specific fulfilment/content permissions only if required. | HIGH |
| Existing zones | `delivery_zones` and `delivery_zone_coverage` already hold state, district, locality, postal code, coverage type, status, priority, and archive fields. | Delivery partner areas should reference existing canonical coverage/zone records where possible, rather than inventing free-text geography. | HIGH |
| Existing admin | `Admin.jsx` loads `/admin/stats`, `/products`, `/admin/bookings`, `/admin/kudams`, and `/admin/users` together; stats and list endpoints pull broad result sets. | Add a lazy-loaded Partner Network tab and separate aggregate/detail endpoints. Do not append expensive partner joins to the initial page load. | HIGH |
| Existing referrals | `Shell` captures `?ref=` into `localStorage` as `meenamma_ref`; `/profile/bootstrap` resolves it server-side; `referrals.py` defines a 90-day window; `/referrals` lists referred profiles. | Preserve current household behavior. Add partner application attribution without trusting client-supplied referrer IDs or replacing an existing `referred_by`. | HIGH |
| Existing content | `content_entries` supports `content_type`, `slug`, locale, draft/published/archived status, JSON body, and published timestamp; published content is publicly readable under RLS. | Store tutorial metadata in `content_entries` (for example `content_type='partner_signup_tutorial'`) and store video/poster bytes in a dedicated media path/bucket. | HIGH |
| Existing storage | M10 creates public `product-media` and `editorial-media` buckets with image-only MIME types and staff write policies; `quality-media` is private. | Do not put MP4s into an image-only bucket. Add a dedicated `tutorial-media` bucket or a versioned deployment asset path with explicit video MIME/size policy. | HIGH |
| Existing migration process | SQL is in `supabase/migrations`; Supabase migration docs recommend capturing schema changes in migrations and testing with reset. | Add one or more additive migrations, enable RLS for every new exposed table, add indexes, and test reset/push before relying on the remote project. | HIGH |

### Confirmed gaps

- There is no partner table, partner application endpoint, partner signup page, revenue model, partner-area model, or partner metric query.
- The current `ProfileIn` accepts only customer-oriented fields (`name`, daily plan, pincode, UPI, locale, referral code, cadence). It is not an appropriate schema for role-specific partner applications.
- The current `get_admin_user()` permits only the derived `admin` role, which maps to active `ops_admin`; `fulfilment_manager` is not currently treated as an admin in the frontend. Do not silently broaden admin access while implementing this phase.
- `/admin/stats` performs full broad reads and reports only customers/products/orders/order revenue/Kudam savings. Partner metrics need a separate aggregation boundary.
- The project has frontend Jest/CRA behavior tests and backend pytest tests, but no partner-specific test files or test fixtures.
- The root `.planning/config.json` is absent. Per GSD defaults, validation is treated as enabled.
- No `CLAUDE.md` exists in the repository. The only project-local `.agents/AGENTS.md` contains an unrelated `/god-design` trigger; it does not add constraints for this phase.
- `auth_testing.md` contains older SuperTokens instructions that conflict with current `STATE.md` and the active Supabase Auth code. Treat current code, migrations, STATE.md, and this research as the phase source of truth; do not reintroduce SuperTokens.

## Standard Stack

### Core

| Library/tool | Version | Purpose | Why standard | Confidence |
|---|---:|---|---|---|
| React | 18.3.1 | Existing frontend and partner forms/admin UI | Already installed and used by all current pages. | HIGH |
| Create React App / `react-scripts` | 5.0.1 | Existing frontend build/test pipeline | Existing Vercel build is `cd frontend && npm install && npm run build`; do not migrate the app during this phase. | HIGH |
| `@supabase/supabase-js` | 2.112.3 | Browser Auth/session and optional public content reads | Declared and installed; npm registry reports 2.112.3 as latest on 2026-08-19. | HIGH |
| FastAPI | 0.110.1 | Authenticated and admin API boundaries | Existing backend API framework with dependency injection and Pydantic validation. | HIGH |
| Python `supabase` | 2.31.0 | Server-side PostgREST/database access | Existing service-role client; keep the service key in the API only. | HIGH |
| PostgreSQL via Supabase migrations | Supabase project version not probed | Partner data, constraints, aggregate queries, RLS | Existing migration source of truth and existing RLS/staff-role helpers. | HIGH |

### Supporting

| Library/tool | Version | Purpose | When to use | Confidence |
|---|---:|---|---|---|
| Framer Motion | 11.15.0 | Existing form/admin motion | Use for small state transitions consistent with existing pages; do not add another animation library. | HIGH |
| `content_entries` + Supabase Storage | Existing schema; add `tutorial-media` | Tutorial metadata, locale/version publishing, MP4/poster delivery | Reuse for content lifecycle; add storage policy/mime support through migration. | HIGH |
| Remotion | 4.0.513 current npm version on 2026-08-19 | React-based tutorial composition, preview, and optional render path | Use in a separate `video/` workspace, pinned and locked; do not install into the CRA runtime bundle by default. | HIGH for version, MEDIUM for phase fit |
| `@remotion/player` / `@remotion/cli` | 4.0.513 current npm versions | Optional browser preview and CLI render in the video workspace | Use only if the team wants an interactive preview or local render; published signup users need the static MP4. | HIGH for version, MEDIUM for phase fit |
| HyperFrames CLI | 0.8.3 current npm version on 2026-08-19 | HTML-native deterministic render/check path | Use in the separate tutorial workspace or CI; pin the version because `npx hyperframes` currently resolves an available cached 0.7.77 in this machine. | HIGH for registry version, MEDIUM for phase fit |
| HeyGen API | Current API docs, package not present | Optional avatar/voice/narration generation | Use only as an offline production dependency if a human approves avatar/voice consent and an API-key workflow. Never call from CRA or store API keys in Supabase client metadata. | MEDIUM |

**Version verification (2026-08-19):** `npm view` returned `@supabase/supabase-js@2.112.3`, `remotion@4.0.513`, `@remotion/player@4.0.513`, `@remotion/cli@4.0.513`, and `hyperframes@0.8.3`. The existing frontend lockfile has Supabase 2.112.3, React 18.3.1, and react-scripts 5.0.1. The local Supabase CLI is 2.114.0. Pin video dependencies in a separate lockfile rather than using unpinned `npx` commands in CI.

**Installation recommendation:** Do not run a product dependency install in `frontend` for this phase unless the implementation specifically needs `@remotion/player`. Create a separate video workspace with exact versions, for example:

```bash
npm install --save-exact remotion@4.0.513 @remotion/player@4.0.513 @remotion/cli@4.0.513
npm install --save-exact hyperframes@0.8.3
```

Use the official Remotion scaffold (`npx create-video@latest`) only in that workspace, then pin/lock the generated package versions. HyperFrames' official CLI quickstart is `npx hyperframes init`, followed by `preview`, `lint`, `check`, and `render`.

### Alternatives considered

| Instead of | Could use | Tradeoff | Decision |
|---|---|---|---|
| Dedicated partner tables | Put role, service areas, review state, and revenue JSON in `profiles` | Fewer tables but weak constraints, difficult one-to-many coverage, unsafe reporting, and customer/profile coupling | Use dedicated partner tables. |
| FastAPI server boundary | Browser writes directly to new Supabase tables | Requires more exposed RLS and makes revenue formulas/status transitions easier to tamper with | Use FastAPI for mutations, review, sensitive data, and aggregates; keep RLS as defense in depth. |
| Existing `delivery_zone_coverage` | Free-text area strings only | Easy initial form but duplicate spellings and unreliable area counts | Reference canonical zones/coverage and retain a controlled display label only where needed. |
| `content_entries` plus media | New CMS/table for tutorials | More lifecycle code for a single content type | Reuse `content_entries` initially; add a dedicated table only if tutorial workflow requires extra render jobs/approvals. |
| Static reviewed MP4 | Per-user live rendering | Expensive, slow, hard to cache, and exposes render credentials/content inputs | Render offline/CI and publish versioned assets. |
| Remotion alone | HyperFrames alone | Remotion is strongest for React authoring; HyperFrames is strongest for HTML-native deterministic production and CI | Keep a shared manifest and use each where it adds value; one approved published output. |

## Architecture Patterns

### Recommended project structure

```text
supabase/
└── migrations/
    └── <timestamp>_partner_network.sql       # tables, enums/checks, indexes, RLS, RPCs
api/
├── index.py                                  # route registration/boundaries; keep existing API
├── partner_network.py                        # pure validation/formula/query helpers if extracted
└── tests/
    ├── test_partner_network.py               # state, referral, revenue, metric unit tests
    └── test_partner_api.py                   # FastAPI/Supabase boundary tests
frontend/src/
├── pages/PartnerSignup.jsx                   # role-specific onboarding shell
├── pages/PartnerApplications.jsx             # owner status/revenue view if in scope
├── pages/Admin.jsx                            # existing page; add lazy Partner Network tab
└── components/PartnerApplicationForm.jsx
video/partner-signup/
├── package.json / package-lock.json           # isolated exact Remotion/HyperFrames versions
├── manifest.ts                                # canonical scenes, copy, locale, CTA URLs
├── remotion/                                  # React compositions and preview
├── hyperframes/                               # HTML composition/check/render path
└── renders/                                   # gitignored local outputs; approved assets uploaded separately
```

### Pattern 1: Separate identity from partner capability

**What:** Keep `profiles` as the authenticated person/household identity. A partner record describes an operational capability and can have a role-specific detail record, locations, review state, and revenue snapshots.

**When to use:** Whenever a person can become a stock agency, a delivery partner, or potentially both. The account must remain valid if one application is rejected or suspended.

**Prescriptive data model:**

1. `partner_profiles`: `id`, `profile_id`, `partner_type` (`stock_agency`/`delivery_partner`), `status` (`draft`/`submitted`/`under_review`/`approved`/`rejected`/`suspended`/`withdrawn`), `women_led_status` (`not_disclosed`/`self_attested`/`verified`/`rejected`), business/display name, phone/contact fields only where operationally necessary, `submitted_at`, `approved_at`, `reviewed_by`, `review_notes_internal`, timestamps, and archive fields.
2. `stock_agency_details`: `partner_id`, legal/trading name if needed, primary pincode reference, supply capacity/handling fields, and optional document references. Keep documents out of ordinary JSON and out of public buckets.
3. `delivery_partner_details`: `partner_id`, vehicle/mode, availability schedule, payout profile reference if required. Do not collect bank/UPI data in the first signup unless a payout integration is ready.
4. `partner_service_areas`: `partner_id`, `delivery_zone_id` nullable only for a pending/unmapped area, `coverage_id` nullable, normalized `postal_code`, `district`, `locality`, `area_key`, `area_label`, `status`, and timestamps. Enforce six-digit PIN validation and index `(partner_id, status)` and `(area_key, status)`.
5. `partner_referral_attributions`: immutable `partner_id`/application ID, `referrer_profile_id` nullable, normalized code snapshot, source, captured/claimed timestamps, and attribution state. This prevents later code changes from rewriting acquisition history.
6. `partner_revenue_estimates`: `partner_id`, `period_month` (first day of month), `basis` (`platform_derived`/`self_reported`/`hybrid`), input JSONB or typed input columns, gross/estimated payout/net fields in paise, `currency`, `formula_version`, `confidence`, `review_status`, `computed_at`, and immutable audit metadata.

Use database constraints for enum-like values, positive amounts, valid month boundaries, and unique active partner type per profile if the product wants one active application per role. A person may have both roles, so do not make `profile_id` globally unique in `partner_profiles`.

### Pattern 2: Explicit application state machine

**What:** Only the server can move applications between review states. The client can create/update a draft and submit it; it cannot set `approved`, `verified`, or payout values.

```text
draft -> submitted -> under_review -> approved
                         |              |
                         +-> rejected   +-> suspended
draft/submitted -> withdrawn
rejected -> submitted (new review attempt, preserve history)
```

Record every status transition in `audit_logs` or a dedicated `partner_application_events` table with actor, old state, new state, reason, and timestamp. Do not overwrite internal review notes on a customer-visible row. Count only `approved` records whose `status='approved'`, whose service areas are active, and whose women-led status meets the reporting policy.

### Pattern 3: Role-specific signup on top of existing Auth

**What:** Add `/partners/signup?type=stock_agency` and `/partners/signup?type=delivery_partner` (or equivalent route names) rather than teaching customer `/register` to create a Kudam and a partner record at once.

**Flow:**

1. Capture `type` and the existing `?ref=` code at the landing page. Preserve the current first-touch `meenamma_ref` behavior and never trust a client-provided referrer ID.
2. If the visitor is unauthenticated, use the existing Supabase password or Google flow. Store only a minimal pending role/referral marker client-side while email confirmation is pending; do not store identity documents or sensitive revenue data in local storage.
3. After a verified session exists, call `POST /api/partner-applications` with the role-specific validated payload. The API resolves the current session/profile, normalizes the referral code, and creates/updates a draft or submitted application idempotently.
4. Show `submitted`/`under_review` state and next steps. Do not promise approval or payout in the signup UX.
5. Admin reviews from `/admin`; a successful approval exposes only the partner's own operational status and permitted estimate data through `/api/my/partner-applications`.

This avoids the current `/profile/bootstrap` side effect that creates a first Kudam, while still reusing `AuthContext`, the existing session token injection, and `/auth/me`.

### Pattern 4: Pincode/area aggregates in Postgres

**What:** Use a SQL view or narrowly scoped RPC returning aggregate rows, called by a FastAPI admin endpoint. Avoid fetching every application/service-area row into Python.

**R1 query semantics:** `count(distinct partner_profiles.id)` grouped by normalized `postal_code`, filtered to `partner_type='stock_agency'`, `status='approved'`, active service area, and eligible `women_led_status`. A stock agency with several rows in one PIN counts once for that PIN; if it serves multiple PINs it appears in each served PIN by design.

**R2 query semantics:** `count(distinct partner_profiles.id)` grouped by canonical `area_key`/`area_label`, filtered to approved active delivery partners and active service areas. Prefer the `delivery_zone_coverage.id`/zone relationship as the key; never group by untrimmed display text.

Add optional filters for `partner_type`, state/district, `as_of`, and women-led status. Return a `generated_at`, definition text/version, and row counts so the dashboard can explain what “active” means.

### Pattern 5: Auditable approximate revenue

**What:** Calculate a monthly estimate from explicit business inputs and a versioned formula. Store both the inputs and result; do not recompute historical cards from today's payout rules.

**Recommended initial formulas:**

- Stock agency platform-derived estimate: `fulfilled_supply_units × agency_margin_paise_per_unit`, or `fulfilled_orders × average_agency_margin_paise_per_order` if unit-level supply data is not yet available.
- Delivery partner platform-derived estimate: `completed_deliveries × payout_paise_per_delivery + eligible_incentives_paise - adjustments_paise`.
- Self-reported fallback: `reported_monthly_revenue_paise` with `basis='self_reported'`, no implication that Meenamma verified it.
- Hybrid estimate: use platform counts for activity and an approved compensation rule for the rate; label the result `hybrid` and show a confidence badge.

Use paise integers, not floating-point rupees. Keep `gross`, `payout`, `expenses`, and `net_estimate` distinct. If expenses are not collected, do not display net income; display “estimated monthly earnings/payout” and show the assumptions. Rates should live in an effective-dated `partner_compensation_rules` table or an auditable configuration row, not in frontend constants.

### Pattern 6: Admin metrics as a separate read model

**What:** Keep write/review routes and aggregate read routes separate:

```text
POST   /api/partner-applications
GET    /api/my/partner-applications
PATCH  /api/my/partner-applications/{id}       # draft only
POST   /api/my/partner-applications/{id}/submit

GET    /api/admin/partners                    # paginated review queue
GET    /api/admin/partners/{id}
PATCH  /api/admin/partners/{id}/status
GET    /api/admin/partners/metrics             # summary + PIN/area breakdowns
GET    /api/admin/partners/revenue             # period/type/basis filters
GET    /api/tutorials/partner-signup           # published tutorial metadata
```

Make `metrics` return grouped results from SQL and make `partners` return a page with cursor or stable `(created_at,id)` ordering. Do not put all partner detail or private documents into the metric response. Extend `user_public()` only with non-sensitive partner summary/status if the dashboard needs it; do not return internal notes, documents, revenue inputs, or referral identities there.

### Pattern 7: Versioned static tutorial publishing

**What:** Keep the source and render manifest in a separate video workspace. Use Remotion for React composition preview/parameterized scenes and HyperFrames for HTML-native deterministic scenes/checks. Review one rendered MP4 and poster per locale, upload to a versioned path, then publish metadata through `content_entries`.

**When to use:** This is the default for the signup tutorial. Runtime rendering belongs in production only if a later requirement explicitly needs personalized videos.

Recommended content body shape for `content_entries`:

```json
{
  "video_url": "https://.../tutorial-media/partner-signup/en/v3/tutorial.mp4",
  "poster_url": "https://.../tutorial-media/partner-signup/en/v3/poster.webp",
  "duration_seconds": 68,
  "renderer": "remotion+hyperframes",
  "renderer_versions": { "remotion": "4.0.513", "hyperframes": "0.8.3" },
  "manifest_version": "partner-signup-v3",
  "cta": "/partners/signup",
  "captions_url": "https://.../tutorial-media/partner-signup/en/v3/captions.vtt"
}
```

Use `status='draft'` for review, `published` for the single active locale/version, and `archived` for superseded versions. Prefer a new object path per version because Supabase CDN caching can make overwrites stale. The CRA page should read published tutorial metadata through a small public API endpoint or the existing Supabase public content policy; it should not embed private production keys.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Authentication, email confirmation, Google OAuth | A partner-specific auth system or password table | Existing Supabase Auth + `AuthContext` | Auth, redirect, verification, and session edge cases already exist. Supabase documents email confirmation and redirect allow-lists as configuration concerns. |
| Authorization | Frontend-only `isAdmin` checks or user metadata roles | Existing session verification, `get_admin_user`, staff-role assignments, and RLS | Browser state is mutable; Supabase explicitly recommends RLS on exposed tables and warns that user metadata is not authorization data. |
| PIN/area normalization | Guessing districts/geocoding from arbitrary strings | Validate six-digit PINs and reuse `delivery_zone_coverage`/zone keys; add an explicit mapping workflow for unknown areas | Geography and duplicate spellings create misleading counts. |
| Referral attribution | Trusting `referrer_id` or awarding on every client submit | Server-side code resolution, unique attribution, first-touch timestamp, self-referral rejection, and existing window helper | Prevents self-referrals, tampering, duplicate claims, and retroactive reassignment. |
| Revenue math | A frontend calculator with hidden constants or a single “income” field | Versioned server formulas and compensation-rule rows with immutable snapshots | Historical estimates must remain explainable when rates or order states change. |
| Aggregate metrics | Pulling all rows into Python/React and counting client-side | SQL `count(distinct ...)`, indexes, and an RPC/view behind an admin endpoint | Reduces data exposure and avoids the current broad-list pattern becoming a scaling bottleneck. |
| Video rendering | Browser-side production rendering or a custom frame/FFmpeg engine | Remotion and HyperFrames official CLI/render paths | Both tools already handle frame timing, browser rendering, encoding, and diagnostics. |
| Media hosting | Local `/tmp/uploads` for durable tutorial assets or overwriting the same object path | Versioned Supabase Storage object paths plus published `content_entries` metadata | Vercel/API local files are not durable content storage; versioned paths avoid CDN staleness. |
| Admin audit history | Overwriting review status/notes with no event history | Existing `audit_logs` plus a partner transition event table if detail is needed | Operational and payout decisions need traceability. |

## Common Pitfalls

### Pitfall 1: Counting applicants instead of approved active partners

**What goes wrong:** A submitted, rejected, suspended, or duplicate application inflates pincode/area totals.

**Why it happens:** The query groups raw applications without a state/eligibility predicate, or counts service-area rows instead of distinct partners.

**How to avoid:** Centralize the reporting predicate: `partner_type`, `status='approved'`, active area row, and women-led eligibility. Use `count(distinct partner_id)`. Add fixture tests for duplicate areas and rejected/suspended records.

**Warning signs:** Dashboard total changes when an application is saved as draft, or one partner appears twice in the same PIN.

### Pitfall 2: Treating “women-led” as an inferred demographic

**What goes wrong:** The system infers gender from a name, email, photo, or business name, which is inaccurate and privacy-invasive.

**Why it happens:** The product needs a count but has not defined an eligibility/attestation workflow.

**How to avoid:** Collect a voluntary, explicit women-led self-attestation. Keep `self_attested` and `verified` separate, record who/when verified, make non-disclosure a valid state, and decide whether reports show both or only verified. Never expose individual women-led status in public lists.

**Warning signs:** A staff member can change eligibility without an audit record, or the count has no definition tooltip.

### Pitfall 3: Using `profiles.pincode` for partner coverage

**What goes wrong:** A customer's home PIN is treated as the agency's operating PIN or a delivery partner's whole service area.

**Why it happens:** `profiles.pincode` already exists and the quickest form implementation reuses it.

**How to avoid:** Keep profile PIN for profile/customer context and add partner service-area rows. Normalize as `text` with six digits so leading zeros are preserved.

### Pitfall 4: Exposing the Supabase service key or relying on RLS that the API bypasses

**What goes wrong:** A service-role key reaches the browser, or developers assume RLS protects a FastAPI query that explicitly uses the service role.

**Why it happens:** The existing API uses a service-role client for server operations, while frontend Supabase uses an anon/publishable key.

**How to avoid:** Keep service credentials in server environment only; authenticate every FastAPI route with the verified session and role dependency; apply RLS and grants to new tables anyway for direct Data API defense in depth. Supabase documents that service keys bypass RLS and must not be exposed.

### Pitfall 5: Allowing the client to set `approved`, payout, or referral owner

**What goes wrong:** A malicious browser request marks itself approved, writes an inflated revenue estimate, or assigns someone else's referral code.

**Why it happens:** Generic `PATCH` models accept all columns or the frontend is treated as a trusted form.

**How to avoid:** Separate Pydantic input models by action; server owns state transitions, `reviewed_by`, referral resolution, formula calculation, and payout rules. Reject unknown/immutable fields where practical.

### Pitfall 6: Referral attribution is lost during email confirmation

**What goes wrong:** The visitor lands with `?ref=...`, signs up, confirms email later, and the application is no longer linked.

**Why it happens:** The current code relies on browser local storage and only applies the code in `/profile/bootstrap`.

**How to avoid:** Keep the minimal first-touch code/role marker through the existing verification flow, then resolve it server-side on the first authenticated partner application submit. Make application attribution idempotent and retain a code snapshot plus timestamps. Do not let later clicks overwrite a claimed attribution.

### Pitfall 7: Revenue cards imply verified income

**What goes wrong:** An estimate based on GMV or a self-entered figure is displayed as actual monthly earnings.

**Why it happens:** “Revenue” is underspecified and a single rupee value is easy to display.

**How to avoid:** Show basis, period, formula version, inputs/assumptions, and confidence. Use “estimated monthly payout/earnings” when it is not gross sales. Never display net income unless expenses are captured and defined.

### Pitfall 8: Full scans and unbounded admin lists

**What goes wrong:** Metrics time out, the admin browser receives private data it does not need, and the existing 500-row limit silently hides records.

**Why it happens:** Current `/admin/stats` and `/admin/users` use broad reads and Python counting.

**How to avoid:** Add composite indexes, SQL aggregation/RPC, date/type filters, pagination, stable cursors, and lazy tab loading. Return only fields required for the card/table.

### Pitfall 9: Publicly exposing addresses, phone numbers, or tiny-cell counts

**What goes wrong:** A dashboard or public metric endpoint reveals partner identity, precise location, or makes a small area identifiable.

**Why it happens:** The same endpoint is reused for admin and public views.

**How to avoid:** Keep detailed applications/admin metrics protected. If a public network map is later added, return only approved aggregate counts, consider a minimum-cell threshold, and do not include contact fields. Put documents in a private bucket with signed URLs.

### Pitfall 10: Treating Remotion and HyperFrames as interchangeable packages

**What goes wrong:** The implementation tries to import HyperFrames into CRA, assumes a direct Remotion adapter, or ends up maintaining two divergent tutorials.

**Why it happens:** Both render browser-based video but have different authoring models. HyperFrames documentation explicitly describes HTML/CSS/data attributes, while Remotion uses React components/props.

**How to avoid:** Keep a shared manifest/copy/CTA contract, use separate compositions, run lint/check/render in CI, and publish one approved asset. Document the chosen canonical renderer per output. The direct integration boundary is an assumption requiring validation during Wave 0.

### Pitfall 11: Video asset overwrite and browser caching

**What goes wrong:** A new tutorial is uploaded to the same URL and some users continue seeing an old MP4/poster.

**Why it happens:** CDN/browser caches survive object overwrites.

**How to avoid:** Use immutable versioned paths (`.../v3/tutorial.mp4`), publish metadata last, and archive the old content entry only after the new asset is verified.

### Pitfall 12: Using email/Google sign-up without redirect and SMTP readiness

**What goes wrong:** A partner finishes signup but cannot return to onboarding, or confirmation emails are throttled/unreliable.

**Why it happens:** Supabase redirect URLs and production SMTP are configuration, not just frontend code.

**How to avoid:** Add local/preview/production redirect URLs explicitly, preserve the existing `/auth/verify-email` route, and confirm production SMTP/verification behavior before launch. Supabase's default email sender is rate-limited and best-effort.

## Code Examples

Verified patterns and phase-specific examples. New code should adapt these to the project's existing naming/style rather than copy them blindly.

### RLS owner policy for partner application rows

Supabase recommends enabling RLS on exposed tables and using `auth.uid()` for owner checks; the existing project already follows the same pattern for profiles, addresses, and orders.

```sql
alter table public.partner_profiles enable row level security;

create policy partner_profiles_select_own
  on public.partner_profiles
  for select to authenticated
  using ((select auth.uid()) = profile_id);

create policy partner_profiles_insert_own
  on public.partner_profiles
  for insert to authenticated
  with check ((select auth.uid()) = profile_id);

-- Prefer a server/API transition for status changes; do not grant customers
-- a broad update policy that can change approval or women-led verification.
```

Source: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Postgres aggregate shape for R1/R2

```sql
select
  psa.postal_code,
  count(distinct pp.id)::bigint as partner_count
from public.partner_profiles pp
join public.partner_service_areas psa on psa.partner_id = pp.id
where pp.partner_type = 'stock_agency'
  and pp.status = 'approved'
  and pp.women_led_status in ('self_attested', 'verified')
  and psa.status = 'active'
  and psa.postal_code is not null
group by psa.postal_code
order by psa.postal_code;
```

The delivery-partner query uses `area_key` (preferably a `delivery_zone_coverage.id`/canonical key) instead of raw display text. Put this in a view or narrowly scoped database function/RPC and call it from an admin-only FastAPI endpoint. Supabase recommends database functions for data-intensive operations, while warning that `SECURITY DEFINER` functions need an explicit search path and tightly scoped execute grants.

Source: [Supabase Database Functions](https://supabase.com/docs/guides/database/functions).

### FastAPI input boundary

```python
class PartnerApplicationIn(BaseModel):
    partner_type: Literal["stock_agency", "delivery_partner"]
    display_name: str = Field(min_length=2, max_length=120)
    women_led_attested: bool
    postal_code: str = Field(pattern=r"^[1-9][0-9]{5}$")
    area_keys: list[str] = Field(default_factory=list, max_length=20)
    monthly_activity: dict = Field(default_factory=dict)


@api.post("/partner-applications")
def create_partner_application(
    body: PartnerApplicationIn,
    user: dict = Depends(get_current_user),
):
    # Validate role-specific fields, resolve referral code server-side,
    # calculate estimates server-side, and never accept status/approval fields.
    ...
```

The production model should use role-specific Pydantic models or a discriminated union rather than an unrestricted `dict` for monthly inputs. The example shows the boundary only.

### Existing referral link shape to preserve

```jsx
const referralLink = user?.referral_code
  ? `${window.location.origin}/register?ref=${user.referral_code}`
  : "";
```

For partner acquisition, use a partner-specific destination while retaining the same code, for example `/partners/signup?type=delivery_partner&ref=CODE`. The server must normalize and resolve `CODE`; the browser value is only a transport hint.

### Remotion parameterized composition

Remotion documents composition props, schema/validation, and `calculateMetadata()` for data-driven video. Keep the manifest independent of CRA auth/runtime code.

```tsx
import { Composition } from "remotion";
import { PartnerSignupTutorial } from "./PartnerSignupTutorial";

export const RemotionRoot = () => (
  <Composition
    id="PartnerSignupTutorial"
    component={PartnerSignupTutorial}
    durationInFrames={68 * 30}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      locale: "en",
      signupUrl: "https://meenamma.org/partners/signup",
      scenes: [],
    }}
  />
);
```

Render in the isolated workspace with the current official CLI pattern (`npx remotion render <composition-id>`), and validate the output file rather than relying only on Studio preview.

Sources: [Remotion parameterized videos](https://www.remotion.dev/docs/parameterized-rendering) and [Remotion rendering](https://www.remotion.dev/docs/render).

### HyperFrames composition shape

HyperFrames' official repository describes HTML composition roots with data attributes for composition IDs, timing, width/height, tracks, and media; its rendering guide recommends `lint`, `check`, then `render`.

```html
<div id="stage"
     data-composition-id="partner-signup"
     data-start="0"
     data-width="1080"
     data-height="1920"
     data-fps="30">
  <h1 class="clip" data-start="1" data-duration="4" data-track-index="1">
    Join Meenamma as a partner
  </h1>
</div>
```

Use `npx hyperframes lint`, `npx hyperframes check`, and `npx hyperframes render --output tutorial.mp4` in CI/review. Pin the version and use Docker only when a controlled Chrome/FFmpeg/font environment is needed.

Sources: [HyperFrames repository](https://github.com/heygen-com/hyperframes) and [HyperFrames rendering guide](https://hyperframes.heygen.com/guides/rendering).

### Published tutorial media

```jsx
<video
  controls
  playsInline
  preload="metadata"
  poster={tutorial.poster_url}
  src={tutorial.video_url}
  aria-label="How to sign up as a Meenamma partner"
/>
```

The API should return only published metadata. For public tutorials, a public bucket is acceptable; for any draft or partner document, use a private bucket and time-limited signed URLs. Supabase documents that public buckets bypass read controls and private buckets require RLS or signed URLs.

Source: [Supabase Storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [Serving Storage assets](https://supabase.com/docs/guides/storage/serving/downloads).

## State of the Art

| Old/current project approach | Phase approach | Why it matters |
|---|---|---|
| Broad `/admin/stats` reads and Python-side totals | SQL aggregate read model with indexed filters | Keeps admin metrics fast and limits sensitive row exposure. |
| Customer `profiles.pincode` | Partner-specific normalized service areas | Separates household location from operational coverage. |
| `profiles.referred_by` as the only acquisition record | Preserve it plus immutable partner attribution/event row | Supports partner growth reporting without rewriting household referral behavior. |
| Local `/tmp/uploads` admin upload | Versioned Supabase Storage or committed/deployed static asset | Tutorial media must survive function restarts and support cache-safe publishing. |
| Frontend-owned form/status fields | Server-owned state transitions and versioned calculations | Prevents approval/revenue/referral tampering. |
| Unversioned video tooling | Exact Remotion/HyperFrames versions and render provenance in content metadata | Video toolchains change quickly; reproducibility matters. |

**Current/deprecated notes:**

- Supabase's current documentation emphasizes RLS for exposed tables, explicit role targeting in policies, and careful handling of `SECURITY DEFINER` functions. Do not assume a service-role API query is protected by RLS.
- Supabase's current password-auth docs say hosted email confirmation is enabled by default and production signup/reset flows need reliable SMTP; preserve the existing verification route.
- Remotion's current docs support parameterized React videos, CLI/SSR/cloud rendering, and an interactive Player. These are production options, but the phase needs a static reviewed tutorial first.
- HyperFrames is currently an HTML-native, open-source renderer with local/Docker/cloud paths and a comparison guide positioning it beside Remotion, not as a Remotion plugin. Treat the shared manifest handoff as the stable boundary.
- HeyGen's current developer API supports generated videos and callback URLs, but that is optional for this phase. Any avatar/voice use requires consent, licensed assets, secrets management, and a human review gate.

## Open Questions

1. **What exactly qualifies as “women-led”?**
   - What we know: The requirements require counts, but no verification policy is present in the repository.
   - What's unclear: Self-attestation only, document review, majority ownership, or another operational definition.
   - Recommendation: Implement explicit `not_disclosed`/`self_attested`/`verified` states and launch dashboard filters for self-attested vs verified. Product/legal must decide which is the headline number before public reporting.

2. **Is the requested revenue gross sales, agency margin, delivery payout, or net income?**
   - What we know: No partner compensation data or order-to-partner settlement table exists.
   - What's unclear: Rates, expenses, incentives, and whether partners are paid per kg/order/delivery.
   - Recommendation: Launch with “estimated monthly payout/earnings,” not net income; create effective-dated compensation rules and show the formula/basis on every card.

3. **Can one person operate both partner roles?**
   - What we know: The requirement names two partner types, but no exclusivity rule exists.
   - What's unclear: Whether the product should allow one account to hold both roles.
   - Recommendation: Allow two role-specific partner records per profile unless product explicitly prohibits it; enforce one active record per profile/type, not one per profile globally.

4. **Are stock-agency and delivery-partner areas customer-visible?**
   - What we know: The current requirement asks for admin dashboard totals, not a public marketplace directory.
   - What's unclear: Whether a future public network map is expected.
   - Recommendation: Keep application detail and metrics admin-only in this phase. If public counts are later added, define small-cell suppression and remove contact/precise location data.

5. **Which renderer is canonical for the published tutorial?**
   - What we know: Remotion is React-based; HyperFrames is HTML-native; both have current render/check paths; no direct adapter was found in primary docs checked.
   - What's unclear: Whether the request means two deliverables or one tutorial built with both tools.
   - Recommendation: Use a shared manifest and make one tool the final renderer for each output. Validate the handoff in Wave 0 with one 10-second proof-of-concept before committing to a dual-render pipeline.

6. **Where should tutorial media be hosted?**
   - What we know: Existing editorial storage is public but image-only; Vercel serves the CRA build.
   - What's unclear: Expected video size, CDN budget, and whether the operations team needs CMS uploads.
   - Recommendation: Add a versioned `tutorial-media` Supabase bucket with explicit video MIME/size policy and use `content_entries` for publishing. Revisit a dedicated CDN if asset volume or bandwidth becomes material.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---:|---|
| Node.js | CRA, Remotion, HyperFrames | ✓ | 25.0.0 | Use the repository's supported Node version in CI if Node 25 exposes CRA incompatibilities; pin CI separately. |
| npm | Existing frontend and video workspaces | ✓ | 11.6.2 | — |
| Python | FastAPI/tests | ✓ | 3.14.0 | Existing lock/venv compatibility should be checked; project requirements target the current environment but do not change Python for this phase. |
| FFmpeg | HyperFrames/Remotion video encoding | ✓ | 8.1.2 | Dockerized render environment. |
| FFprobe | Output validation/provenance checks | ✓ | 8.1.2 | Run validation in the same Docker image as the renderer. |
| Docker | Reproducible video render option | ✓ | 28.5.1 | Local render is sufficient for the first tutorial if fonts/browser are stable. |
| Supabase CLI | Migration/reset/push | ✓ | 2.114.0 | Use the existing migration files and remote SQL workflow only with deliberate verification if a local project is unavailable. |
| HyperFrames CLI | Tutorial render/check | Available but wrong/cached version | `npx hyperframes` returned 0.7.77; npm latest is 0.8.3 | Pin `hyperframes@0.8.3` in the video workspace and run its doctor/lint/check. |
| Remotion CLI | Tutorial render | ✗ as a standalone global probe | npm latest `@remotion/cli` is 4.0.513; `npx remotion --version` had no executable outside a Remotion project | Install the CLI inside the isolated Remotion workspace; use the official scaffold. |
| HeyGen API | Optional avatar/voice production | Not configured/probed | — | Produce an avatar-free tutorial with Remotion/HyperFrames; do not block core signup delivery on HeyGen. |

**Missing dependencies with no fallback:** None for the core code/data/admin phase.

**Missing dependencies with fallback:** Remotion CLI outside a project and HeyGen API are not available as ready-to-use project dependencies; both have viable fallbacks described above. HyperFrames must be pinned because the unqualified local `npx` result is not the current registry version.

## Validation Architecture

Validation is enabled because `.planning/config.json` is absent and the GSD default treats it as enabled.

### Test framework

| Property | Value |
|---|---|
| Backend framework | pytest; existing `api/tests` suite; exact framework version is not pinned in `api/requirements.txt` and should be recorded in Wave 0. |
| Backend config | No `pytest.ini`/`pyproject.toml` project config found; use existing test conventions and `scripts/test_backend.sh`. |
| Backend quick run | `python -m pytest api/tests/test_partner_network.py -q` (Wave 0 file) |
| Backend full suite | `python -m pytest api/tests -q` |
| Frontend framework | CRA 5.0.1 test runner/Jest with React behavior tests. |
| Frontend config | CRA defaults; no Jest/Vitest config found. |
| Frontend quick run | `cd frontend; npm test -- --watchAll=false --runInBand src/pages/PartnerSignup.test.js` (Wave 0 file) |
| Frontend full suite | `cd frontend; npm test -- --watchAll=false --runInBand` |
| SQL validation | `supabase db reset` locally, then migration/status checks; use a seeded test project for aggregate/RLS integration. |
| Video validation | `npx hyperframes lint`, `npx hyperframes check`, render, then `ffprobe` and manual playback; Remotion render/preview must also be checked if it is a supported output path. |

### Phase requirements to test map

| Req ID | Behavior | Test type | Automated command | File exists? |
|---|---|---|---|---|
| R1 | Approved active women-led stock agencies count once per pincode; duplicates/rejected/suspended records excluded | SQL/integration + unit fixture | `python -m pytest api/tests/test_partner_network.py -k stock_agency_metrics -q` | ❌ Wave 0 |
| R2 | Delivery partner count is distinct by canonical area and supports multi-area partners | SQL/integration + unit fixture | `python -m pytest api/tests/test_partner_network.py -k delivery_partner_metrics -q` | ❌ Wave 0 |
| R3 | Stock-agency signup validates role-specific fields, requires verified session for submit, and cannot set approval | API + frontend behavior | `python -m pytest api/tests/test_partner_api.py -k stock_agency_signup -q` and targeted CRA test | ❌ Wave 0 |
| R4 | Delivery signup stores active coverage rows and follows the same state machine | API + frontend behavior | `python -m pytest api/tests/test_partner_api.py -k delivery_partner_signup -q` | ❌ Wave 0 |
| R5 | Stock-agency estimate stores basis/formula version and uses the configured formula | Unit + API | `python -m pytest api/tests/test_partner_network.py -k stock_revenue -q` | ❌ Wave 0 |
| R6 | Delivery estimate uses completed deliveries/rules and labels self-reported fallback | Unit + API | `python -m pytest api/tests/test_partner_network.py -k delivery_revenue -q` | ❌ Wave 0 |
| R7 | Referral is first-touch/idempotent, self-referral is rejected, and current 90-day household behavior remains green | Unit + regression | `python -m pytest api/tests -k referral -q` | ❌ Add/extend existing referral tests |
| R8 | Published tutorial resolves only approved content metadata and the rendered output has expected duration/audio/captions/poster | Media smoke + manual | `npx hyperframes lint && npx hyperframes check && ffprobe ...` | ❌ Wave 0 video workspace |
| R9 | Admin-only metrics/detail routes enforce authorization, paginate, filter, and render dashboard cards | API + frontend behavior | `python -m pytest api/tests/test_partner_api.py -k admin -q` and targeted CRA admin test | ❌ Wave 0 |

### Sampling rate

- Per task commit: targeted backend pytest or targeted CRA test, plus SQL syntax/migration check for migration tasks.
- Per wave merge: backend full suite and frontend full suite; reset the local Supabase database and verify RLS policies.
- Phase gate: full suite green, RLS/admin authorization verified with an ordinary user, one approved metric fixture validated, and one final tutorial MP4/poster/caption set manually reviewed before `/gsd:verify-work`.

### Wave 0 gaps

- [ ] Add a partner migration test fixture with users, roles, duplicate service areas, rejected/suspended applications, self-attested/verified/not-disclosed records, referral attribution, and revenue snapshots.
- [ ] Add `api/tests/test_partner_network.py` for pure state/referral/formula/metric helpers.
- [ ] Add `api/tests/test_partner_api.py` for session/admin boundaries and mocked Supabase queries.
- [ ] Add frontend behavior tests for the two partner signup variants, pending email-confirmation flow, referral capture, and admin Partner Network tab.
- [ ] Create the isolated `video/partner-signup` workspace and record the exact Remotion/HyperFrames render commands.
- [ ] Verify the local/CI font, Chrome, FFmpeg, and output-size policy for the final tutorial.
- [ ] Decide and document the women-led eligibility definition and revenue terminology before migration/API implementation.

## Implementation Plan Implications

The planner should sequence work in dependency order:

1. **Wave 0 / decisions and test scaffolding:** lock women-led and revenue definitions, create partner fixtures/tests, prove a minimal Remotion-to-published-MP4 and HyperFrames render path, and document the video workspace.
2. **Schema migration:** add partner types/status constraints, partner core/detail/location tables, immutable attribution, compensation rules/revenue snapshots, indexes, RLS/grants, storage bucket/policies, and audit transitions. Test with `supabase db reset`.
3. **Backend domain/API:** add Pydantic input models, normalized PIN/area validation, idempotent draft/submit flow, server-side referral resolution, state transitions, versioned revenue calculations, SQL aggregates/RPCs, pagination, and admin authorization. Keep service-role credentials server-only.
4. **Frontend signup/status:** add role-specific routes/forms and post-auth continuation, reuse `AuthContext` and `api`, handle email confirmation, show assumptions/status, and never expose internal review/payout fields.
5. **Admin dashboard:** add a lazy Partner Network tab with summary cards, pincode/area tables, review queue, revenue basis/filter controls, and explicit empty/loading/error states. Do not couple the existing product/order tabs to partner data.
6. **Tutorial production/publishing:** author the shared manifest, render/check in both intended workflows, publish immutable MP4/poster/VTT assets, create localized `content_entries`, and wire the signup page to published metadata.
7. **Verification:** run full backend/frontend suites, RLS authorization cases, metric fixture checks, referral regression tests, SQL explain/index checks, media `ffprobe`, and a manual mobile signup/tutorial pass.

## Sources

### Primary (HIGH confidence)

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS enablement, `auth.uid()`, service-key bypass warning, policies, and performance guidance.
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) — data-intensive work, `SECURITY INVOKER` default, secure `SECURITY DEFINER` search path, and execute grants.
- [Supabase Securing the API](https://supabase.com/docs/guides/api/securing-your-api) — RLS on exposed tables, function execute permissions, and security review.
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) — migration files, reset, diff, and avoiding out-of-band remote schema changes.
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) — email signup/confirmation and SMTP considerations.
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) — allow-list requirements for `redirectTo`.
- [Supabase Storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) — public/private bucket behavior, RLS, and signed URLs.
- [Supabase Serving Storage assets](https://supabase.com/docs/guides/storage/serving/downloads) — public URLs and time-limited signed URLs.
- [Remotion creating a project](https://www.remotion.dev/docs) — current scaffolding, Node requirements, and isolated project workflow; last updated 2026-08-18.
- [Remotion parameterized videos](https://www.remotion.dev/docs/parameterized-rendering) — props, validation, dynamic metadata, and Player boundary; last updated 2026-08-18.
- [Remotion rendering](https://www.remotion.dev/docs/render) — Studio, CLI, SSR, Lambda, GitHub Actions, and Cloud Run render paths; last updated 2026-08-18.
- [HyperFrames official repository](https://github.com/heygen-com/hyperframes) — HTML-native model, CLI, Node 22+/FFmpeg requirement, comparison with Remotion, packages, and Apache 2.0 license.
- [HyperFrames rendering guide](https://hyperframes.heygen.com/guides/rendering) — lint/check/render workflow, output formats, Docker/cloud paths, versioning/provenance, and troubleshooting.
- [HyperFrames about page](https://hyperframes.video/about) — project ownership/open-source positioning and deterministic HTML-to-MP4 purpose.
- [HeyGen Create Video API](https://developers.heygen.com/reference/create-video) — optional avatar/video API inputs and callback URL behavior.
- [npm `@supabase/supabase-js`](https://www.npmjs.com/package/@supabase/supabase-js), [npm `remotion`](https://www.npmjs.com/package/remotion), [npm `@remotion/player`](https://www.npmjs.com/package/@remotion/player), [npm `@remotion/cli`](https://www.npmjs.com/package/@remotion/cli), and [npm `hyperframes`](https://www.npmjs.com/package/hyperframes) — versions checked on 2026-08-19.

### Secondary (MEDIUM confidence)

- Repository source and migration audit: `frontend/src/App.js`, `frontend/src/context/AuthContext.js`, `frontend/src/lib/api.js`, `frontend/src/pages/Admin.jsx`, `frontend/src/pages/Referral.jsx`, `frontend/src/pages/Register.jsx`, `api/index.py`, `api/referrals.py`, and `supabase/migrations/*`.
- Existing repository operational docs: `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/supabase-google-auth.md`, and `vercel.json`.

### Tertiary (LOW confidence / validation needed)

- No direct Remotion↔HyperFrames integration adapter was identified in the official docs/repository pages checked. This is a search result, not proof of non-existence; validate the desired handoff in Wave 0.
- The exact project-wide definition of women-led eligibility, partner compensation, and payout settlement remains unknown until product/operations decisions are recorded.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — versions were checked against the local manifests, installed lockfile, npm registry, and official tool documentation.
- Architecture: HIGH for extending the existing FastAPI/Supabase/RLS/admin patterns; MEDIUM for the new partner schema because requirements do not define operational/legal policy.
- Pitfalls: HIGH for Supabase security/migration/storage and repository gaps; MEDIUM for business-data quality and revenue semantics.
- Tutorial integration: MEDIUM for the separate-workspace/static-publish recommendation; LOW for any direct Remotion↔HyperFrames bridge until a proof-of-concept is validated.

**Research date:** 2026-08-19
**Valid until:** 2026-09-02 for fast-moving video tooling; 2026-09-18 for the relatively stable Supabase/database patterns, assuming no project policy change.

