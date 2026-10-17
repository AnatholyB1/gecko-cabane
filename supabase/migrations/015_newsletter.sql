-- 015_newsletter.sql
-- Phase 7 (NEWS-01; D-01, D-02, D-04, D-14, D-15): newsletter double opt-in.
-- The consent ledger gecko_marketing_consents (008) stays append-only. This
-- migration only adds lifecycle columns plus an aggregate counter table.
--
-- ADDITIVE and idempotent. No drop, no delete, no data update, no new policy
-- on the ledger (new columns inherit the admin-select RLS of 008/010/011).
-- Owner-gated: applied in plan 07-10, never from the executor.

alter table public.gecko_marketing_consents
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists country text,
  add column if not exists is_resident boolean not null default false,
  add column if not exists brevo_synced_at timestamptz,
  add column if not exists last_visit_synced date;

-- country is an ISO 3166-1 alpha-2 code from the Vercel geo header (never the IP).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'gecko_marketing_consents_country_check'
      and conrelid = 'public.gecko_marketing_consents'::regclass
  ) then
    alter table public.gecko_marketing_consents
      add constraint gecko_marketing_consents_country_check
      check (country is null or country ~ '^[A-Z]{2}$');
  end if;
end;
$$;

create index if not exists idx_gecko_marketing_consents_pending
  on public.gecko_marketing_consents (id)
  where consent and confirmed_at is null;

-- Daily aggregate counters (popup shown/dismissed, subscribed, confirmed, ...).
-- No personal data. RLS enabled with NO policy: service role only.
create table if not exists public.gecko_newsletter_events (
  day date not null,
  event text not null check (event in ('popup_shown', 'popup_dismissed', 'subscribed', 'confirmed', 'unsubscribed')),
  source text not null,
  count integer not null default 0,
  primary key (day, event, source)
);

alter table public.gecko_newsletter_events enable row level security;
revoke all on public.gecko_newsletter_events from anon, authenticated;

create or replace function public.gecko_newsletter_count(
  p_event text,
  p_source text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gecko_newsletter_events as e (day, event, source, count)
  values ((now() at time zone 'Asia/Bangkok')::date, p_event, left(p_source, 32), 1)
  on conflict (day, event, source) do update set count = e.count + 1;
end;
$$;

revoke all on function public.gecko_newsletter_count(text, text) from public, anon, authenticated;
grant execute on function public.gecko_newsletter_count(text, text) to service_role;
