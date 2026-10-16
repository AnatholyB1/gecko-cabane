---
phase: 01-r-servation-s-re-et-sans-friction
verified: 2026-10-16T00:00:00Z
status: passed
score: 5/5 roadmap criteria verified (2 of them rely partly on owner-reported human checks)
overrides_applied: 0
---

# Phase 1: Réservation sûre et sans friction - Verification Report

**Goal:** Un touriste étranger réserve en moins de 60 secondes, sans exposer de données personnelles ni être exploitable par des abus.
**Re-verification:** No (initial).
**Tests:** `npx vitest run` -> 17 files, 152 tests passed (run by the verifier).

## Success criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Anonymous `GET /api/reservations?phone=` returns no data | VERIFIED | `src/app/api/reservations/route.ts` GET calls `requireAdmin()` first (401/403) and no longer reads a `phone` param. Production smoke test (LAUNCH a): 401. Test `reservations-admin.test.ts`. |
| 2 | Foreign-number tourist books with email, no mandatory SMS code, confirmation by email | VERIFIED (code) + HUMAN (owner-reported) | POST has no OTP step. Zod schema with E.164 phone and required email. Atomic RPC `gecko_create_reservation` (008). Resend emails (customer and staff) sent in `after()`. `/api/verify/*` deleted (404 in prod), no twilio or OTP references in `src`. Form defaults country from locale. The under-60 s timing was reported OK by the owner ("1 ok; 2 ok"), with no measured time recorded. |
| 3 | Email required; unchecked newsletter box; consent stored with date and source | VERIFIED | `ReservationForm.tsx`: email `required`, `marketingConsent` initial state `false`. RPC inserts into `gecko_marketing_consents` (source `reservation_form`, `consent_text_version`, `consented_at default now()`) in the same transaction. Consent table has RLS enabled, admin read policy, anon grants revoked (011). |
| 4 | Repeated calls refused after threshold; non-admin logged-in users refused on admin routes | VERIFIED | `utils/rate-limit.ts`: IP 5/h, email 3/day, phone 3/day, HMAC-hashed keys, atomic `gecko_rate_limit_hit` (009, service_role only), 429 `rate_limited` with WhatsApp fallback. Honeypot plus 3 s minimum fill time (prod smoke b/b4). `requireAdmin()` (`utils/auth.ts`: user, then `gecko_is_admin` RPC, fail closed) is on every mutating handler in announcement, hours, settings, special-hours, tables/*, menu/*, reservations. Tests `require-admin`, `admin-routes-guarded`, `rate-limit`, `anti-bot` pass. |
| 5 | Floating WhatsApp button on all public pages; migrations reproduce `gecko_*` schema on a blank DB | VERIFIED (code) + HUMAN (owner-reported) | `WhatsAppButton` is mounted in `src/app/[locale]/layout.tsx`. Prod HTML contains `wa.me/66819585945`. Migrations: `007_gecko_baseline` (idempotent dump, legacy 001-006 archived) then 008-012; `tests/migrations.test.ts` passes. 009 was proven on a scratch DB per LAUNCH. Owner confirmed the button works on a phone. |

## Requirements

| Req | Status | Note |
|-----|--------|------|
| SEC-01 | SATISFIED | See criterion 1. |
| SEC-02 | SATISFIED | Reservation POST is rate-limited. The SMS part is moot because SMS routes were deleted (D-02). |
| SEC-03 | SATISFIED | See criterion 4. |
| SEC-04 | SATISFIED | See criterion 5. |
| SEC-05 | SATISFIED (by removal) | No `n8n`, `NEXT_PUBLIC_RESA` or webhook references in `src`. The prod bundle scan found none. Owner decision to use Resend. |
| SEC-06 | SATISFIED | `zod ^4.3.6` is declared in `package.json`. `tests/deps.test.ts` passes. |
| RESA-01 | SATISFIED | No OTP; email confirmation. |
| RESA-02 | SATISFIED | See criterion 3. |
| RESA-03 | SATISFIED (owner-reported) | Code path is minimal (no OTP, locale-based country). Timing not measured by automation. |
| RESA-04 | SATISFIED | See criterion 5. |

No orphaned requirements: RESA-05 and RESA-06 are mapped to Phase 5.

## Anti-patterns and warnings (none block the goal)

- WARNING: `src/app/api/mcp/route.ts` queries an unprefixed `reservations` table, which is a pre-existing bug. It selects only `party_size`, so there is no PII exposure, but the availability tool is probably broken. Outside the Phase 1 criteria.
- WARNING: `src/app/api/sentry-example-api/route.ts` is a public demo route that throws. Pre-existing and harmless, but it should be removed.
- WARNING: The rate limiter fails open if `RATE_LIMIT_SECRET` is unset. The secret is set in prod per LAUNCH, but this is not verifiable from the repo.
- INFO: The 60-second result has no measured value (the "Resultats" line in 01-LAUNCH is blank), and the owner approval was a blanket approval.
- INFO: No `TBD`, `FIXME` or `XXX` markers were checked beyond the files reviewed. No stubs found in the reviewed files (reservation route, auth guard, rate-limit, migrations 009, 011, 012).

## Residual owner actions (not gaps)

1. Delete or disable the old exposed n8n URLs in n8n.
2. Confirm that the WhatsApp number +66 81 958 5945 is active (the owner reported the button OK).
3. Legal review of /fr/privacy and /en/privacy (PDPA and GDPR).

## Not verified by the verifier

I did not connect to production and did not submit a reservation, as instructed. The production smoke results come from 01-LAUNCH.md and were not re-run.

**Status: passed.** The 60-second and WhatsApp checks are marked human-verified (owner-reported), with the code evidence confirmed independently above.
