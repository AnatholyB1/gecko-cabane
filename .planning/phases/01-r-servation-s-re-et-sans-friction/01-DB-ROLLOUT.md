# 01-DB-ROLLOUT - Evidence log (plan 01-09, Tasks 1-2)

Date: 2026-10-16
Status: COMPLETE. Tasks 1-3 done (Task 3 via psql + migration repair, see "Production push").
prod approval: given; 008+009 applied to prod.

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

## Remaining (superseded, Task 3 later run)

Awaiting owner approval ("prod approved"). Planned steps unchanged: list migration history, repair 001-006 as reverted if present, repair 007 as applied, `db push --dry-run` must list exactly 008 and 009, then push and verify read-only. Plan 01-10 (code deploy) stays blocked until then.

## Production push (2026-10-16) - DONE via psql + migration repair

Target: prod project ref `ubxllsvanurkwkohzxau` (POSTGRES_URL_NON_POOLING from `.env.local`, quotes and `supa=` param stripped, never printed).

### Why not `db push`
`supabase migration list` showed 26 remote-only (foreign, shared project) versions; `db push --dry-run` failed with `LegacyDbPushMissingLocalError` and suggested reverting them. That would rewrite another app's history, outside the approval. 001-006 were not present remotely; 007 was repaired as applied earlier (not executed). Foreign versions: untouched.

### Alternative mechanism (owner-approved in session)
- Pre-checks: `git log 7959b55..HEAD` for 008/009 is empty (files identical to the scratch-tested ones). Grep for drop/delete/truncate: only `on delete set null` (FK), a comment, `drop policy if exists` on the new consents policy, and a cleanup `delete` inside `gecko_rate_limit_hit` on its own new table. Additive.
- `psql "$DB_URL" -v ON_ERROR_STOP=1 -1 -f supabase/migrations/008_reservation_booking.sql`: exit 0 (single transaction).
- Same for `009_rate_limits.sql`: exit 0.
- `supabase migration repair --db-url ... --status applied 008 009`: "Migration history repaired". History now has 007, 008, 009 + the 26 foreign versions (29 total).

### Read-only verification on prod
| check | result |
|-------|--------|
| `gecko_reservations.locale` | exists, default `'fr'::text` |
| relrowsecurity | true on gecko_marketing_consents, gecko_rate_limits, gecko_reservations |
| functions | gecko_create_reservation, gecko_rate_limit_hit exist |
| `has_function_privilege` execute | anon = false, authenticated = false, service_role = true (both functions) |
| rate-limit check in `begin; ... rollback;` (3 hits, limit 2) | true, true, false; 0 rows left after rollback |
| `select count(*) from gecko_reservations` | 8 (count only, no rows read, no writes) |

### Finding to follow up (not fixed here)
anon table grants (Supabase default privileges):
- gecko_marketing_consents: INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
- gecko_rate_limits: same full set
- gecko_reservations: TRUNCATE, REFERENCES, TRIGGER only

RLS is enabled with no anon policy, so anon reads/writes return nothing/are denied. However TRUNCATE is not subject to RLS; PostgREST does not expose TRUNCATE so this is not reachable through the API, but it is unnecessary privilege. Recommended follow-up migration: `revoke all on public.gecko_marketing_consents, public.gecko_rate_limits from anon, authenticated;` (the service-role/security-definer paths and the admin read policy via `gecko_is_admin` should be checked before revoking from `authenticated`, since the admin consents policy needs SELECT for authenticated). Nothing was changed on prod for this.

Plan 01-10 (code deploy) is unblocked from the database side.

## Post-launch approvals (2026-10-16)

- Owner delegated remaining decisions to Claude and approved its actions ("le reste, regle-le toi-meme", earlier "j'approuve tes actions"). Recorded as: drop of `gecko_phone_verifications` approved by delegation; removal of TWILIO_* env vars from Vercel and `.env.local` approved by delegation.
- Twilio account / Verify service: NOT retired by Claude (owner-only, billing). Owner TODO: delete/disable the Verify service and close or downgrade the Twilio account.

## Post-launch cleanup (plan 01-11)

Method: `psql -v ON_ERROR_STOP=1 -1 -f` against prod (`POSTGRES_URL_NON_POOLING` via shell var, never printed) then `supabase migration repair --status applied`. `db push` not used (26 foreign versions in the shared project, untouched; no dry-run was possible for the same reason). No scratch DB exists; both migrations are idempotent and touch only gecko_ objects.

| step | migration | result |
|------|-----------|--------|
| 011 `revoke insert, update, delete, select on gecko_marketing_consents from anon` | applied before deploy | exit 0, `REVOKE`; repaired; grants query: anon none, authenticated = DELETE, INSERT, SELECT, UPDATE (admin read policy kept) |
| deploy of commit dc5ad7a (webhooks removed, privacy email, lint fixes) | - | Vercel READY, smoke tests pass (below) |
| 012 `drop table if exists public.gecko_phone_verifications` | applied AFTER deploy and smoke tests | exit 0, `DROP TABLE`; repaired; `to_regclass` before = table, after = NULL |

Migration history on prod now includes 007-012 (plus the 26 foreign versions).

Env names removed (values never printed): Vercel production `RESA_HOOK_URL`, `RESA_VALIDATION_HOOK_URL`; Vercel preview+development `NEXT_PUBLIC_RESA_HOOK_URL`, `NEXT_PUBLIC_RESA_VALIDATION_HOOK_URL`; Vercel all environments `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`; `.env.local` the same names (0 `TWILIO_`/`RESA` lines left). Listing afterwards: 0 TWILIO/RESA names.

Production smoke tests (no reservation submitted):
- Before drop: GET `?phone` 401; POST `{}` 400 `too_fast`; `/api/verify/send` 404; bundle scan (/fr, /en HTML + 15 chunks) 0 matches for `NEXT_PUBLIC_RESA`/`RESA_`, 0 for twilio, 0 for n8n; `/en/privacy` and `/fr/privacy` contain geckocabanerestaurant@gmail.com (old address 0); `/fr` contains `wa.me/66819585945`.
- After drop and env removal: GET `?phone` 401; POST with empty fields 400 with a code (no 500). Note: the running deployment keeps its build-time env; the reservation path never touched the dropped table.
