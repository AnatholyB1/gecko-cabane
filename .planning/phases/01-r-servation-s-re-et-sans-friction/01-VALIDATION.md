---
phase: 1
slug: r-servation-s-re-et-sans-friction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract. Detailed requirement→test map: see `## Validation Architecture` in `01-RESEARCH.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.0 (node env) |
| **Config file** | `vitest.config.ts` (Wave 0: add `@` alias to `./src`) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run build` (runs `vitest run` then `next build`) + `npm run lint` |
| **Estimated runtime** | ~30 seconds (tests), ~2 min (build) |

---

## Sampling Rate

- **After every task commit:** `npx vitest run`
- **After every plan wave:** `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Plan-Task | Requirement / Decision | Automated command |
|-----------|------------------------|-------------------|
| 01-01-T1 | SEC-03 | npx vitest run tests/require-admin.test.ts |
| 01-01-T2 | SEC-03 | npx vitest run tests/admin-routes-guarded.test.ts |
| 01-02-T1 | RESA-04, D-15, D-16 | npx vitest run tests/whatsapp.test.ts tests/i18n.test.ts |
| 01-02-T2 | D-13 | npx vitest run tests/i18n.test.ts |
| 01-03-T2 | SEC-04 | npx vitest run tests/migrations.test.ts |
| 01-03-T3 | SEC-04 | npx tsc --noEmit -p . |
| 01-04-T1 | D-04 (Krabi time, hours, capacity grid) | npx vitest run tests/reservation-rules.test.ts |
| 01-04-T2 | D-05, D-06, SEC-06, RESA-03 | npx vitest run tests/api-validation.test.ts tests/reservation-schema.test.ts tests/deps.test.ts |
| 01-05-T1/T2 | RESA-01/03 emails, escapeHtml | npx vitest run tests/resend-escape.test.ts tests/resend-locale.test.ts |
| 01-06-T1..T3 | SEC-01, SEC-03, SEC-05, RESA-01, RESA-02 | npx vitest run tests/reservations-post.test.ts tests/reservations-admin.test.ts tests/no-public-secrets.test.ts |
| 01-07-T1 | RESA-01/02/03, D-09 client | npx vitest run tests/reservation-form.test.ts tests/i18n.test.ts |
| 01-07-T2 | D-02 | npx vitest run tests/deps.test.ts |
| 01-08-T1/T2 | SEC-02, D-07/08/09 | npx vitest run tests/rate-limit.test.ts tests/anti-bot.test.ts tests/reservations-post.test.ts |
| 01-09-T2/T3 | SEC-04, SEC-02 atomicity | manual SQL on scratch + prod, evidence in 01-DB-ROLLOUT.md |
| 01-10-T2/T3 | SEC-05, RESA-03, RESA-04 | production smoke (curl) + human check, evidence in 01-LAUNCH.md |
| 01-11-T1/T3 | D-02, SEC-04 | npx vitest run tests/migrations.test.ts + prod to_regclass |

Wave 0 note: handler tests are split into tests/reservations-post.test.ts and tests/reservations-admin.test.ts (instead of tests/reservations-api.test.ts); the @ alias is added in 01-01 Task 1.

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — add `@` alias so route-handler tests can import `@/…`
- [ ] `tests/reservations-api.test.ts` — stubs for SEC-01/02/03, RESA-01/02
- [ ] `tests/whatsapp.test.ts` — stub for RESA-04 link builder

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migrations apply on blank DB and reproduce `gecko_*` schema | SEC-04 | Needs scratch Postgres (no Docker) | Apply 007+ to a scratch DB, diff vs read-only `pg_dump` of prod |
| SQL atomicity of capacity/rate-limit functions | SEC-02, D-04 | Concurrency against real Postgres | Fire parallel inserts on scratch DB; total covers ≤ max_covers |
| Webhook env rename + URL rotation, Twilio cancellation | SEC-05 | External action, owner approval required | Owner updates Vercel env; verify no `NEXT_PUBLIC_RESA_*` in client bundle |
| Booking < 60 s with foreign number | RESA-03 | UX timing | Stopwatch on mobile, FR/UK number |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
