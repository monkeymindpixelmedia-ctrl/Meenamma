-- M13: off-season catch reservations (25% advance, complete on arrival)
-- Additive on M1–M12.

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  product_id uuid not null references public.products (id),
  qty_grams integer not null check (qty_grams > 0),
  total_paise bigint not null check (total_paise > 0),
  advance_paise bigint not null check (advance_paise > 0),
  status text not null default 'pending_advance'
    check (status in ('pending_advance', 'reserved', 'arrived', 'completed', 'cancelled')),
  advance_razorpay_order_id text unique,
  advance_payment_id text,
  balance_razorpay_order_id text,
  balance_payment_id text,
  order_id uuid references public.orders (id),
  delivery_date date,
  arrived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_profile_status_idx on public.reservations (profile_id, status);
create index if not exists reservations_product_status_idx on public.reservations (product_id, status);

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

alter table public.reservations enable row level security;

drop policy if exists reservations_select_own on public.reservations;
create policy reservations_select_own on public.reservations
  for select to authenticated using (profile_id = auth.uid());

drop policy if exists reservations_staff_select on public.reservations;
create policy reservations_staff_select on public.reservations
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

grant select on public.reservations to authenticated;
