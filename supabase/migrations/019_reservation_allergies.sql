-- 019_reservation_allergies.sql
-- Phase 15 (v1.1, RSV-01..05): owner decision 2026-10-31, a dedicated allergies column.
-- ADDITIVE and NOT YET APPLIED: the owner applies it. Order of deployment:
--   1. apply this migration to production,
--   2. then deploy the code that reads/writes `allergies`.
-- Until it is applied the admin UI simply shows no allergy (a missing key is undefined) and the
-- manual form omits `allergies` from the POST when the field is left empty, so existing
-- payloads and inserts are unchanged. Filling the field BEFORE applying the migration would make
-- the insert fail (unknown column): apply first.
-- Nullable, no default, no backfill: existing rows keep NULL. Never inferred from notes.
-- gecko_create_reservation (public booking), the public form and RLS are untouched; the
-- "Admin manage gecko_reservations" policy (007) already covers a new column.

-- ROLLBACK (note only, NOT executed by the Supabase CLI; run by hand and only with the owner's accord):
--   alter table public.gecko_reservations drop column if exists allergies;
-- Destructive: every allergy typed since the migration is lost for good. Before running it, export
-- them (select id, allergies from public.gecko_reservations where allergies is not null).
-- Deploy order when rolling back: first redeploy the code that no longer reads/writes `allergies`,
-- then drop the column (the reverse of the apply order above).

alter table public.gecko_reservations
  add column if not exists allergies text
    check (allergies is null or char_length(allergies) <= 500);
