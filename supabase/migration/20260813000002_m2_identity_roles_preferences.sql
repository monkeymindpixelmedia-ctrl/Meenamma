-- M2: identity, staff roles, preferences
-- Canonical: 03-MEENAMMA-DATABASE.md §3.1

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  display_name text,
  phone_e164 text,
  email citext,
  locale public.locale_code not null default 'en',
  status text not null default 'active' check (status in ('active', 'suspended', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index profiles_phone_e164_unique on public.profiles (phone_e164) where phone_e164 is not null;
create unique index profiles_email_unique on public.profiles (email) where email is not null;
create index profiles_status_idx on public.profiles (status);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.staff_role_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  role public.staff_role not null,
  granted_by uuid not null references public.profiles (id),
  scope jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index staff_role_assignments_active_unique
  on public.staff_role_assignments (profile_id, role)
  where revoked_at is null;
create index staff_role_assignments_window_idx
  on public.staff_role_assignments (profile_id, starts_at, ends_at);

create table public.preferences (
  profile_id uuid primary key references public.profiles (id),
  household_size smallint check (household_size is null or household_size > 0),
  likes jsonb not null default '[]'::jsonb,
  dislikes jsonb not null default '[]'::jsonb,
  cut_comfort jsonb not null default '[]'::jsonb,
  substitution_preferences jsonb not null default '{}'::jsonb,
  marketing_email_opt_in boolean not null default false,
  marketing_sms_opt_in boolean not null default false,
  marketing_whatsapp_opt_in boolean not null default false,
  transactional_channel_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger preferences_set_updated_at
before update on public.preferences
for each row execute function public.set_updated_at();

-- Bootstrap a profile when an auth user is created. Never grant staff roles here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone_e164, locale)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce((new.raw_user_meta_data ->> 'locale')::public.locale_code, 'en')
  );
  insert into public.preferences (profile_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
