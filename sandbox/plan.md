# Incremental kudam savings — accrual ladder with variable settlement

## Objective
Let a subscriber save by an **increasing daily amount** (their chosen step: ₹1 / ₹5 / ₹10) while
settling on **their chosen cadence** (daily / weekly / monthly). Money collected via Razorpay
Subscriptions using the `quantity` lever, or a payment link for manual payers.

## Core idea: split the accrual clock from the settlement clock

Accrual is a pure function of dates, runs in our DB, moves no money:

```
cycle_day     = ((debit_date - cycle_anchor_date) mod 30) + 1     # 1..30
accrual_paise = step_paise * cycle_day
```

Settlement charges the sum of everything not yet settled:

```
due_paise = SUM(amount_paise) FROM autopay_accruals
            WHERE profile_id = :id AND settled_at IS NULL
```

Cadence only decides **when the sweep runs** — never the arithmetic. One formula serves daily,
weekly, monthly, and "pay whenever I have it". Missed settlements need no special case: the
unsettled sum simply keeps growing (decision: **keep accruing**).

## Ladder amounts

Step `s`, cumulative `s · n(n+1)/2`:

| Window | Days | Amount |
|---|---|---|
| week 1 | 1–7 | 28s |
| week 2 | 8–14 | 77s |
| week 3 | 15–21 | 126s |
| week 4 | 22–28 | 175s |
| tail | 29–30 | 59s |
| full cycle | 1–30 | 465s |

**Only monthly is a fixed amount.** Weekly climbs 28s → 175s across the cycle. This is why a
fixed-amount Plan cannot serve the weekly tier.

| step | daily d1 | daily d30 | week 1 | week 4 | monthly |
|---|---|---|---|---|---|
| ₹1 | ₹1 | ₹30 | ₹28 | ₹175 | ₹465 |
| ₹5 | ₹5 | ₹150 | ₹140 | ₹875 | ₹2,325 |
| ₹10 | ₹10 | ₹300 | ₹280 | ₹1,750 | ₹4,650 |

## Charging a variable amount: the quantity lever

Razorpay charges `plan.item.amount × quantity` per cycle. So:

- **One shared Plan per cadence**, unit amount = ₹1 (100 paise)
- `quantity = due_paise / 100`
- Update-Subscription API sets `quantity` before each cycle

Per-user difference and daily increment both collapse into one integer. No per-user plans, no
plan-per-amount table. Granularity is ₹1 — acceptable because steps are whole rupees.

Chosen over UPI Autopay `as_presented` tokens because Recurring Payments is an on-demand feature
requiring a Razorpay Support ticket, while plain Subscriptions work on the current account today.

### Mandate ceiling under keep-accruing
Debt is unbounded in principle, but the mandate `max_amount` is fixed at authorization. Set it to
**465 × step** (one full cycle's sum). Debt exceeding that means the user has not settled in over
30 days — that is a dunning case, not a charge attempt. Bounded by construction.

## Flow

1. **Signup** — user picks `step_paise` (₹1/5/10) and `autopay_cadence`. Ladder length is fixed at
   30 days; cap (`465 × step`) is derived, not chosen. Set `cycle_anchor_date = today`.
2. **Authorize** — create Subscription against the shared cadence Plan with `quantity = 1` and
   `max_amount = 465 × step`. Checkout, verify signature, status `active` on `subscription.activated`.
3. **Accrue** — daily cron inserts one `autopay_accruals` row per active profile.
   Idempotent on `(profile_id, debit_date)`. No Razorpay call.
4. **Pre-notify (T-24h)** — compute `due_paise`, set `quantity` via Update-Subscription, send the
   NPCI-required pre-debit notification through `notify.py`. Two-stage sweep exists specifically
   because NPCI requires ~24h notice; a same-day amount change would race the notification.
5. **Settle (T-0)** — Razorpay charges `quantity × ₹1`. Webhook `payment.captured` with a
   `subscription_id` credits the kudam and stamps `settled_at` on the covered accrual rows.
   `payment.failed` leaves them unsettled — they roll into the next sweep automatically.
6. **Manual payers** — payment link generated for the same `due_paise`. Identical settlement path.

## Schema (M15)

```
profiles
  step_paise               int      -- replaces reuse of daily_plan as step
  autopay_cadence          text     -- 'daily' | 'weekly' | 'monthly' | 'manual'
  cycle_anchor_date        date
  autopay_subscription_id  text     -- exists (M13)
  autopay_status           text     -- exists (M13)

autopay_accruals
  id, profile_id, debit_date, cycle_day, amount_paise,
  settled_at timestamptz null, settlement_payment_id text null
  UNIQUE (profile_id, debit_date)
```

`cycle_day` derives from dates, so accruals are replayable and testable with zero Razorpay calls.

## Constraints
- NPCI pre-debit notification ~24h before each debit — drives the two-stage sweep.
- All amounts stay under the ₹15,000 AFA threshold, so no extra auth step.
- Existing flat-autopay subscribers must re-register; no API converts an old subscription's fixed
  plan to the quantity-lever plan.

## Migration ledger debt
`db query -f` applied M12/M13/M14 to prod `sejfusqyxtmejbwppexe` without recording them in
`supabase_migrations.schema_migrations`, which still stops at M11. Backfill those three rows (or
`supabase link` + `db push --include-all`) before M15, or a future `db push` will replay them.

## Decisions
- Missed settlement: **keep accruing**. Unsettled sum grows; no ladder pause or reset.
- Variable amount: **Subscription `quantity` lever**, not UPI Autopay tokens.
- User picks: **step + cadence**. Ladder length fixed at 30 days.
- V1 scope: **all three cadences** (daily, weekly, monthly) ship together.
- Legacy flat-autopay: **cancel on next login**, prompt to re-register.

## Open questions
- Live vs test Razorpay keys. Test assumed.
