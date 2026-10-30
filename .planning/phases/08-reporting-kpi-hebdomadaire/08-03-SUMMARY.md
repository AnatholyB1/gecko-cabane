---
phase: 08-reporting-kpi-hebdomadaire
plan: 03
subsystem: kpi
tags: [tripadvisor, brightdata, tdd]
requires: []
provides: [parseTripadvisorRank, fetchTripadvisorRank, isAllowedTripadvisorUrl, BRIGHTDATA_ENDPOINT]
affects: [08-11]
key-files:
  created:
    - src/utils/kpi-tripadvisor.ts
    - tests/kpi-tripadvisor.test.ts
    - tests/fixtures/tripadvisor-en.html
    - tests/fixtures/tripadvisor-fr.html
    - tests/fixtures/tripadvisor-norank.html
requirements: [KPI-02]
---

# Phase 8 Plan 03: Rang TripAdvisor via Bright Data Summary

Module autonome : parseur pur EN/FR du rang TripAdvisor et appel unique Bright Data Web Unlocker (POST, Bearer, sans retry, timeout 20 s), tout échec renvoyant null.

## Commits
- RED : 09228aa `test(08-03)` (fixtures + 16 tests)
- GREEN : `feat(08-03)` implémentation de `src/utils/kpi-tripadvisor.ts`

## Résultats
- `npx vitest run tests/kpi-tripadvisor.test.ts` : 16/16
- `npx tsc --noEmit` : 0 erreur ; `npm run lint` : 0 erreur (6 avertissements préexistants hors périmètre)
- Aucun appel réseau réel ; fetch injecté ; fixtures synthétiques (< 3 Ko).

## Risque ouvert
- **A4 non validée** : le format du rang (« #N of M » / « N° N sur M ») n'a pas été vérifié sur un échantillon TripAdvisor réel (pages réelles non récupérées). Le parseur a été écrit sur fixtures synthétiques ; si le HTML réel diffère (JSON embarqué, autre libellé, autres langues), la source restera « non disponible ». À valider hors prod avant de déclarer la source fiable.
- A3 (tarif ~1,5 USD/1000) et A7 (zone créée par le propriétaire) restent des hypothèses.
- Le plafond de coût dépend aussi du câblage 08-11 (réutilisation de la valeur déjà stockée pour la semaine).

## Deviations from Plan
- Décodage d'entités HTML limité (nbsp, deg, ordm, amp, #35, #176) : ajout mineur nécessaire pour la fixture FR (`N&deg;`). Sinon : plan exécuté à la lettre.

## Self-Check: PASSED
