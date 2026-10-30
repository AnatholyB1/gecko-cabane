-- 018_weekly_kpis.sql
-- Phase 8 (KPI-02..KPI-08, D-06). FILE ONLY: apply after explicit owner approval,
-- via psql + supabase migration repair, never `db push`.
-- One row per week (Monday -> Sunday, Krabi time). The cron writes collector columns
-- with the service role (bypasses RLS); admins may only write manual-entry columns.
-- No personal data in this table.

create table if not exists public.gecko_weekly_kpis (
  week_start date primary key check (extract(isodow from week_start) = 1),
  week_end date not null check (week_end = week_start + 6),

  -- Collector columns (cron, service role)
  reservations_new integer,
  covers integer,
  completed integer,
  no_show integer,
  cancelled integer,
  no_show_rate numeric(5,4),
  reservations_by_source jsonb,
  review_clicks_week jsonb,
  review_clicks_snapshot jsonb,
  review_clicks_snapshot_month date,
  newsletter_popup_shown integer,
  newsletter_subscribed integer,
  newsletter_confirmed integer,
  newsletter_unsubscribed integer,
  newsletter_active_total integer,
  gsc_clicks integer,
  gsc_impressions integer,
  gsc_ctr numeric(6,4),
  gsc_position numeric(6,2),
  gsc_days_covered smallint,
  gsc_partial boolean,
  tripadvisor_rank integer,
  tripadvisor_total integer,
  tripadvisor_checked_at timestamptz,
  sources_status jsonb not null default '{}'::jsonb,
  alerts jsonb not null default '[]'::jsonb,
  narrative jsonb,
  report_mode text check (report_mode in ('test', 'live')),
  report_sent_at timestamptz,
  collected_at timestamptz,

  -- Manual entry columns (admin, D-03)
  google_reviews_total integer check (google_reviews_total between 0 and 100000),
  google_new_reviews integer check (google_new_reviews between 0 and 1000),
  google_min_rating smallint check (google_min_rating between 1 and 5),
  manual_note text check (char_length(manual_note) <= 500),
  manual_updated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gecko_weekly_kpis enable row level security;

drop policy if exists "gecko admins select weekly kpis" on public.gecko_weekly_kpis;
create policy "gecko admins select weekly kpis"
  on public.gecko_weekly_kpis
  for select
  to authenticated
  using (public.gecko_is_admin());

drop policy if exists "gecko admins insert weekly kpis" on public.gecko_weekly_kpis;
create policy "gecko admins insert weekly kpis"
  on public.gecko_weekly_kpis
  for insert
  to authenticated
  with check (public.gecko_is_admin());

drop policy if exists "gecko admins update weekly kpis" on public.gecko_weekly_kpis;
create policy "gecko admins update weekly kpis"
  on public.gecko_weekly_kpis
  for update
  to authenticated
  using (public.gecko_is_admin())
  with check (public.gecko_is_admin());

revoke all on public.gecko_weekly_kpis from anon, authenticated;
grant select on public.gecko_weekly_kpis to authenticated;
grant insert (week_start, week_end, google_reviews_total, google_new_reviews, google_min_rating, manual_note, manual_updated_at)
  on public.gecko_weekly_kpis to authenticated;
grant update (google_reviews_total, google_new_reviews, google_min_rating, manual_note, manual_updated_at, updated_at)
  on public.gecko_weekly_kpis to authenticated;
