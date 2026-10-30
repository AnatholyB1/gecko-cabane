---
phase: 08-reporting-kpi-hebdomadaire
plan: 04
subsystem: documentation / traçabilité
tags: [kpi, docs, runbook, traceability]
requires: []
provides:
  - Traçabilité KPI-02, KPI-05, KPI-08 alignée sur D-01, D-03, D-04, D-09
  - docs/kpi/KPI-SETUP.md (marche à suivre propriétaire)
  - Garde tests/kpi-docs.test.ts
affects: [REQUIREMENTS, ROADMAP, PROJECT, DEPLOY-CHECKLIST-v1.0]
key-files:
  created: [docs/kpi/KPI-SETUP.md, tests/kpi-docs.test.ts]
  modified: [.planning/REQUIREMENTS.md, .planning/ROADMAP.md, .planning/PROJECT.md, .planning/DEPLOY-CHECKLIST-v1.0.md]
decisions:
  - Variables listées dans KPI-SETUP.md et la checklist (pas de .env.example : .env* est ignoré)
metrics:
  tasks: 2
  completed: 2026-10-30
---

# Phase 8 Plan 04 : Traçabilité et marche à suivre propriétaire

KPI-02 devient un job cron dans l'application (`gecko_weekly_kpis`), KPI-05 est un email seul, Google Business Profile automatique est hors v1 (saisie manuelle), et le propriétaire dispose d'un runbook sans secret pour Search Console, Bright Data, Anthropic, le mode TEST et la migration 018.

## Commits
- 1bf43f1 : traçabilité REQUIREMENTS / ROADMAP / PROJECT + tests/kpi-docs.test.ts
- 5e08b78 : docs/kpi/KPI-SETUP.md + checklist (9 variables, migration 018)

## Notes du vérificateur intégrées dans KPI-SETUP.md
1. Rang TripAdvisor (A4) : le parseur peut ne pas être validé avant que la tentative hebdomadaire soit consommée ; contrôle sur échantillon réel de page, hors production, avant d'activer la collecte (section 4).
2. Saisie manuelle hebdomadaire : les champs doivent être confirmés par le propriétaire (section 10, question 4).

## Deviations from Plan
None - plan exécuté tel qu'écrit. La mention "n8n" n'apparaît dans aucun texte ajouté.

## Known Stubs
None.

## Problème hors périmètre
Après fusion de milestone/v1.0-phase8, `tests/newsletter-cron-route.test.ts` (« J+2 ... Idempotency-Key ») a échoué une fois dans la suite complète et passe isolément (6/6) : instabilité préexistante, non corrigée.

## Self-Check: PASSED
- docs/kpi/KPI-SETUP.md, tests/kpi-docs.test.ts présents ; commits 1bf43f1 et 5e08b78 présents.
