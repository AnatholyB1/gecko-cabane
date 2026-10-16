-- 008_reservation_booking.sql
-- Phase 1 (reservation without OTP): locale on reservations, marketing consent
-- ledger, and an atomic capacity-checked booking function.
--
-- ADDITIVE and idempotent. Apply BEFORE deploying the phase-1 code (the new
-- POST /api/reservations calls gecko_create_reservation).

-- ---------------------------------------------------------------------------
-- 1. Visitor locale on reservations (de/sv reserved for phase 6)
-- ---------------------------------------------------------------------------

alter table public.gecko_reservations
  add column if not exists locale text not null default 'fr';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'gecko_reservations_locale_check'
      and conrelid = 'public.gecko_reservations'::regclass
  ) then
    alter table public.gecko_reservations
      add constraint gecko_reservations_locale_check
      check (locale in ('fr', 'en', 'de', 'sv'));
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Marketing consent ledger (PDPA B.E. 2562 / GDPR proof of consent)
-- ---------------------------------------------------------------------------

create table if not exists public.gecko_marketing_consents (
  id bigint generated always as identity primary key,
  email text not null,
  consent boolean not null,
  locale text not null,
  source text not null,
  consent_text_version text not null,
  consented_at timestamptz not null default now(),
  reservation_id integer references public.gecko_reservations(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gecko_marketing_consents_email
  on public.gecko_marketing_consents (lower(email));

alter table public.gecko_marketing_consents enable row level security;

-- Admin read only. No insert/update/delete policy: writes go through the
-- service role (gecko_create_reservation is security definer).
drop policy if exists "gecko admins read consents" on public.gecko_marketing_consents;
create policy "gecko admins read consents"
  on public.gecko_marketing_consents
  for select
  to authenticated
  using (public.gecko_is_admin());

-- ---------------------------------------------------------------------------
-- 3. Atomic booking with capacity check
-- ---------------------------------------------------------------------------
-- Serializes concurrent bookings of the same date with a transaction-level
-- advisory lock, sums covers of pending+confirmed reservations overlapping the
-- requested time (within table_block_duration_minutes) and refuses when
-- max_covers would be exceeded. The consent row is written in the same
-- transaction as the reservation.

create or replace function public.gecko_create_reservation(
  p_name text,
  p_email text,
  p_phone text,
  p_date date,
  p_time time,
  p_party int,
  p_occasion text,
  p_locale text,
  p_marketing_consent boolean,
  p_consent_version text
)
returns table (reservation_id integer, reservation_status text, is_full boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_max integer;
  v_block integer;
  v_used integer;
  v_id integer;
begin
  perform pg_advisory_xact_lock(hashtext('gecko_resa_' || p_date::text));

  select case when s.value ~ '^\s*\d+\s*$' then trim(s.value)::integer else 40 end
    into v_max
    from public.gecko_restaurant_settings s
    where s.key = 'max_covers';
  v_max := coalesce(v_max, 40);

  select case when s.value ~ '^\s*\d+\s*$' then trim(s.value)::integer else 120 end
    into v_block
    from public.gecko_restaurant_settings s
    where s.key = 'table_block_duration_minutes';
  v_block := coalesce(v_block, 120);

  select coalesce(sum(r.party_size), 0)
    into v_used
    from public.gecko_reservations r
    where r.reservation_date = p_date
      and r.status in ('pending', 'confirmed')
      and abs(extract(epoch from (r.reservation_time - p_time)) / 60) < v_block;

  if v_used + p_party > v_max then
    return query select null::integer, null::text, true;
    return;
  end if;

  insert into public.gecko_reservations (
    customer_name, customer_email, customer_phone,
    reservation_date, reservation_time, party_size,
    occasion, status, locale
  ) values (
    p_name, lower(p_email), p_phone,
    p_date, p_time, p_party,
    nullif(trim(p_occasion), ''), 'pending', p_locale
  )
  returning id into v_id;

  if p_marketing_consent then
    insert into public.gecko_marketing_consents (
      email, consent, locale, source, consent_text_version, reservation_id
    ) values (
      lower(p_email), true, p_locale, 'reservation_form', p_consent_version, v_id
    );
  end if;

  return query select v_id, 'pending'::text, false;
end;
$$;

revoke all on function public.gecko_create_reservation(text, text, text, date, time, int, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.gecko_create_reservation(text, text, text, date, time, int, text, text, boolean, text) to service_role;
