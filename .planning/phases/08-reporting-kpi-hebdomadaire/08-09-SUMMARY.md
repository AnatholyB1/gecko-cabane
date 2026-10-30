---
phase: 08-reporting-kpi-hebdomadaire
plan: 09
subsystem: reporting
tags: [kpi, admin, manual-entry, alerts]
requires: [08-05, 08-06, 08-07]
provides:
  - manualKpiSchema, shouldAlertLowRating, lowRatingAlertEmail (src/utils/kpi-manual.ts)
  - PUT /api/kpi (requireAdmin, select puis update/insert, alerte immédiate)
  - Formulaire « Saisie manuelle de la semaine » sur /admin/kpi
key-files:
  created:
    - src/utils/kpi-manual.ts
    - tests/kpi-manual.test.ts
    - tests/kpi-alerts-immediate.test.ts
  modified:
    - src/app/api/kpi/route.ts
    - src/app/admin/kpi/page.tsx
decisions:
  - "Le retour privé « Un souci ? » n'est pas touché ni dupliqué ; verrouillé par un test (1 seul email, sujet « Un souci ? ») et par une vérification statique (la route KPI ne le référence pas)."
  - "Pas d'upsert (grants 018) ; lien admin de l'email construit avec SITE_URL."
metrics:
  tasks: 2
  completed: 2026-10-30
---

# Phase 8 Plan 09: Saisie manuelle des avis et alerte immédiate Summary

Saisie hebdomadaire des avis Google validée par zod (lundi, note 1-5, bornes, note libre <= 500), stockée par select puis update/insert sous RLS, avec email d'alerte immédiat (Resend, idempotencyKey `kpi-lowrating-{semaine}-{note}`) pour une note <= 3 nouvelle ou modifiée.

## Deviations from Plan

None - plan executed as written. Un test supplémentaire vérifie qu'un échec d'envoi ne met pas la note libre dans Sentry.

## Non prouvé

- Aucun envoi réel Resend, aucune écriture en base réelle (client factice, Resend mocké) ; table 018 non appliquée.
- Le formulaire n'a pas de test de rendu ni de vérification navigateur (relecture de code, tsc, lint).
- L'idempotence réelle de Resend n'est pas testée, seule la clé transmise l'est.

## Known Stubs

Aucun.

## Self-Check: PASSED
