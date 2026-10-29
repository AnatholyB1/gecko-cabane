-- 015_reservation_source.sql
-- Phase 5 (RESA-06, D-04, D-05, D-06).
-- Apply to production BEFORE deploying code that reads source/utm_* (owner checklist, 05-11).
-- Existing rows take 'site': before phase 5 every row came from the public form.
-- gecko_create_reservation is untouched: public bookings get the column default, which
-- makes the source unforgeable from the public POST.
-- No new policy: "Admin manage gecko_reservations" (007) covers the new columns.

alter table public.gecko_reservations
  add column if not exists source text not null default 'site'
    check (source in ('site', 'whatsapp', 'telephone', 'sans_reservation')),
  add column if not exists utm_source text
    check (utm_source is null or char_length(utm_source) <= 100),
  add column if not exists utm_medium text
    check (utm_medium is null or char_length(utm_medium) <= 100),
  add column if not exists ref text
    check (ref is null or char_length(ref) <= 100);

-- Needed by the admin manual reservation route (05-06), which inserts under RLS as the
-- authenticated admin; idempotent.
grant usage, select on sequence public.gecko_reservations_id_seq to authenticated;
