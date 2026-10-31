-- 021_gecko_access_tokens.sql
-- Phase 17 (ACC-02), v1.1: admin invitations and password-reset links.
--
-- ADDITIVE and idempotent: one new gecko_ table and one new function. Nothing existing is altered.
-- Apply BEFORE deploying the code that calls them (see 17b-DEPLOY-NOTES.md). Requires the owner's
-- agreement (shared Supabase project).
--
-- Security model:
--  * the table holds only the SHA-256 hash of each token (never the token): a database read
--    cannot replay a link;
--  * RLS is enabled with NO policy and every privilege is revoked from anon/authenticated:
--    only the service-role key (server code, never the browser) can read or write it;
--  * gecko_revoke_admin() is executable by service_role only; it takes a table lock so that two
--    admins revoking each other at the same instant cannot leave the restaurant with no admin.

create table if not exists public.gecko_access_tokens (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('invite', 'reset')),
  email text not null check (email = lower(email) and char_length(email) between 6 and 254),
  user_id uuid references auth.users (id) on delete cascade,
  invited_by uuid references auth.users (id) on delete set null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  constraint gecko_access_tokens_expiry_check check (expires_at > created_at)
);

-- At most one live (unused, unrevoked) token per kind and address.
create unique index if not exists gecko_access_tokens_one_live
  on public.gecko_access_tokens (kind, email)
  where used_at is null and revoked_at is null;

create index if not exists idx_gecko_access_tokens_invited_by
  on public.gecko_access_tokens (invited_by)
  where invited_by is not null;

alter table public.gecko_access_tokens enable row level security;
revoke all on public.gecko_access_tokens from public, anon, authenticated;

-- Atomic revocation of an administrator.
-- Returns 'ok' | 'self' | 'last' | 'not_found'.
create or replace function public.gecko_revoke_admin(p_actor uuid, p_target uuid)
returns text
language plpgsql
security definer
set search_path = public
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

revoke all on function public.gecko_revoke_admin(uuid, uuid) from public, anon, authenticated;
grant execute on function public.gecko_revoke_admin(uuid, uuid) to service_role;

-- ROLLBACK (manual):
--   drop function if exists public.gecko_revoke_admin(uuid, uuid);
--   drop index if exists public.gecko_access_tokens_one_live;
--   drop index if exists public.idx_gecko_access_tokens_invited_by;
--   (the token table can be left in place; it is empty of anything but hashed, expiring links)
