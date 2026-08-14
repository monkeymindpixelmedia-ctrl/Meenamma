-- M15: incremental savings ladder — daily accrual clock split from settlement clock.
--
-- Accrual is a pure function of dates and moves no money:
--   cycle_day     = ((debit_date - cycle_anchor_date) mod 30) + 1   -- 1..30
--   amount_paise  = step_paise * cycle_day
-- Settlement charges SUM(amount_paise) WHERE settled_at IS NULL, so cadence only decides
-- when the sweep runs, never the arithmetic. Missed settlements keep accruing.

alter table public.profiles
  add column if not exists step_paise integer not null default 500
    check (step_paise > 0),
  add column if not exists autopay_cadence text not null default 'manual'
    check (autopay_cadence in ('daily', 'weekly', 'monthly', 'manual')),
  add column if not exists cycle_anchor_date date;

comment on column public.profiles.step_paise is
  'Ladder increment in paise. Day N of a cycle accrues step_paise * N.';
comment on column public.profiles.autopay_cadence is
  'How often the settlement sweep runs. Does not affect accrual, which is always daily.';
comment on column public.profiles.cycle_anchor_date is
  'Day 1 of the ladder. cycle_day derives from this, so accruals are replayable.';

-- One row per profile per day. The unique constraint is what makes the daily
-- accrual cron idempotent under retries and overlapping invocations.
create table if not exists public.autopay_accruals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  debit_date date not null,
  cycle_day smallint not null check (cycle_day between 1 and 30),
  amount_paise bigint not null check (amount_paise > 0),
  settled_at timestamptz,
  settlement_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint autopay_accruals_profile_date_key unique (profile_id, debit_date)
);

-- The sweep's hot path: unsettled rows for one profile, oldest first.
create index if not exists autopay_accruals_unsettled_idx
  on public.autopay_accruals (profile_id, debit_date)
  where settled_at is null;

create index if not exists autopay_accruals_settlement_payment_idx
  on public.autopay_accruals (settlement_payment_id)
  where settlement_payment_id is not null;

drop trigger if exists autopay_accruals_set_updated_at on public.autopay_accruals;
create trigger autopay_accruals_set_updated_at
before update on public.autopay_accruals
for each row execute function public.set_updated_at();

-- Service-role only. Profiles are no longer tied to auth.users (M14 moved identity to
-- SuperTokens), so auth.uid()-based policies cannot match; the API reads with the service key.
alter table public.autopay_accruals enable row level security;
