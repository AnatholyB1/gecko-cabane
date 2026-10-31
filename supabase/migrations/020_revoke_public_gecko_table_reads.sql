-- 020_revoke_public_gecko_table_reads.sql
-- Phase 17 (ACC-01), v1.1: remove the PUBLIC (anon) read access to the four gecko_table* tables.
--
-- WHY: since phase 10 the floor-plan feature is gone and nothing in this repository reads these
-- tables (booking and availability never touch a table object; the MCP route uses the
-- service-role client on gecko_reservations only). The baseline (007) still exposes them with
-- `for select using (true)` policies: gecko_table_assignments links reservations to blocked time
-- slots, which is data nobody needs to read anonymously.
--
-- REVOKE-ONLY: this file never drops a table, never deletes or updates a row, never alters a
-- column. It removes four public SELECT policies and the anon SELECT privilege. Admin access is
-- untouched: the "Admin manage ..." policies (gecko_is_admin()) stay, and service_role bypasses RLS.
--
-- DO NOT APPLY without the owner's written agreement AND the check in 17b-ACC01-NOTES.md
-- (the Supabase project is SHARED with another application: confirm it does not read these tables).
--
-- Idempotent: dropping a missing policy and revoking a privilege that is not held are no-ops.
-- Only gecko_* objects are touched.
--
-- ROLLBACK (run manually if the other application turns out to need these reads):
--   create policy "Public read gecko_tables" on public.gecko_tables for select using (true);
--   create policy "Public read gecko_table_configurations" on public.gecko_table_configurations for select using (true);
--   create policy "Public read gecko_table_configuration_tables" on public.gecko_table_configuration_tables for select using (true);
--   create policy "Public read gecko_table_assignments" on public.gecko_table_assignments for select using (true);
--   grant select on public.gecko_tables, public.gecko_table_configurations,
--     public.gecko_table_configuration_tables, public.gecko_table_assignments to anon;

drop policy if exists "Public read gecko_tables" on public.gecko_tables;
drop policy if exists "Public read gecko_table_configurations" on public.gecko_table_configurations;
drop policy if exists "Public read gecko_table_configuration_tables" on public.gecko_table_configuration_tables;
drop policy if exists "Public read gecko_table_assignments" on public.gecko_table_assignments;

revoke select on
  public.gecko_tables,
  public.gecko_table_configurations,
  public.gecko_table_configuration_tables,
  public.gecko_table_assignments
from anon;
