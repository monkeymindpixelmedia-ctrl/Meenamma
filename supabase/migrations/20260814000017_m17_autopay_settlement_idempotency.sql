-- M17: atomic, replay-safe settlement of captured kudam payments.

create unique index if not exists kudam_deposits_provider_payment_unique
  on public.kudam_deposits (provider_payment_id)
  where provider_payment_id is not null;

create or replace function public.settle_autopay_payment(
  p_profile_id uuid,
  p_payment_id text,
  p_captured_paise bigint
)
returns table (status text, credited_paise bigint)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_existing_profile uuid;
  v_existing_amount bigint;
  v_accrual_ids uuid[];
  v_covered_paise bigint;
  v_kudam_id uuid;
  v_saved_paise bigint;
  v_goal_paise bigint;
  v_updated_count integer;
begin
  if p_profile_id is null or coalesce(p_payment_id, '') = '' or p_captured_paise <= 0 then
    raise exception 'invalid autopay settlement input' using errcode = '22023';
  end if;

  -- All settlements for a profile are serialized, including different payment ids.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_profile_id::text, 0));

  select d.profile_id, d.amount_paise
    into v_existing_profile, v_existing_amount
    from public.kudam_deposits d
   where d.provider_payment_id = p_payment_id
   for update;
  if found then
    if v_existing_profile <> p_profile_id then
      raise exception 'payment id belongs to another profile' using errcode = '23505';
    end if;
    return query select 'duplicate'::text, v_existing_amount;
    return;
  end if;

  select pg_catalog.array_agg(c.id order by c.debit_date, c.id),
         coalesce(pg_catalog.sum(c.amount_paise), 0)
    into v_accrual_ids, v_covered_paise
    from (
      select a.id, a.debit_date, a.amount_paise,
             pg_catalog.sum(a.amount_paise) over (
               order by a.debit_date, a.id rows unbounded preceding) as running_paise
        from public.autopay_accruals a
       where a.profile_id = p_profile_id
         and a.settled_at is null
    ) c
   where c.running_paise <= p_captured_paise;

  if v_covered_paise <= 0 then
    return query select 'no_covered'::text, 0::bigint;
    return;
  end if;

  select k.id, k.saved_paise, k.goal_paise
    into v_kudam_id, v_saved_paise, v_goal_paise
    from public.kudams k
   where k.profile_id = p_profile_id
     and k.status = 'active'
   order by k.created_at desc
   limit 1
   for update;
  if not found then
    return query select 'no_kudam'::text, 0::bigint;
    return;
  end if;

  -- Lock and re-check the exact rows before writing the credit.
  perform 1
    from public.autopay_accruals a
   where a.id = any(v_accrual_ids)
   order by a.debit_date, a.id
   for update;

  insert into public.kudam_deposits (
    kudam_id, profile_id, amount_paise, provider_payment_id, source
  ) values (
    v_kudam_id, p_profile_id, v_covered_paise, p_payment_id, 'autopay'
  );

  update public.autopay_accruals
     set settled_at = pg_catalog.now(), settlement_payment_id = p_payment_id
   where id = any(v_accrual_ids)
     and settled_at is null;
  get diagnostics v_updated_count = row_count;
  if v_updated_count <> pg_catalog.array_length(v_accrual_ids, 1) then
    raise exception 'accrual settlement conflict' using errcode = '40001';
  end if;

  update public.kudams as k
     set saved_paise = v_saved_paise + v_covered_paise,
         status = case
           when v_saved_paise + v_covered_paise >= v_goal_paise then 'complete'
           else k.status
         end
   where k.id = v_kudam_id;

  return query select 'settled'::text, v_covered_paise;
end;
$$;

revoke all on function public.settle_autopay_payment(uuid, text, bigint) from public;
revoke all on function public.settle_autopay_payment(uuid, text, bigint) from anon;
revoke all on function public.settle_autopay_payment(uuid, text, bigint) from authenticated;
grant execute on function public.settle_autopay_payment(uuid, text, bigint) to service_role;
