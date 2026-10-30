---
phase: 08-reporting-kpi-hebdomadaire
plan: 05
subsystem: reporting
tags: [kpi, cron, supabase, krabi-week]
requires: [08-01]
provides:
  - src/utils/kpi-week.ts (previousWeek, parseWeekParam, weekUtcBounds, weekEndOf, shouldSendNow)
  - src/utils/kpi-collect.ts (collectDbKpis, aggregateReservations, aggregateNewsletterEvents, snapshotReviewClicks, computeReviewClickDelta)
  - GET /api/cron/weekly-kpi (collecte + upsert idempotent, ?dry=1, ?week=)
  - vercel.json: deux entrees lundi 00:00 et 01:00 UTC
affects: [08-08, 08-09, 08-11]
key-files:
  created:
    - src/utils/kpi-week.ts
    - src/utils/kpi-collect.ts
    - src/app/api/cron/weekly-kpi/route.ts
    - tests/kpi-week.test.ts
    - tests/kpi-collect.test.ts
    - tests/kpi-cron-route.test.ts
  modified:
    - vercel.json
decisions:
  - "Source en echec => valeurs null + statut unavailable; semaine sans reservation => vrais zeros"
  - "Delta clics /review: snapshot du mois stocke dans la ligne; delta null (statut partial) tant qu'aucun snapshot precedent n'existe"
  - "Upsert limite aux colonnes collecteur; colonnes de saisie manuelle jamais ecrasees"
metrics:
  tasks: 2
  tests: 67 passes (6 suites ciblees)
  completed: 2026-10-30
---

# Phase 8 Plan 05: Cron KPI hebdomadaire (collecte DB) Summary

Le cron `/api/cron/weekly-kpi` (garde Bearer CRON_SECRET fail-closed) collecte reservations, couverts, no-show, reservations par source, clics /review (delta hebdo depuis un snapshot mensuel) et evenements newsletter pour la semaine Krabi ecoulee, puis fait un upsert sur `week_start` dans `gecko_weekly_kpis`.

## Deviations from Plan

- La branche demandee est `phase/08-05` (consigne de l'orchestrateur), pas un espace de noms `worktree-agent-*`.
- `id` est selectionne dans `gecko_reservations` (non-PII) pour dedoublonner les deux lectures (created_at / reservation_date).
- `collectDbKpis` accepte un 4e parametre optionnel `now` (defaut `new Date()`) pour le mois Krabi du snapshot; testable.
- Une erreur de lecture de la ligne S-1 est non fatale (Sentry, deltas inconnus).

## Non prouve

- Aucune execution contre une vraie base : la table `gecko_weekly_kpis` (migration 018) n'est pas appliquee ; les tests utilisent un faux client. Les requetes PostgREST reelles (`.in('month', ...)`, pagination, `maybeSingle`) ne sont pas verifiees en conditions reelles.
- Double declenchement 00:00/01:00 UTC : idempotent par upsert, mais le comportement reel de Vercel Cron n'est pas teste.
- Le delta clics /review est une approximation (compteurs mensuels, bots/prefetch inclus).

## Known Stubs

Aucun. Les colonnes GSC/TripAdvisor/alertes/narratif ne sont pas ecrites ici (08-08, 08-11).

## Self-Check: PASSED
