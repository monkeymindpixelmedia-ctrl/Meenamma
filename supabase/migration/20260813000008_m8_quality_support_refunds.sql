-- M8: quality, support, refunds (quality_issues before refunds — CF-06)
-- Canonical: 03-MEENAMMA-DATABASE.md §3.6–§3.7

create table public.quality_issues (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  order_item_id uuid references public.order_items (id),
  profile_id uuid not null references public.profiles (id),
  status public.quality_issue_status not null default 'submitted',
  reason_code text not null,
  description text,
  resolution_code text,
  eligible_until timestamptz,
  assigned_to uuid references public.profiles (id),
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quality_issues_profile_submitted_idx
  on public.quality_issues (profile_id, submitted_at desc);
create index quality_issues_order_idx on public.quality_issues (order_id);
create index quality_issues_status_assigned_idx on public.quality_issues (status, assigned_to);

create trigger quality_issues_set_updated_at
before update on public.quality_issues
for each row execute function public.set_updated_at();

create table public.quality_issue_media (
  id uuid primary key default gen_random_uuid(),
  quality_issue_id uuid not null references public.quality_issues (id),
  storage_path text not null unique,
  mime_type text not null,
  byte_size integer not null,
  sha256 text not null,
  scan_status text not null default 'pending' check (scan_status in ('pending', 'clean', 'blocked', 'error')),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index quality_issue_media_issue_idx on public.quality_issue_media (quality_issue_id);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  order_id uuid references public.orders (id),
  subject text not null,
  category text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  assigned_to uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index support_tickets_profile_created_idx
  on public.support_tickets (profile_id, created_at desc);
create index support_tickets_status_assigned_idx
  on public.support_tickets (status, assigned_to);

create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id),
  author_profile_id uuid references public.profiles (id),
  author_type text not null check (author_type in ('customer', 'staff', 'system')),
  body text not null,
  locale public.locale_code not null default 'en',
  internal_only boolean not null default false,
  created_at timestamptz not null default now()
);

create index support_messages_ticket_created_idx
  on public.support_messages (ticket_id, created_at);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id),
  order_id uuid not null references public.orders (id),
  quality_issue_id uuid references public.quality_issues (id),
  provider text not null default 'razorpay',
  provider_refund_id text,
  amount_paise bigint not null check (amount_paise > 0),
  currency char(3) not null default 'INR',
  status public.refund_status not null default 'created',
  reason_code text not null,
  initiated_by uuid not null references public.profiles (id),
  approved_by uuid references public.profiles (id),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  failed_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index refunds_provider_refund_id_unique
  on public.refunds (provider, provider_refund_id)
  where provider_refund_id is not null;
create index refunds_order_status_idx on public.refunds (order_id, status);
create index refunds_payment_idx on public.refunds (payment_id);

create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function public.set_updated_at();
