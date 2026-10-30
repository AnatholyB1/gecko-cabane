---
phase: 08-reporting-kpi-hebdomadaire
plan: 07
subsystem: reporting
tags: [kpi, admin, dashboard, api]
requires: [08-01]
provides:
  - GET /api/kpi?weeks=N (requireAdmin, cookie client sous RLS)
  - Page /admin/kpi (français fixe) et cartes d'accueil admin
key-files:
  created:
    - src/app/api/kpi/route.ts
    - src/app/admin/kpi/page.tsx
    - tests/kpi-api.test.ts
    - tests/kpi-admin-wiring.test.ts
  modified:
    - src/app/admin/page.tsx
    - tests/admin-routes-guarded.test.ts
decisions:
  - "weeks: non numérique => 12, borné 1..52 (0 => 1, conformément au plan)"
  - "Compteur TEST = lignes report_mode 'test' avec report_sent_at non nul"
metrics:
  tasks: 2
  completed: 2026-10-30
---

# Phase 8 Plan 07: Tableau de bord KPI admin Summary

Route GET /api/kpi gardée (401/403, 500 générique + Sentry, aucune service role) et page /admin/kpi : historique 12 semaines, « non disponible » pour les valeurs absentes, colonne « Sources non disponibles », badge « partiel », comparaison à S-1, alertes, lecture/actions, compteur « Rapports TEST envoyés : N / 2 ».

## Deviations from Plan

None - plan executed as written. Un test de rendu SSR (état de chargement) a été ajouté à tests/kpi-admin-wiring.test.ts, et un test vérifiant l'absence de lien public vers /admin/kpi.

## Non prouvé

- Pas de vérification dans un navigateur ni contre une vraie base (aucun accès admin, table 018 non appliquée) : seuls le rendu initial (chargement) et la route avec client factice sont testés.
- Rendu des états avec données (comparaison, alertes, narratif) non couvert par un test de rendu : relecture de code uniquement.
- Aucun `next dev` lancé (port 3109 non utilisé).

## Known Stubs

Aucun.

## Self-Check: PASSED
