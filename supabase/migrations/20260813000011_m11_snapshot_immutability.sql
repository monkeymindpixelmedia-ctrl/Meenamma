-- M11: immutable order snapshots + remaining staff select policies
-- Canonical: 03-MEENAMMA-DATABASE.md §4, §6.1, §10.4–§10.7
-- Additive on M1–M10 (already applied on linked dev). Do not rewrite M1–M10.

create or replace function public.reject_immutable_row()
returns trigger
language plpgsql
as $$
begin
  raise exception '% snapshots are immutable', tg_table_name;
end;
$$;

drop trigger if exists order_items_no_update on public.order_items;
create trigger order_items_no_update
before update on public.order_items
for each row execute function public.reject_immutable_row();

drop trigger if exists order_items_no_delete on public.order_items;
create trigger order_items_no_delete
before delete on public.order_items
for each row execute function public.reject_immutable_row();

drop trigger if exists order_events_no_update on public.order_events;
create trigger order_events_no_update
before update on public.order_events
for each row execute function public.reject_immutable_row();

drop trigger if exists order_events_no_delete on public.order_events;
create trigger order_events_no_delete
before delete on public.order_events
for each row execute function public.reject_immutable_row();

create or replace function public.protect_order_snapshots()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'orders are not deletable';
  end if;
  if old.status is distinct from 'draft' then
    if old.address_snapshot is distinct from new.address_snapshot
       or old.delivery_slot_snapshot is distinct from new.delivery_slot_snapshot
       or old.policy_snapshot is distinct from new.policy_snapshot
       or old.subtotal_paise is distinct from new.subtotal_paise
       or old.delivery_fee_paise is distinct from new.delivery_fee_paise
       or old.discount_paise is distinct from new.discount_paise
       or old.tax_paise is distinct from new.tax_paise
       or old.total_paise is distinct from new.total_paise
       or old.public_reference is distinct from new.public_reference
       or old.guest_contact_snapshot is distinct from new.guest_contact_snapshot then
      raise exception 'order snapshots are immutable after draft';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_protect_snapshots on public.orders;
create trigger orders_protect_snapshots
before update or delete on public.orders
for each row execute function public.protect_order_snapshots();

drop policy if exists plan_items_staff_select on public.plan_items;
create policy plan_items_staff_select on public.plan_items
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

drop policy if exists plan_reviews_staff_select on public.plan_reviews;
create policy plan_reviews_staff_select on public.plan_reviews
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

drop policy if exists plan_review_items_staff_select on public.plan_review_items;
create policy plan_review_items_staff_select on public.plan_review_items
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

drop policy if exists quality_media_staff_select on public.quality_issue_media;
create policy quality_media_staff_select on public.quality_issue_media
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'support_agent']::public.staff_role[]));

drop policy if exists payment_attempts_staff_select on public.payment_attempts;
create policy payment_attempts_staff_select on public.payment_attempts
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'finance_manager']::public.staff_role[]));

drop policy if exists payments_staff_select on public.payments;
create policy payments_staff_select on public.payments
  for select to authenticated
  using (public.app_has_staff_role(array['ops_admin', 'finance_manager']::public.staff_role[]));
