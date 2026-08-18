-- M9: webhook ledger, notifications, outbox, audit
-- Canonical: 03-MEENAMMA-DATABASE.md §3.6–§3.7

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  provider_event_id text,
  event_type text not null,
  payload_hash text not null,
  signature_valid boolean not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  payment_attempt_id uuid references public.payment_attempts (id),
  payment_id uuid references public.payments (id),
  refund_id uuid references public.refunds (id),
  raw_payload jsonb not null,
  correlation_id uuid
);

create unique index payment_webhook_events_provider_event_unique
  on public.payment_webhook_events (provider, provider_event_id)
  where provider_event_id is not null;
create unique index payment_webhook_events_payload_hash_unique
  on public.payment_webhook_events (provider, payload_hash);
create index payment_webhook_events_processed_received_idx
  on public.payment_webhook_events (processed_at, received_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  order_id uuid references public.orders (id),
  plan_review_id uuid references public.plan_reviews (id),
  channel text not null check (channel in ('email', 'sms', 'whatsapp', 'in_app')),
  template_key text not null,
  template_version text not null,
  locale public.locale_code not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'queued',
  provider_message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notifications_profile_created_idx
  on public.notifications (profile_id, created_at desc);
create index notifications_status_created_idx
  on public.notifications (status, created_at);

create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_key text not null,
  idempotency_key text not null unique,
  payload jsonb not null,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create index notification_outbox_processed_available_idx
  on public.notification_outbox (processed_at, available_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id),
  actor_type text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  correlation_id uuid,
  request_id uuid,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_created_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_created_idx
  on public.audit_logs (actor_profile_id, created_at desc);
create index audit_logs_correlation_idx on public.audit_logs (correlation_id);
