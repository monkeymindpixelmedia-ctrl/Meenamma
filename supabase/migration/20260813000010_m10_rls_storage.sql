-- M10: RLS on every public table + storage buckets/policies
-- Canonical: 03-MEENAMMA-DATABASE.md §6; seed is separate (supabase/seed.sql).

alter table public.profiles enable row level security;
alter table public.staff_role_assignments enable row level security;
alter table public.preferences enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.delivery_zone_coverage enable row level security;
alter table public.delivery_slots enable row level security;
alter table public.addresses enable row level security;
alter table public.species enable row level security;
alter table public.cuts enable row level security;
alter table public.products enable row level security;
alter table public.source_regions enable row level security;
alter table public.source_lots enable row level security;
alter table public.product_availability enable row level security;
alter table public.content_entries enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.plan_reviews enable row level security;
alter table public.plan_review_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.payments enable row level security;
alter table public.quality_issues enable row level security;
alter table public.quality_issue_media enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.refunds enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.protect_profile_status()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status
     and not public.app_has_staff_role(array['ops_admin']::public.staff_role[]) then
    raise exception 'profiles.status is not customer-editable';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_status
before update on public.profiles
for each row execute function public.protect_profile_status();

-- Identity
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_select on public.profiles
  for select to authenticated
  using (
    public.app_has_staff_role(
      array['ops_admin', 'support_agent', 'fulfilment_manager', 'finance_manager']::public.staff_role[]
    )
  );

create policy preferences_select_own on public.preferences
  for select to authenticated using (profile_id = auth.uid());
create policy preferences_insert_own on public.preferences
  for insert to authenticated with check (profile_id = auth.uid());
create policy preferences_update_own on public.preferences
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy addresses_select_own on public.addresses
  for select to authenticated using (profile_id = auth.uid());
create policy addresses_insert_own on public.addresses
  for insert to authenticated with check (profile_id = auth.uid());
create policy addresses_update_own on public.addresses
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy addresses_staff_select on public.addresses
  for select to authenticated
  using (
    public.app_has_staff_role(
      array['ops_admin', 'support_agent', 'fulfilment_manager']::public.staff_role[]
    )
  );

-- Staff roles: no customer access
create policy staff_roles_ops_select on public.staff_role_assignments
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin']::public.staff_role[]));

-- Public catalogue / zones (published only)
create policy delivery_zones_public_select on public.delivery_zones
  for select to anon, authenticated
  using (status = 'enabled' and archived_at is null);
create policy delivery_zones_staff on public.delivery_zones
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'fulfilment_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'fulfilment_manager']::public.staff_role[]));

create policy delivery_coverage_public_select on public.delivery_zone_coverage
  for select to anon, authenticated
  using (status = 'active' and archived_at is null);
create policy delivery_coverage_staff on public.delivery_zone_coverage
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'fulfilment_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'fulfilment_manager']::public.staff_role[]));

create policy delivery_slots_public_select on public.delivery_slots
  for select to anon, authenticated
  using (status = 'active' and archived_at is null);
create policy delivery_slots_staff on public.delivery_slots
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'fulfilment_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'fulfilment_manager']::public.staff_role[]));

create policy species_public_select on public.species
  for select to anon, authenticated
  using (status = 'published' and archived_at is null);
create policy species_staff on public.species
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]));

create policy cuts_public_select on public.cuts
  for select to anon, authenticated
  using (archived_at is null);
create policy cuts_staff on public.cuts
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]));

create policy products_public_select on public.products
  for select to anon, authenticated
  using (status = 'published' and archived_at is null);
create policy products_staff on public.products
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]));

create policy source_regions_public_select on public.source_regions
  for select to anon, authenticated
  using (status = 'active' and archived_at is null);
create policy source_regions_staff on public.source_regions
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]));

create policy source_lots_public_select on public.source_lots
  for select to anon, authenticated
  using (status = 'active' and archived_at is null);
create policy source_lots_staff on public.source_lots
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]));

create policy availability_public_select on public.product_availability
  for select to anon, authenticated
  using (status in ('active', 'limited', 'unavailable') and archived_at is null);
create policy availability_staff on public.product_availability
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]));

create policy content_public_select on public.content_entries
  for select to anon, authenticated
  using (status = 'published' and archived_at is null);
create policy content_staff on public.content_entries
  for all to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]))
  with check (public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[]));

-- Plans / reviews: customer read own; mutations via service role
create policy plans_select_own on public.plans
  for select to authenticated using (profile_id = auth.uid());
create policy plan_items_select_own on public.plan_items
  for select to authenticated
  using (
    exists (select 1 from public.plans p where p.id = plan_id and p.profile_id = auth.uid())
  );
create policy plan_reviews_select_own on public.plan_reviews
  for select to authenticated using (profile_id = auth.uid());
create policy plan_review_items_select_own on public.plan_review_items
  for select to authenticated
  using (
    exists (
      select 1 from public.plan_reviews r
      where r.id = plan_review_id and r.profile_id = auth.uid()
    )
  );

create policy plans_staff_select on public.plans
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

-- Orders: customer read own; no client insert/update/delete
create policy orders_select_own on public.orders
  for select to authenticated using (profile_id = auth.uid());
create policy order_items_select_own on public.order_items
  for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy order_events_select_own on public.order_events
  for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy orders_staff_select on public.orders
  for select to authenticated
  using (
    public.app_has_staff_role(
      array['ops_admin', 'fulfilment_manager', 'support_agent', 'finance_manager']::public.staff_role[]
    )
  );
create policy order_items_staff_select on public.order_items
  for select to authenticated
  using (
    public.app_has_staff_role(
      array['ops_admin', 'fulfilment_manager', 'support_agent', 'finance_manager']::public.staff_role[]
    )
  );
create policy order_events_staff_select on public.order_events
  for select to authenticated
  using (
    public.app_has_staff_role(
      array['ops_admin', 'fulfilment_manager', 'support_agent', 'finance_manager']::public.staff_role[]
    )
  );

create policy payment_attempts_select_own on public.payment_attempts
  for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy payments_select_own on public.payments
  for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy refunds_select_own on public.refunds
  for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy refunds_finance_select on public.refunds
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'finance_manager']::public.staff_role[]));

create policy quality_issues_select_own on public.quality_issues
  for select to authenticated using (profile_id = auth.uid());
create policy quality_media_select_own on public.quality_issue_media
  for select to authenticated
  using (
    exists (
      select 1 from public.quality_issues q
      where q.id = quality_issue_id and q.profile_id = auth.uid()
    )
  );
create policy quality_staff_select on public.quality_issues
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

create policy support_tickets_select_own on public.support_tickets
  for select to authenticated using (profile_id = auth.uid());
create policy support_messages_select_own on public.support_messages
  for select to authenticated
  using (
    internal_only = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.profile_id = auth.uid()
    )
  );
create policy support_staff_select on public.support_tickets
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));
create policy support_messages_staff_select on public.support_messages
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

create policy notifications_select_own on public.notifications
  for select to authenticated using (profile_id = auth.uid());

-- Intentionally no customer/anon policies on:
-- staff_role_assignments (except ops select), payment_webhook_events,
-- notification_outbox, audit_logs.

create policy audit_logs_ops_select on public.audit_logs
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin']::public.staff_role[]));

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-media', 'product-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('editorial-media', 'editorial-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('quality-media', 'quality-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do nothing;

create policy product_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-media');
create policy editorial_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'editorial-media');
create policy product_media_staff_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-media', 'editorial-media')
    and public.app_has_staff_role(array['ops_admin', 'catalogue_manager']::public.staff_role[])
  );
create policy quality_media_own_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'quality-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[])
    )
  );
create policy quality_media_own_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'quality-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- PostgREST exposure: RLS remains the access control (config auto_expose is off by default).
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
