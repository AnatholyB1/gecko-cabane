-- 011_revoke_anon_consents_dml.sql
-- Phase 1 (follow-up of 010): anon never touches gecko_marketing_consents.
-- Rows are written only by gecko_create_reservation (service_role) and read by
-- the admin UI through the authenticated session (policy "gecko admins read
-- consents" needs SELECT for authenticated, which is KEPT).
--
-- Pure REVOKE, idempotent. Only a gecko_ table is touched (shared project).

revoke insert, update, delete, select on public.gecko_marketing_consents from anon;
