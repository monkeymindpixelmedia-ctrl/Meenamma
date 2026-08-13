-- M5: plans and plan reviews (converted_order_id FK added in M6)
-- Canonical: 03-MEENAMMA-DATABASE.md §3.4

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  status public.plan_status not null default 'active',
  cadence_code text not null,
  address_id uuid references public.addresses (id),
  slot_preference jsonb not null default '{}'::jsonb,
  next_cycle_at timestamptz,
  paused_at timestamptz,
  resume_at timestamptz,
  cancelled_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index plans_profile_status_idx on public.plans (profile_id, status);
create unique index plans_one_active_per_profile
  on public.plans (profile_id)
  where status = 'active' and archived_at is null;
create index plans_status_next_cycle_idx on public.plans (status, next_cycle_at);

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id),
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index plan_items_active_product_unique
  on public.plan_items (plan_id, product_id)
  where archived_at is null;
create index plan_items_plan_position_idx on public.plan_items (plan_id, position);

create trigger plan_items_set_updated_at
before update on public.plan_items
for each row execute function public.set_updated_at();

create table public.plan_reviews (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id),
  profile_id uuid not null references public.profiles (id),
  cycle_key date not null,
  status public.plan_review_status not null default 'scheduled',
  delivery_zone_id uuid references public.delivery_zones (id),
  address_snapshot jsonb not null,
  slot_snapshot jsonb,
  opens_at timestamptz not null,
  locks_at timestamptz not null,
  review_version integer not null default 1,
  skip_reason_code text,
  paused_reason_code text,
  converted_order_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, cycle_key)
);

create index plan_reviews_profile_status_opens_idx
  on public.plan_reviews (profile_id, status, opens_at)
  where status in ('scheduled', 'open');
create index plan_reviews_status_locks_idx on public.plan_reviews (status, locks_at);

create trigger plan_reviews_set_updated_at
before update on public.plan_reviews
for each row execute function public.set_updated_at();

create table public.plan_review_items (
  id uuid primary key default gen_random_uuid(),
  plan_review_id uuid not null references public.plan_reviews (id),
  product_id uuid references public.products (id),
  source_lot_id uuid references public.source_lots (id),
  item_snapshot jsonb not null,
  quantity integer not null check (quantity > 0),
  unit_price_paise bigint not null check (unit_price_paise >= 0),
  line_total_paise bigint not null check (line_total_paise >= 0),
  currency char(3) not null default 'INR',
  origin text not null check (origin in ('plan_default', 'customer_add', 'customer_swap', 'staff')),
  replaced_review_item_id uuid references public.plan_review_items (id),
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create index plan_review_items_current_idx on public.plan_review_items (plan_review_id, is_current);
create index plan_review_items_product_idx on public.plan_review_items (product_id);
