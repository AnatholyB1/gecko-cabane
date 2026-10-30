---
phase: 08-reporting-kpi-hebdomadaire
plan: 01
subsystem: reporting
tags: [kpi, migration, rls, types, formatting]
requires: []
provides:
  - supabase/migrations/018_weekly_kpis.sql (fichier, NON appliquée)
  - Contrats de types KPI (WeeklyKpiRow, KpiAlert, KpiNarrative, KPI_COLLECTOR_COLUMNS, KPI_MANUAL_COLUMNS)
  - src/utils/kpi-format.ts (KPI_METRICS, formatKpiValue, formatDelta, UNAVAILABLE_LABEL)
affects: [08-05, 08-06, 08-07]
key-files:
  created:
    - supabase/migrations/018_weekly_kpis.sql
    - src/utils/kpi-format.ts
    - tests/kpi-migration.test.ts
    - tests/kpi-format.test.ts
  modified:
    - src/types/database.ts
decisions:
  - "Grants par colonne: authenticated n'insère/ne met à jour que les colonnes de saisie manuelle; le cron écrit en service role"
  - "Valeur absente = 'non disponible', 0 reste 0 (D-03)"
metrics:
  tasks: 2
  completed: 2026-10-30
---

# Phase 8 Plan 01: Contrats KPI Summary

Migration 018 `gecko_weekly_kpis` (RLS gecko_is_admin + revoke all + grants insert/update par colonne manuelle, fichier seulement), contrats de types KPI et formatage français des métriques (null affiché « non disponible », jamais 0).

## Deviations from Plan

- Le test `tests/kpi-format.test.ts` a été écrit avant l'implémentation mais commité avec elle (un seul commit pour Task 2, pas de commit RED séparé). Le RED de Task 1 a bien son commit `test(08-01)` séparé.
- `KPI_*_COLUMNS` utilisent `as const satisfies` pour garantir à la compilation que chaque colonne existe dans `WeeklyKpiRow`.

## Non prouvé

- La migration 018 n'a pas été exécutée sur PostgreSQL : seules des vérifications statiques (texte SQL) existent. Sa validité syntaxique et les privilèges effectifs seront contrôlés à l'application (08-12).
- Pas de test de cohérence automatique colonnes SQL <-> WeeklyKpiRow (revue manuelle).

## Known Stubs

Aucun.

## Self-Check: PASSED
