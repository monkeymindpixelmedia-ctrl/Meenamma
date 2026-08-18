-- M14: detach application profiles from Supabase Auth identities.

do $$
declare
  profile_fk record;
begin
  for profile_fk in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and confrelid = 'auth.users'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.profiles drop constraint %I', profile_fk.conname);
  end loop;
end
$$;
