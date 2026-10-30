---
phase: 8
slug: reporting-kpi-hebdomadaire
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-30
---

# Phase 8 — Validation Strategy

Source de vérité : section « Validation Architecture » de `08-RESEARCH.md` (carte exigence → test, fichiers `tests/kpi-*.test.ts`).

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0, env node |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/kpi-*.test.ts` (commande simple, `rtk npx vitest` est cassé) |
| Full suite command | `npm test` |
| Gate de phase | `npm test` + `npx tsc --noEmit` + `npm run lint` + `npm run build` |

## Sampling Rate

- Après chaque commit de tâche : quick run
- Après chaque vague : suites ciblées + tsc + lint ; gate complet (npm test, tsc, lint, build) en 08-12
- Avant verify-work : gate complet vert

## Per-Task Verification Map

Les tâches « RED » créent leurs tests en premier (Wave 0 intégrée à chaque plan, TDD) : statut attendu ÉCHEC puis VERT à la tâche suivante.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 08-01-T1 | 01 | 1 | KPI-02 | static SQL | `npx vitest run tests/kpi-migration.test.ts tests/migrations.test.ts` | ⬜ |
| 08-01-T2 | 01 | 1 | KPI-02, KPI-06 | unit | `npx vitest run tests/kpi-format.test.ts` | ⬜ |
| 08-02-T1 | 02 | 1 | KPI-02 | unit (RED) | `npx vitest run tests/kpi-gsc.test.ts` | ⬜ |
| 08-02-T2 | 02 | 1 | KPI-02 | unit (JWT RS256 vérifié) | `npx vitest run tests/kpi-gsc.test.ts` | ⬜ |
| 08-03-T1 | 03 | 1 | KPI-02 | unit + fixtures (RED) | `npx vitest run tests/kpi-tripadvisor.test.ts` | ⬜ |
| 08-03-T2 | 03 | 1 | KPI-02 | unit | `npx vitest run tests/kpi-tripadvisor.test.ts` | ⬜ |
| 08-04-T1 | 04 | 1 | KPI-02, KPI-05 | static docs | `npx vitest run tests/kpi-docs.test.ts` | ⬜ |
| 08-04-T2 | 04 | 1 | KPI-02, KPI-05 | static docs (noms de variables, pas de secret) | `npx vitest run tests/kpi-docs.test.ts` | ⬜ |
| 08-05-T1 | 05 | 2 | KPI-02 | unit (semaine, lundi ≥ 8h, collecte) | `npx vitest run tests/kpi-week.test.ts tests/kpi-collect.test.ts` | ⬜ |
| 08-05-T2 | 05 | 2 | KPI-02 | route + static vercel.json | `npx vitest run tests/kpi-cron-route.test.ts tests/review-wiring.test.ts tests/newsletter-cron.test.ts tests/no-public-secrets.test.ts` | ⬜ |
| 08-06-T1 | 06 | 2 | KPI-03 | unit | `npx vitest run tests/kpi-alerts.test.ts` | ⬜ |
| 08-06-T2 | 06 | 2 | KPI-04 | unit (liste blanche, repli) | `npx vitest run tests/kpi-narrative.test.ts tests/kpi-alerts.test.ts` | ⬜ |
| 08-07-T1 | 07 | 2 | KPI-06 | route + static guard | `npx vitest run tests/kpi-api.test.ts tests/admin-routes-guarded.test.ts` | ⬜ |
| 08-07-T2 | 07 | 2 | KPI-06 | static wiring | `npx vitest run tests/kpi-admin-wiring.test.ts tests/i18n-hardcoded.test.ts tests/no-public-secrets.test.ts` | ⬜ |
| 08-08-T1 | 08 | 3 | KPI-05, KPI-08 | unit | `npx vitest run tests/kpi-mode.test.ts tests/kpi-report-email.test.ts` | ⬜ |
| 08-08-T2 | 08 | 3 | KPI-05, KPI-08 | route (claim, idempotence, release, autre jour ⇒ pas d'envoi, send=1) | `npx vitest run tests/kpi-cron-route.test.ts tests/kpi-mode.test.ts tests/kpi-report-email.test.ts` | ⬜ |
| 08-09-T1 | 09 | 3 | KPI-07 | unit | `npx vitest run tests/kpi-manual.test.ts` | ⬜ |
| 08-09-T2 | 09 | 3 | KPI-07 | route + non-régression feedback | `npx vitest run tests/kpi-alerts-immediate.test.ts tests/kpi-manual.test.ts tests/kpi-api.test.ts tests/admin-routes-guarded.test.ts tests/review-feedback.test.ts tests/kpi-admin-wiring.test.ts` | ⬜ |
| 08-10-T1 | 10 | 3 | KPI-03 | checkpoint:decision (seuils) | `grep -n "export const ALERT_THRESHOLDS" src/utils/kpi-alerts.ts` | ⬜ |
| 08-10-T2 | 10 | 3 | KPI-03 | unit + cohérence doc | `npx vitest run tests/kpi-alerts.test.ts tests/kpi-docs.test.ts` | ⬜ |
| 08-11-T1 | 11 | 4 | KPI-02 | unit (dry ⇒ 0 appel Bright Data) | `npx vitest run tests/kpi-sources.test.ts` | ⬜ |
| 08-11-T2 | 11 | 4 | KPI-02..KPI-05 | route (fetch mocké), suites ciblées | `npx vitest run tests/kpi-cron-route.test.ts tests/kpi-sources.test.ts tests/kpi-alerts.test.ts tests/kpi-narrative.test.ts tests/kpi-report-email.test.ts tests/kpi-gsc.test.ts tests/kpi-tripadvisor.test.ts tests/no-public-secrets.test.ts` | ⬜ |
| 08-12-T1 | 12 | 5 | KPI-02 | gate complet + checkpoint [BLOCKING] | `npm test && npx tsc --noEmit && npm run lint && npm run build` | ⬜ |
| 08-12-T2 | 12 | 5 | KPI-02 | psql (après accord) + journal sans secret | `test -f .planning/phases/08-reporting-kpi-hebdomadaire/08-ACTIVATION.md` | ⬜ |
| 08-12-T3 | 12 | 5 | KPI-05, KPI-06 | checkpoint:human-verify (prod, repli 1 cron) | `grep -n "dry=1" .planning/phases/08-reporting-kpi-hebdomadaire/08-ACTIVATION.md` | ⬜ |
| 08-13-T1 | 13 | 6 | KPI-08 | checkpoint:human-verify (≥ 2026-11-16) | `test -f .planning/phases/08-reporting-kpi-hebdomadaire/08-KPI08-LOG.md` | ⬜ |
| 08-13-T2 | 13 | 6 | KPI-08 | checkpoint:decision (live) | `grep -n "Décision" .planning/phases/08-reporting-kpi-hebdomadaire/08-KPI08-LOG.md` | ⬜ |
| 08-13-T3 | 13 | 6 | KPI-08 | docs | `grep -n "KPI-08" .planning/REQUIREMENTS.md` | ⬜ |

## Wave 0 Requirements

- [ ] `tests/kpi-*.test.ts` créés par les tâches RED de chaque plan (01, 02-T1, 03-T1, 05, 06, 07, 08, 09, 11-T1)
- [ ] Fixtures TripAdvisor synthétiques `tests/fixtures/tripadvisor-{en,fr,norank}.html` (08-03)
- [ ] Faux client Supabase chaînable dans `tests/kpi-cron-route.test.ts` (patron `tests/newsletter-cron-route.test.ts`)
- [ ] Aucune installation de framework ni de paquet npm

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Application de 018 en production | KPI-02 | Écriture prod, accord explicite requis | 08-12 Task 1-2 (psql + migration repair, vérification des privilèges) |
| Appels réels GSC / Bright Data / Claude / Resend | KPI-02, KPI-04, KPI-05 | Secrets du propriétaire, aucune écriture prod en test | 08-12 Task 3 : `?dry=1` après saisie des accès |
| Seuils d'alerte | KPI-03 | Spec introuvable, décision propriétaire | 08-10 Task 1 |
| 2 semaines de rapports TEST | KPI-08 | Délai réel, pas avant mi-novembre 2026 | 08-13 : lire les 2 rapports, décider du passage `KPI_REPORT_MODE=live` |

## Validation Sign-Off

- [x] Toutes les tâches ont un test automatisé ou une dépendance Wave 0
- [x] `nyquist_compliant: true` une fois la carte remplie
