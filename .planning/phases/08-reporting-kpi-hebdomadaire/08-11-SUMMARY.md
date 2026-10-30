---
phase: 08-reporting-kpi-hebdomadaire
plan: 11
subsystem: reporting
tags: [kpi, search-console, tripadvisor, claude, cron]
requires: [08-02, 08-03, 08-06, 08-08]
provides:
  - src/utils/kpi-sources.ts (collectExternalKpis)
  - route weekly-kpi complete : collecte DB + GSC + TripAdvisor, S-1, alertes, lecture avant envoi
key-files:
  created: [src/utils/kpi-sources.ts, tests/kpi-sources.test.ts]
  modified: [src/app/api/cron/weekly-kpi/route.ts, tests/kpi-cron-route.test.ts]
requirements: [KPI-02, KPI-03, KPI-04, KPI-05]
metrics:
  tests: 13 (sources) + 8 (route) ajoutes
  completed: 2026-10-30
---

# Phase 8 Plan 11: Rapport KPI complet Summary

La collecte du lundi ajoute Search Console et rang TripAdvisor en parallele de la base (allSettled, statut par source) ; l'envoi calcule comparaison S-1, alertes et lecture (Claude ou repli riche) stockees dans `alerts` / `narrative` avant la claim.

## Realise
- `collectExternalKpis` : GSC ok/partial/unavailable ; Bright Data au plus une tentative par semaine (`tripadvisor_checked_at`, y compris en echec) ; `skipPaid` => aucun appel et aucune colonne tripadvisor_* ecrite.
- Route : `Promise.allSettled([collectDbKpis, collectExternalKpis])`, upsert unique fusionne ; budget interne 50 s (moins de 15 s restantes => repli sans IA) ; echec d'ecriture alerts/narrative => Sentry et envoi depuis la memoire.
- Points du verificateur : (1) ligne avec `report_sent_at` non nul => `skipped` avant toute redaction (0 appel Anthropic au second passage et en `?send=1`, lecture non ecrasee, tests dedies) ; (2) echec Claude => `fallbackNarrative(comparison, alerts)` (le repli generique de `generateNarrative` est ecarte) ; (3) `?dry=1` : jamais Bright Data ni Claude, GSC en lecture seule autorise, alerts/narrative renvoyees sans ecriture.

## Deviations
- Route modifiee avant l'ecriture des tests de route (pas de RED strict commite pour la tache 2) ; la tache 1 a bien un commit RED (2caa5f3) puis GREEN.
- Test existant « 01:05 envoi » adapte : la claim n'est plus `updates[0]` (l'update alerts/narrative la precede).
- `tripadvisor_checked_at` n'est pas consomme si Bright Data n'est pas configure (aucune requete partie).

## Non prouve
- Aucun appel reel GSC / Bright Data / Claude / Resend, aucune ecriture en base reelle (faux client, fetch mocke).
- Duree reelle de la route sous 60 s non mesuree. Gate complet (`npm test`, `npm run build`) reporte en 08-12.

## Known Stubs
Aucun.

## Self-Check: PASSED
