-- 016_review_stats.sql
-- Phase 5 (REV-06, D-07, D-08, D-09). Apply BEFORE deploying code that calls
-- gecko_review_click_hit (owner checklist). Counter rows (month x source x kind),
-- no personal data, no IP; bots/prefetch can inflate counts (accepted, same as phase 4).

-- ---------------------------------------------------------------------------
-- Per-source counters for /review visits and outbound review clicks
-- ---------------------------------------------------------------------------
create table if not exists public.gecko_review_clicks (
  month date not null,
  source text not null check (source in ('email', 'qr', 'wa', 'site', 'unknown')),
  kind text not null check (kind in ('visit', 'google', 'tripadvisor')),
  hits integer not null default 0,
  primary key (month, source, kind)
);

alter table public.gecko_review_clicks enable row level security;

drop policy if exists "gecko admins read review clicks" on public.gecko_review_clicks;
create policy "gecko admins read review clicks"
  on public.gecko_review_clicks
  for select
  to authenticated
  using (public.gecko_is_admin());

revoke all on public.gecko_review_clicks from anon, authenticated;
grant select on public.gecko_review_clicks to authenticated;

-- Written only through this RPC, executable by service_role only.
create or replace function public.gecko_review_click_hit(p_source text, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gecko_review_clicks as r (month, source, kind, hits)
  values (
    date_trunc('month', now() at time zone 'Asia/Bangkok')::date,
    p_source,
    p_kind,
    1
  )
  on conflict (month, source, kind) do update set hits = r.hits + 1;
end;
$$;

revoke all on function public.gecko_review_click_hit(text, text) from public, anon, authenticated;
grant execute on function public.gecko_review_click_hit(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Manual monthly review totals (entered by admins)
-- ---------------------------------------------------------------------------
create table if not exists public.gecko_review_monthly_totals (
  month date not null,
  platform text not null check (platform in ('google', 'tripadvisor')),
  total_reviews integer not null check (total_reviews >= 0 and total_reviews <= 100000),
  updated_at timestamptz not null default now(),
  primary key (month, platform)
);

alter table public.gecko_review_monthly_totals enable row level security;

drop policy if exists "gecko admins select review totals" on public.gecko_review_monthly_totals;
create policy "gecko admins select review totals"
  on public.gecko_review_monthly_totals
  for select
  to authenticated
  using (public.gecko_is_admin());

drop policy if exists "gecko admins insert review totals" on public.gecko_review_monthly_totals;
create policy "gecko admins insert review totals"
  on public.gecko_review_monthly_totals
  for insert
  to authenticated
  with check (public.gecko_is_admin());

drop policy if exists "gecko admins update review totals" on public.gecko_review_monthly_totals;
create policy "gecko admins update review totals"
  on public.gecko_review_monthly_totals
  for update
  to authenticated
  using (public.gecko_is_admin())
  with check (public.gecko_is_admin());

revoke all on public.gecko_review_monthly_totals from anon, authenticated;
grant select, insert, update on public.gecko_review_monthly_totals to authenticated;
