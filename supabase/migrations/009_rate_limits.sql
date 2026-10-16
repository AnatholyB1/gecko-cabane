-- 009_rate_limits.sql
-- Phase 1 (SEC-02, D-07, D-08): Supabase-backed fixed-window rate limiter for
-- POST /api/reservations. Keys are HMAC hashes computed by the app, never raw
-- IP / email / phone.
--
-- ADDITIVE and idempotent. Apply BEFORE deploying the code that calls
-- gecko_rate_limit_hit (handled in plan 01-09).

create table if not exists public.gecko_rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

-- RLS enabled with NO policy: service role only (like the legacy
-- phone_verifications table).
alter table public.gecko_rate_limits enable row level security;

create index if not exists idx_gecko_rate_limits_window
  on public.gecko_rate_limits (window_start);

-- Returns true when the call is allowed, false when the limit is exceeded.
-- Single INSERT ... ON CONFLICT DO UPDATE ... RETURNING statement: atomic.
create or replace function public.gecko_rate_limit_hit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.gecko_rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  -- Opportunistic purge of stale windows (about 2% of calls).
  if random() < 0.02 then
    delete from public.gecko_rate_limits
    where window_start < now() - interval '2 days';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.gecko_rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.gecko_rate_limit_hit(text, int, int) to service_role;
