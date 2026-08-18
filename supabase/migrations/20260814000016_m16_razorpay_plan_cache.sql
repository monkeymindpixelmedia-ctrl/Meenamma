-- M16: cache of shared Razorpay plans, one per (cadence, key_id).
--
-- The quantity lever bills plan.item.amount * quantity, so every subscriber on a cadence can
-- share a single plan priced at Rs 1 per unit. Plan ids are scoped to the Razorpay key that
-- created them, so the key id is part of the identity — switching test/live keys must not reuse
-- a plan the other environment cannot see.

create table if not exists public.razorpay_plans (
  id uuid primary key default gen_random_uuid(),
  cadence text not null check (cadence in ('daily', 'weekly', 'monthly')),
  razorpay_key_id text not null,
  razorpay_plan_id text not null,
  unit_amount_paise integer not null check (unit_amount_paise > 0),
  created_at timestamptz not null default now(),
  constraint razorpay_plans_cadence_key_unique unique (cadence, razorpay_key_id)
);

alter table public.razorpay_plans enable row level security;
