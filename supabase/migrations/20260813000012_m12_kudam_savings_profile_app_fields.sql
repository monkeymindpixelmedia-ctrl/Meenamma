-- M12: kudam savings vessels + deposits, app-level profile fields
-- Additive on M1–M11. Safe to run once in the Supabase SQL editor.

alter table public.profiles
  add column if not exists daily_plan smallint not null default 5,
  add column if not exists pincode text,
  add column if not exists upi_id text;

create table if not exists public.kudams (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  name text not null,
  goal_paise bigint not null check (goal_paise > 0),
  saved_paise bigint not null default 0 check (saved_paise >= 0),
  status text not null default 'active' check (status in ('active', 'complete', 'redeemed', 'archived')),
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kudams_profile_status_idx on public.kudams (profile_id, status);

drop trigger if exists kudams_set_updated_at on public.kudams;
create trigger kudams_set_updated_at
before update on public.kudams
for each row execute function public.set_updated_at();

create table if not exists public.kudam_deposits (
  id uuid primary key default gen_random_uuid(),
  kudam_id uuid not null references public.kudams (id),
  profile_id uuid not null references public.profiles (id),
  amount_paise bigint not null check (amount_paise > 0),
  provider_payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists kudam_deposits_kudam_created_idx
  on public.kudam_deposits (kudam_id, created_at desc);

alter table public.kudams enable row level security;
alter table public.kudam_deposits enable row level security;

drop policy if exists kudams_select_own on public.kudams;
create policy kudams_select_own on public.kudams
  for select to authenticated using (profile_id = auth.uid());

drop policy if exists kudam_deposits_select_own on public.kudam_deposits;
create policy kudam_deposits_select_own on public.kudam_deposits
  for select to authenticated using (profile_id = auth.uid());

drop policy if exists kudams_staff_select on public.kudams;
create policy kudams_staff_select on public.kudams
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

grant select on public.kudams to authenticated;
grant select on public.kudam_deposits to authenticated;

-- Razorpay checkout ledger for savings deposits (orders table covers catch purchases).
create table if not exists public.kudam_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  kudam_id uuid not null references public.kudams (id),
  profile_id uuid not null references public.profiles (id),
  razorpay_order_id text not null unique,
  amount_paise bigint not null check (amount_paise > 0),
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'cancelled')),
  provider_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists kudam_payment_attempts_set_updated_at on public.kudam_payment_attempts;
create trigger kudam_payment_attempts_set_updated_at
before update on public.kudam_payment_attempts
for each row execute function public.set_updated_at();

alter table public.kudam_payment_attempts enable row level security;
