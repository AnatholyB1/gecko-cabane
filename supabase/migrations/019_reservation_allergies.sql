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

alter table public.gecko_reservations
  add column if not exists allergies text
    check (allergies is null or char_length(allergies) <= 500);
