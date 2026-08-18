-- M4: catalogue, source lots, availability, editorial content
-- Canonical: 03-MEENAMMA-DATABASE.md §3.2, §3.7 content_entries

create table public.species (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  scientific_name text,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  display_en jsonb not null,
  display_ta jsonb not null default '{}'::jsonb,
  description_en text,
  description_ta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index species_slug_unique on public.species (lower(slug));
create index species_status_archived_idx on public.species (status, archived_at);

create trigger species_set_updated_at
before update on public.species
for each row execute function public.set_updated_at();

create table public.cuts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  display_en jsonb not null,
  display_ta jsonb not null default '{}'::jsonb,
  description_en text,
  description_ta text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create trigger cuts_set_updated_at
before update on public.cuts
for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references public.species (id),
  cut_id uuid not null references public.cuts (id),
  slug text not null,
  sku text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  net_weight_grams integer not null check (net_weight_grams > 0),
  weight_tolerance_grams integer check (weight_tolerance_grams is null or weight_tolerance_grams >= 0),
  base_price_paise bigint not null check (base_price_paise >= 0),
  currency char(3) not null default 'INR',
  tax_category text,
  is_seasonal boolean not null default false,
  available_on_start date,
  available_on_end date,
  min_quantity smallint not null default 1,
  max_quantity smallint,
  quantity_increment smallint not null default 1,
  substitution_policy jsonb not null default '{}'::jsonb,
  display_en jsonb not null,
  display_ta jsonb not null default '{}'::jsonb,
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (sku),
  unique (slug)
);

create index products_species_cut_idx on public.products (species_id, cut_id);
create index products_status_archived_idx on public.products (status, archived_at);
create index products_seasonal_window_idx
  on public.products (is_seasonal, available_on_start, available_on_end);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table public.source_regions (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ta text not null,
  district text,
  region_type text not null check (region_type in ('coastal', 'inland', 'harbour')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index source_regions_active_name_district_unique
  on public.source_regions (lower(name_en), coalesce(lower(district), ''))
  where archived_at is null;
create index source_regions_status_district_idx on public.source_regions (status, district);

create trigger source_regions_set_updated_at
before update on public.source_regions
for each row execute function public.set_updated_at();

create table public.source_lots (
  id uuid primary key default gen_random_uuid(),
  lot_code text not null unique,
  species_id uuid not null references public.species (id),
  source_region_id uuid references public.source_regions (id),
  source_type text not null check (source_type in ('wild', 'farm', 'landing')),
  source_name text,
  harbour_or_landing text,
  farm_name text,
  catch_or_harvest_at timestamptz,
  received_at timestamptz not null,
  handling_state text not null check (handling_state in ('fresh', 'chilled', 'frozen')),
  approved_display_facts_en jsonb not null default '{}'::jsonb,
  approved_display_facts_ta jsonb not null default '{}'::jsonb,
  internal_trace_data jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'expired', 'archived')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index source_lots_species_status_expires_idx
  on public.source_lots (species_id, status, expires_at);
create index source_lots_received_idx on public.source_lots (received_at desc);

create trigger source_lots_set_updated_at
before update on public.source_lots
for each row execute function public.set_updated_at();

create table public.product_availability (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  source_lot_id uuid references public.source_lots (id),
  delivery_zone_id uuid not null references public.delivery_zones (id),
  available_from timestamptz not null,
  available_until timestamptz,
  stock_units integer not null check (stock_units >= 0),
  reserved_units integer not null default 0 check (reserved_units >= 0),
  effective_price_paise bigint not null check (effective_price_paise >= 0),
  currency char(3) not null default 'INR',
  status text not null default 'active' check (status in ('active', 'limited', 'unavailable', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (reserved_units <= stock_units)
);

create unique index product_availability_current_unique
  on public.product_availability (
    product_id,
    delivery_zone_id,
    coalesce(source_lot_id, '00000000-0000-0000-0000-000000000000'::uuid),
    available_from
  )
  where archived_at is null;
create index product_availability_zone_window_idx
  on public.product_availability (delivery_zone_id, status, available_from, available_until);
create index product_availability_product_status_idx
  on public.product_availability (product_id, status);

create trigger product_availability_set_updated_at
before update on public.product_availability
for each row execute function public.set_updated_at();

create table public.content_entries (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  locale public.locale_code not null,
  title text not null,
  body jsonb not null,
  seo jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (content_type, slug, locale)
);

create index content_entries_status_published_idx
  on public.content_entries (status, published_at);

create trigger content_entries_set_updated_at
before update on public.content_entries
for each row execute function public.set_updated_at();
