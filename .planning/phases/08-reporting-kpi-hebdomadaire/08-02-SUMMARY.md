---
phase: 08-reporting-kpi-hebdomadaire
plan: 02
subsystem: reporting
tags: [search-console, jwt, rs256, kpi]
requires: []
provides:
  - "src/utils/kpi-gsc.ts: parseServiceAccount, signServiceAccountJwt, aggregateGscRows, fetchGscWeek, GSC_SCOPE"
affects: [08-11]
tech-stack:
  added: []
  patterns: ["fetch injectable", "echec silencieux => null"]
key-files:
  created: [src/utils/kpi-gsc.ts, tests/kpi-gsc.test.ts]
  modified: []
requirements-completed: [KPI-02]
completed: 2026-10-30
---

# Phase 8 Plan 02: Source Search Console Summary

Module Search Console autonome (JWT RS256 via node:crypto, fetch injectable, aucune dependance) renvoyant clics, impressions, CTR, position ponderee et couverture de la semaine, ou null en cas d'echec.

## Commits
- 06b9aeb test(08-02): tests RED (15 tests)
- feat(08-02): implementation GREEN

## Verification
- `npx vitest run tests/kpi-gsc.test.ts`: 15/15
- `npx tsc --noEmit`: propre; `npm run lint`: 0 erreur (6 avertissements preexistants hors perimetre)
- Aucun `console.`, aucune lib Google, package.json inchange, aucun « n8n »

## Deviations from Plan
None - plan executed as written.

## Non prouve
- Aucun appel reel a Google : format de reponse reel, autorisations du compte de service (hypothese A6) et champ `metadata.first_incomplete_date` non verifies en conditions reelles.
- Cablage dans la route cron : traite par 08-11.

## Self-Check: PASSED
