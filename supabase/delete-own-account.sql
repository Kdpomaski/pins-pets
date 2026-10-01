-- Permanent account deletion for Pins Pets (App Store 5.1.1(v)).
-- Run once in the Supabase SQL editor for the existing Pins project.
-- Does not contain secrets. The Apple client secret / .p8 stays in the
-- Supabase Apple provider (Team ID K39284B7CL), not in this repo.
--
-- profiles.id references auth.users on delete cascade.
-- user_entitlements is removed when that table exists.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if to_regclass('public.user_entitlements') is not null then
    execute 'delete from public.user_entitlements where user_id = $1'
      using auth.uid();
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
