# 01-DB-ROLLOUT - Evidence log (plan 01-09, Tasks 1-2)

Date: 2026-10-16
Status: PARTIAL. Task 1 resolved, Task 2 complete (all checks green). **Task 3 (production push) NOT executed.**
**prod approval: given (push 008+009, repair 001-006 reverted if present, 007 applied). Push BLOCKED at dry-run, see "Production push".**

Scratch database: Supabase preview branch `phase1-scratch`, project ref `ztsncmtzzoghgbsnwhhk` (parent prod ref `ubxllsvanurkwkohzxau`). Disposable; the branch will be deleted. Connection string lives only in the gitignored `.env.local` (`SCRATCH_DB_URL`). Nothing in this file contains credentials.

Note: an earlier command leaked the scratch credentials into the session transcript. Scope: scratch only, branch to be deleted. Rotate/delete the branch when done.

## Safety guard

Script aborts unless the SCRATCH_DB_URL host contains `ztsncmtzzoghgbsnwhhk`, refuses if it contains `ubxllsvanurkwkohzxau`, and refuses if it equals POSTGRES_URL_NON_POOLING. Result: `guard ok`. All production access in this task: none (the schema comparison used the existing read-only dump from plan 01-03 kept in the session scratchpad).

## Blank apply

The preview branch was NOT blank: it held 14 gecko_* tables replayed from the parent (26 rows in `supabase_migrations.schema_migrations`). Before the apply, the scratch `public` gecko objects were reset (disposable DB; auth/storage schemas and the migration-history table untouched):

- dropped all `public.gecko_*` tables (CASCADE), all `public.gecko_*` functions, and the storage.objects policies matching `gecko` (policies on tables went with the tables)
- observed after reset: `tables_left|0`, `funcs_left|0`, `storage_policies_left|0`
- Limitation: the bucket row `gecko-menu-images` could not be deleted (`Direct deletion from storage tables is not allowed`), 0 objects in it. 007 inserts it with `on conflict do nothing`, so this does not change the result, but the bucket-creation insert was effectively a no-op on this run.

Apply (`psql -v ON_ERROR_STOP=1 -q -f`), in order, pass 1:

| file | exit |
|------|------|
| 007_gecko_baseline.sql | 0 |
| 008_reservation_booking.sql | 0 |
| 009_rate_limits.sql | 0 |

No migration fixes were needed.

## Idempotency

Second full pass of 007, 008, 009 on the already-migrated scratch: all three exit 0, no error output (only NOTICE lines, filtered).

## Schema diff

Compared production dump (plan 01-03, `pg_dump --schema-only --no-owner --no-privileges -t 'public.gecko_*'`) with the same dump of scratch, after stripping `\restrict` tokens and SET lines.

- Only additions on scratch, all from 008/009: column `gecko_reservations.locale` (default 'fr') + `gecko_reservations_locale_check`; table `gecko_marketing_consents` (identity, pkey, FK to reservations ON DELETE SET NULL, index `idx_gecko_marketing_consents_email`, RLS, policy "gecko admins read consents"); table `gecko_rate_limits` (pkey (key, window_start), index `idx_gecko_rate_limits_window`, RLS).
- Cosmetic-only differences (2): `gecko_reservations_status_check` and `gecko_tables_shape_check` render as `ARRAY['..'::text,..]` on scratch versus `((ARRAY['..'::character varying,..])::text[])` on prod. Same allowed values; this is a deparse difference of the same predicate, not a semantic difference (columns/types are identical in the diff). Not treated as a baseline bug.
- `gecko_phone_verifications` is present in both (still in the baseline; its drop is plan 01-11).
- Functions: all 3 non-new gecko_* functions (`gecko_is_admin`, `gecko_update_reservation_timestamp`, `gecko_update_updated_at_column`) compared via `pg_get_functiondef` against the prod dump: **identical** (`FUNCS_IDENTICAL`).
- Policies: the 31-line prod policy listing vs scratch: identical except the new `gecko admins read consents` policy (and trailing whitespace of the psql formatting). Storage policies (view/upload/delete gecko menu images) identical.

## Rate limit atomicity

Seeded `gecko_restaurant_settings`: `max_covers=40`, `table_block_duration_minutes=120`.

```
begin; select gecko_rate_limit_hit('t',2,60) x3; rollback;
-> BEGIN t t f ROLLBACK
```
Result `t, t, f`: as expected.

## Capacity concurrency

6 parallel psql processes, each `select reservation_id, reservation_status, is_full from gecko_create_reservation('TestN','tN@example.com','+33612345678','2027-01-09','19:00',8,null,'fr',false,'v')`:

```
call1|2|pending|f
call2|1|pending|f
call3|3|pending|f
call4|4|pending|f
call5|5|pending|f
call6|||t
sum_party_size=40 rows=5
```
Exactly 5 is_full=false, exactly 1 is_full=true, sum = 40 <= max_covers 40: as expected.

## Consent

`gecko_create_reservation('Consent','c@Example.com',..., '2027-01-10','19:00',2,'birthday','en', true,'v')` returned `6|pending|f`. `gecko_marketing_consents` row observed: `c@example.com | consent=t | locale=en | source=reservation_form | consent_text_version=v | reservation_id set=t` (one row; email lower-cased).

## Privileges

As `set role anon`:

| statement | result |
|-----------|--------|
| select gecko_create_reservation(...) | ERROR: permission denied for function |
| select gecko_rate_limit_hit('t',2,60) | ERROR: permission denied for function |
| select count(*) from gecko_reservations | ERROR: permission denied for table |
| select count(*) from gecko_marketing_consents | ERROR: permission denied for table |
| select count(*) from gecko_rate_limits | ERROR: permission denied for table |

`has_function_privilege`: anon on create_reservation = f, anon on rate_limit_hit = f, service_role on rate_limit_hit = t. `relrowsecurity` = t for gecko_marketing_consents, gecko_rate_limits, gecko_reservations.

Caveat: anon got "permission denied" (not an empty set) on the tables on this scratch; prod default grants may differ, but RLS is enabled on all three and there is no anon policy, so anon sees 0 rows at worst. Re-verify with `has_function_privilege` on prod in Task 3.

## Other checks

`node_modules/.bin/vitest run tests/migrations.test.ts`: 1 file, 6 tests passed. (`npx vitest` fails in this shell with "Missing script"; the local binary was used.)

## Remaining (Task 3, not run)

Awaiting owner approval ("prod approved"). Planned steps unchanged: list migration history, repair 001-006 as reverted if present, repair 007 as applied, `db push --dry-run` must list exactly 008 and 009, then push and verify read-only. Plan 01-10 (code deploy) stays blocked until then.

## Production push (2026-10-16) - STOPPED at dry-run, nothing pushed

Target: prod project ref `ubxllsvanurkwkohzxau` (via POSTGRES_URL_NON_POOLING, pooler host, never printed).

### History before
`supabase migration list` showed local 007, 008, 009 with empty remote, plus **26 remote-only versions** (timestamp format, none of 001-006): 20260425125140, 20260521095243, 20260524220307, 20260920083556, 20260921010000, 20260921202340, 20260921202354, 20260921203728, 20260921211036, 20260921211109, 20260921214241, 20261002000000, 20261003000000, 20261003010000, 20261003020000, 20261004000000, 20261005000000, 20261006000000, 20261007000000, 20261007010000, 20261008000000, 20261009000000, 20261010000000, 20261011000000, 20261015174122, 20261015174138. These likely belong to the shared "portfolio" app and/or earlier dashboard-applied gecko changes.

### Actions taken (history table only)
- 001-006: not present remotely, no repair needed.
- `migration repair --status applied 007`: done (007 not executed).

### Dry-run
`supabase db push --dry-run` did NOT list 008/009. It failed with `LegacyDbPushMissingLocalError: Remote migration versions not found in local migrations directory`, suggesting `repair --status reverted` on the 26 versions above. Per the hard stop, no push was performed.

### Why stopped
Reverting those 26 versions would rewrite migration history belonging to another app in the shared project, which is outside the approval (only 001-006 / 007). No schema, data, env or deploy change was made. Production schema still lacks 008/009; plan 01-10 remains blocked.

### Options for the owner
1. Approve applying 008 and 009 by `psql -f` (each is idempotent, verified on scratch) plus `migration repair --status applied 008 009`, bypassing `db push`.
2. Approve reverting the 26 foreign versions (not recommended on a shared project).
3. Pull remote history into local placeholder files (`db pull`-style) so push is happy.

Prod verification (locale column, RLS, anon execute privilege): not run, nothing to verify yet.
