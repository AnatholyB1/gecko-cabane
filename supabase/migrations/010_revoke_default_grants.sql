-- 010_revoke_default_grants.sql
-- Phase 1 (follow-up of plan 01-09): remove unnecessary Supabase default table
-- privileges from anon/authenticated on the booking PII tables.
--
-- Pure REVOKE, idempotent (revoking a privilege that is not held is a no-op).
-- SELECT/INSERT/UPDATE/DELETE on gecko_reservations and gecko_marketing_consents
-- are intentionally KEPT for authenticated: the admin UI reads/updates
-- reservations through the authenticated session under RLS (gecko_is_admin()),
-- and the admin consents policy needs SELECT. Only gecko_* objects are touched
-- (the Supabase project is shared with another app).

revoke truncate, references, trigger
  on public.gecko_reservations, public.gecko_marketing_consents
  from anon, authenticated;

-- Service role only (RLS enabled, no policy): no client role needs any privilege.
revoke all on public.gecko_rate_limits from anon, authenticated;
