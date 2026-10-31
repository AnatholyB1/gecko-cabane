-- 022_gecko_revoke_admin_hardening.sql
-- Additive hardening of public.gecko_revoke_admin (introduced by 021). NOT APPLIED by the code:
-- apply by hand after 021, off service hours, on the owner's go-ahead. Idempotent (create or replace).
--
-- Findings of the 17-SECURITY audit (low):
--   1. search_path = public lacked pg_temp last (a temp object could shadow a public one).
--   2. The function never checked that the caller (p_actor) is itself an administrator: the only
--      caller check was the service_role grant plus requireAdmin() upstream.
--
-- Behaviour kept: service_role only, same lock, same results 'ok' | 'self' | 'last' | 'not_found'.
-- New result 'forbidden' (actor is not in gecko_admins). The application maps any unknown outcome
-- to 'not_found' (src/utils/access/deps.ts), so no application change is needed; the route already
-- passes the signed-in administrator's id as p_actor, which is always a gecko_admins row.

create or replace function public.gecko_revoke_admin(p_actor uuid, p_target uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_actor is null or p_target is null then
    return 'not_found';
  end if;
  if p_actor = p_target then
    return 'self';
  end if;

  lock table public.gecko_admins in share row exclusive mode;

  -- The actor must itself be an administrator (checked under the lock, with the same snapshot).
  if not exists (select 1 from public.gecko_admins where id = p_actor) then
    return 'forbidden';
  end if;

  if not exists (select 1 from public.gecko_admins where id = p_target) then
    return 'not_found';
  end if;

  select count(*) into v_count from public.gecko_admins;
  if v_count <= 1 then
    return 'last';
  end if;

  delete from public.gecko_admins where id = p_target;
  return 'ok';
end;
$$;

-- Privileges are unchanged by create or replace; restated so this file is self-contained.
revoke all on function public.gecko_revoke_admin(uuid, uuid) from public, anon, authenticated;
grant execute on function public.gecko_revoke_admin(uuid, uuid) to service_role;

-- ROLLBACK (manual): re-run the create or replace of 021_gecko_access_tokens.sql.
