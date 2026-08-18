-- M3: delivery zones, coverage, slots, addresses
-- Canonical: 03-MEENAMMA-DATABASE.md §3.3, §3.1 addresses

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  state text not null default 'Tamil Nadu',
  geometry jsonb,
  status text not null default 'disabled' check (status in ('disabled', 'enabled', 'archived')),
  minimum_basket_paise bigint check (minimum_basket_paise is null or minimum_basket_paise >= 0),
  delivery_fee_paise bigint check (delivery_fee_paise is null or delivery_fee_paise >= 0),
  currency char(3) not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (code)
);

create index delivery_zones_status_state_idx on public.delivery_zones (status, state);

create trigger delivery_zones_set_updated_at
before update on public.delivery_zones
for each row execute function public.set_updated_at();

create table public.delivery_zone_coverage (
  id uuid primary key default gen_random_uuid(),
  delivery_zone_id uuid not null references public.delivery_zones (id),
  district text,
  locality text,
  postal_code text,
  coverage_type text not null check (coverage_type in ('postal_code', 'locality', 'district')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  priority smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (
    postal_code is not null
    or locality is not null
    or district is not null
  )
);

create unique index delivery_zone_coverage_active_match_unique
  on public.delivery_zone_coverage (
    delivery_zone_id,
    coalesce(postal_code, ''),
    coalesce(district, ''),
    coalesce(locality, '')
  )
  where archived_at is null and status = 'active';
create index delivery_zone_coverage_postal_idx
  on public.delivery_zone_coverage (postal_code, status);
create index delivery_zone_coverage_district_locality_idx
  on public.delivery_zone_coverage (district, locality, status);
create index delivery_zone_coverage_zone_status_idx
  on public.delivery_zone_coverage (delivery_zone_id, status);

create trigger delivery_zone_coverage_set_updated_at
before update on public.delivery_zone_coverage
for each row execute function public.set_updated_at();

create table public.delivery_slots (
  id uuid primary key default gen_random_uuid(),
  delivery_zone_id uuid not null references public.delivery_zones (id),
  slot_date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  cutoff_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  reserved_count integer not null default 0 check (reserved_count >= 0),
  status text not null default 'active' check (status in ('active', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (delivery_zone_id, slot_date, start_at, end_at),
  check (end_at > start_at),
  check (reserved_count <= capacity)
);

create index delivery_slots_zone_status_start_idx
  on public.delivery_slots (delivery_zone_id, status, start_at);
create index delivery_slots_cutoff_idx on public.delivery_slots (cutoff_at);

create trigger delivery_slots_set_updated_at
before update on public.delivery_slots
for each row execute function public.set_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  label text not null,
  recipient_name text not null,
  phone_e164 text not null,
  line1 text not null,
  line2 text,
  landmark text,
  locality text not null,
  city text not null,
  state text,
  postal_code text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  delivery_zone_id uuid references public.delivery_zones (id),
  is_default boolean not null default false,
  delivery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index addresses_default_unique
  on public.addresses (profile_id)
  where is_default and archived_at is null;
create index addresses_profile_archived_idx on public.addresses (profile_id, archived_at);
create index addresses_zone_idx on public.addresses (delivery_zone_id);

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();
