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

Filled by the planner: each task's `<automated>` command maps to the requirement tests listed in `01-RESEARCH.md` §Validation Architecture (SEC-01 anonymous GET returns 401; SEC-02 429 after threshold; SEC-03 non-admin 403; RESA-01/02/03 POST without token, email required; RESA-04 WhatsApp link builder).

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
