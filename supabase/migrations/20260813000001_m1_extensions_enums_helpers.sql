-- M1: extensions, enums, timestamp + staff-role helpers
-- Canonical: 03-MEENAMMA-DATABASE.md §1.1, §6.2; build brief M1.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create type public.locale_code as enum ('en', 'ta');

create type public.staff_role as enum (
  'ops_admin',
  'catalogue_manager',
  'fulfilment_manager',
  'support_agent',
  'finance_manager'
);

create type public.plan_status as enum ('active', 'paused', 'cancelled');

create type public.plan_review_status as enum (
  'scheduled',
  'open',
  'locked',
  'skipped',
  'converted',
  'expired',
  'cancelled'
);

create type public.order_status as enum (
  'draft',
  'pending_payment',
  'paid',
  'confirmed',
  'packing',
  'ready',
  'out_for_delivery',
  'delivered',
  'delivery_exception',
  'cancelled',
  'refund_pending',
  'refunded'
);

create type public.payment_attempt_status as enum (
  'created',
  'checkout_opened',
  'client_submitted',
  'pending_provider',
  'paid',
  'failed',
  'cancelled',
  'expired',
  'reconciled'
);

create type public.payment_status as enum (
  'authorized',
  'captured',
  'failed',
  'refunded',
  'partially_refunded',
  'disputed'
);

create type public.refund_status as enum ('created', 'processed', 'failed', 'cancelled');

create type public.quality_issue_status as enum (
  'submitted',
  'triaged',
  'awaiting_customer',
  'approved',
  'rejected',
  'refund_pending',
  'resolved',
  'closed'
);

create type public.notification_status as enum (
  'queued',
  'processing',
  'sent',
  'delivered',
  'failed',
  'cancelled'
);

create type public.fulfilment_event_type as enum (
  'created',
  'paid',
  'confirmed',
  'packing',
  'ready',
  'out_for_delivery',
  'delivered',
  'exception',
  'cancelled',
  'refund_requested',
  'refunded'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- plpgsql so the function can be created before staff_role_assignments exists (M2).
create or replace function public.app_has_staff_role(required_roles public.staff_role[])
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.staff_role_assignments s
    where s.profile_id = auth.uid()
      and s.role = any (required_roles)
      and s.revoked_at is null
      and s.starts_at <= now()
      and (s.ends_at is null or s.ends_at > now())
  );
end;
$$;

revoke all on function public.app_has_staff_role(public.staff_role[]) from public;
grant execute on function public.app_has_staff_role(public.staff_role[]) to authenticated;
