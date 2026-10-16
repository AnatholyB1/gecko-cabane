---
phase: 01-r-servation-s-re-et-sans-friction
plan: 11
subsystem: infra
tags: [cleanup, webhooks, twilio, migrations, grants, lint]
requires: ["01-10"]
provides:
  - "n8n reservation webhooks removed (code, tests, env); SEC-05 satisfied by removal"
  - "Migration 011 (anon DML revoked on gecko_marketing_consents) applied on production"
  - "Migration 012 (drop gecko_phone_verifications) applied on production after verified deploy"
  - "TWILIO_* and RESA_* env names removed from Vercel and .env.local"
  - "Privacy contact email geckocabanerestaurant@gmail.com; npm run lint exits 0"
key-files:
  created:
    - supabase/migrations/011_revoke_anon_consents_dml.sql
    - supabase/migrations/012_drop_phone_verifications.sql
  modified:
    - src/app/api/reservations/route.ts
    - tests/no-public-secrets.test.ts
    - tests/migrations.test.ts
    - messages/fr.json
    - messages/en.json
    - "src/app/[locale]/privacy/page.tsx"
    - src/components/MenuDisplay.tsx
    - src/app/global-error.tsx
    - src/app/not-found.tsx
    - src/app/admin/reservations/page.tsx
key-decisions:
  - "Webhooks removed instead of rotated (owner: Resend only)"
  - "Migration numbered 012 (010 taken by grants, 011 by consents revoke)"
  - "Drop applied only after deploy + smoke tests (rollback unsafe afterwards)"
  - "Lint: behavior-preserving fixes; two targeted eslint-disable with justification"
requirements-completed: [SEC-04, RESA-01]
metrics:
  completed: 2026-10-16
---

# Phase 1 Plan 11: Post-launch cleanup Summary

Webhooks and the SMS mechanism are gone from code, schema and env; the site is deployed (Vercel READY on dc5ad7a), smoke-tested, and only then was `gecko_phone_verifications` dropped.

## What was done (in order)

1. **Webhook removal** (35561a9): deleted both fetch blocks (POST `new_reservation`, PUT confirmed/cancelled) in `src/app/api/reservations/route.ts`. Resend emails untouched. Tests now assert no `RESA_*HOOK`/webhook/n8n text under `src/`, no `NEXT_PUBLIC_RESA*`, and no `fetch(` in the reservations route. Codebase docs (CONCERNS, INTEGRATIONS) updated. Env removed: Vercel production `RESA_HOOK_URL`, `RESA_VALIDATION_HOOK_URL`; preview/development `NEXT_PUBLIC_RESA_*` leftovers; `.env.local` lines. **SEC-05 is satisfied by removal: no webhook URL exists anywhere.**
2. **Privacy email** (10a0e21): `contact@gecko-cabane.com` replaced by `geckocabanerestaurant@gmail.com` in `privacy/page.tsx`, `messages/fr.json` (2 places) and `messages/en.json` (2 places). The admin login placeholder `admin@gecko-cabane.com` is a form placeholder, not a contact address, and was left. `tests/i18n.test.ts` passes.
3. **Lint** (commit "fix 7 pre-existing lint errors"): apostrophes escaped (rendered text identical) in `not-found.tsx`, `global-error.tsx`, admin reservations; `MenuDisplay` effect moved below `fetchMenu` (same behavior). Two targeted `eslint-disable-next-line` with justification: `<a href="/fr">` in `global-error.tsx` (replaces the root layout, a full reload is intended and next/link needs router context) and `react-hooks/set-state-in-effect` for the mount-time async fetch in `MenuDisplay` (rewriting would change behavior). `npm run lint` exits 0 (7 warnings remain, no errors).
4. **Grants 011**: `revoke insert, update, delete, select on public.gecko_marketing_consents from anon`. Admin reads consents only through the authenticated session (policy "gecko admins read consents"), so authenticated SELECT is kept. Applied on prod via psql + `migration repair`; grants query: anon none, authenticated DELETE/INSERT/SELECT/UPDATE.
5. **Gates and deploy**: vitest 17 files / 152 tests pass, `npm run build` passes, lint 0. Pushed (6e7b504..dc5ad7a); Vercel READY. Smoke: GET `?phone` 401, POST `{}` 400 `too_fast`, `/api/verify/send` 404, bundle scan 0 matches (RESA, twilio, n8n), `/en/privacy` and `/fr/privacy` contain the new email, `/fr` contains `wa.me/66819585945`. No real reservation submitted.
6. **Migration 012 and Twilio env** (after the smoke tests): `drop table if exists public.gecko_phone_verifications` applied via psql + repair; `to_regclass` = NULL. `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` removed from Vercel (all environments) and `.env.local`. Post-drop smoke: GET `?phone` 401, POST with empty fields 400 with a code. 007 still creates the table (history); the migrations test covers 011/012 (single DROP, no cascade).

## Deviations from Plan

- Plan named the migration 010; it is 012 (owner instruction; 010/011 taken). `db push --dry-run` impossible (26 foreign versions in the shared prod project), so psql + `migration repair` used as in 01-09/01-10. No scratch DB, no dry-run listing; mitigated by idempotent, single-statement migrations.
- Task 2 (owner approval checkpoint) satisfied by the owner's delegation ("le reste, regle-le toi-meme", "j'approuve tes actions"), recorded in 01-DB-ROLLOUT.md "Post-launch approvals".
- Order changed deliberately: deploy + smoke before the irreversible drop (rollback unsafe afterwards).

## Not done / owner TODOs

- **Twilio**: Claude cannot delete the Verify service or close/downgrade the Twilio account (owner-only, billing). Owner must do it in the Twilio console.
- **n8n**: the old exposed webhook URLs (visible in earlier client bundles) are unused but still exist in n8n; only the owner can delete/disable them there.
- Owner phone check/WhatsApp: owner-reported OK, not verified by Claude (no measured time provided).
- Privacy text legal review (PDPA/GDPR) still advisable. Vercel log check covers only the CLI window; Sentry not inspected.
- `.planning/config.json` has a pre-existing local modification, never committed.

## Self-Check: PASSED

Commits 35561a9, 10a0e21, lint commit, migrations commit and dc5ad7a pushed; migration files exist; prod `to_regclass` NULL; `.env.local` has 0 TWILIO/RESA lines.
