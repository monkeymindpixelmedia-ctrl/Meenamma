-- M7: payment attempts and authoritative payments
-- Canonical: 03-MEENAMMA-DATABASE.md §3.6 (refunds/webhooks later)

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  provider text not null default 'razorpay',
  status public.payment_attempt_status not null default 'created',
  amount_paise bigint not null check (amount_paise >= 0),
  currency char(3) not null default 'INR',
  idempotency_key uuid not null,
  razorpay_order_id text,
  quote_hash text not null,
  client_result_received_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, idempotency_key)
);

create unique index payment_attempts_razorpay_order_id_unique
  on public.payment_attempts (razorpay_order_id)
  where razorpay_order_id is not null;
create index payment_attempts_order_created_idx
  on public.payment_attempts (order_id, created_at desc);
create index payment_attempts_status_expires_idx
  on public.payment_attempts (status, expires_at);

create trigger payment_attempts_set_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_attempt_id uuid not null unique references public.payment_attempts (id),
  order_id uuid not null references public.orders (id),
  provider text not null default 'razorpay',
  provider_payment_id text not null,
  status public.payment_status not null,
  amount_paise bigint not null check (amount_paise >= 0),
  currency char(3) not null default 'INR',
  method_summary jsonb not null default '{}'::jsonb,
  authorized_at timestamptz,
  captured_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create index payments_order_status_idx on public.payments (order_id, status);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();
