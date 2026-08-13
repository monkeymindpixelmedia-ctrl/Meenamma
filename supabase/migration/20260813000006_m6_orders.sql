-- M6: immutable orders, items, events
-- Canonical: 03-MEENAMMA-DATABASE.md §3.5; no updated_at on history tables.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  profile_id uuid references public.profiles (id),
  guest_contact_snapshot jsonb,
  plan_review_id uuid unique references public.plan_reviews (id),
  status public.order_status not null default 'draft',
  currency char(3) not null default 'INR',
  subtotal_paise bigint not null default 0 check (subtotal_paise >= 0),
  delivery_fee_paise bigint not null default 0 check (delivery_fee_paise >= 0),
  discount_paise bigint not null default 0 check (discount_paise >= 0),
  tax_paise bigint not null default 0 check (tax_paise >= 0),
  total_paise bigint not null default 0 check (total_paise >= 0),
  address_snapshot jsonb not null,
  delivery_slot_snapshot jsonb not null,
  policy_snapshot jsonb not null,
  quote_expires_at timestamptz,
  paid_at timestamptz,
  confirmed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index orders_profile_created_idx on public.orders (profile_id, created_at desc);
create index orders_status_created_idx on public.orders (status, created_at);

alter table public.plan_reviews
  add constraint plan_reviews_converted_order_id_fkey
  foreign key (converted_order_id) references public.orders (id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  product_id uuid references public.products (id),
  species_id uuid references public.species (id),
  cut_id uuid references public.cuts (id),
  source_lot_id uuid references public.source_lots (id),
  item_snapshot jsonb not null,
  quantity integer not null check (quantity > 0),
  net_weight_grams integer not null,
  unit_price_paise bigint not null check (unit_price_paise >= 0),
  line_total_paise bigint not null check (line_total_paise >= 0),
  currency char(3) not null default 'INR',
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_source_lot_idx on public.order_items (source_lot_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  event_type public.fulfilment_event_type not null,
  from_status public.order_status,
  to_status public.order_status,
  actor_profile_id uuid references public.profiles (id),
  source text not null check (source in ('system', 'customer', 'staff', 'provider')),
  payload jsonb not null default '{}'::jsonb,
  correlation_id uuid,
  occurred_at timestamptz not null default now()
);

create index order_events_order_occurred_idx on public.order_events (order_id, occurred_at);
create index order_events_correlation_idx on public.order_events (correlation_id);
create index order_events_type_occurred_idx on public.order_events (event_type, occurred_at);
