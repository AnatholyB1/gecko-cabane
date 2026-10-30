---
phase: 08-reporting-kpi-hebdomadaire
plan: 06
subsystem: reporting
tags: [kpi, alerts, claude, narrative, fallback]
requires: [08-01]
provides:
  - src/utils/kpi-alerts.ts (ALERT_THRESHOLDS, compareWeeks, detectAlerts)
  - src/utils/kpi-narrative.ts (liste blanche, prompt, parseNarrative, fallbackNarrative, generateNarrative)
affects: [08-09, 08-11]
key-files:
  created:
    - src/utils/kpi-alerts.ts
    - src/utils/kpi-narrative.ts
    - tests/kpi-alerts.test.ts
    - tests/kpi-narrative.test.ts
decisions:
  - "Le repli de generateNarrative est reconstruit depuis l'entree agregee (signature du plan) ; les messages d'alerte y sont generiques"
  - "Seuils isoles dans ALERT_THRESHOLDS, marques [ASSUMED] A2"
metrics:
  tasks: 2
  tests: 30
  completed: 2026-10-30
---

# Phase 8 Plan 06: Comparaison S-1, alertes et lecture IA Summary

Comparaison S-1 (null jamais traite comme 0), 8 regles d'alerte a seuils nommes, et lecture/actions 3+3 redigees par Claude via fetch injectable, avec validation zod et repli deterministe. Entree IA en liste blanche d'agregats, sans donnee personnelle.

## Deviations from Plan

- Les commits RED (tests) precedent les commits GREEN, mais les fichiers de test et d'implementation ont ete ecrits dans la meme passe : l'echec RED n'a pas ete observe en execution.
- Le test d'alertes utilise le type exporte `AlertThresholds` (ajout au contrat) pour accepter des seuils personnalises sous tsc.
- Quand `generateNarrative` retombe sur le repli, les alertes sont reconstruites depuis l'entree (code/metric/valeurs) : leur message est generique, moins riche que celui de `fallbackNarrative(comparison, alerts)` appele directement.

## Non prouve

- Aucun appel reel a l'API Claude : format de reponse (`content[0].text`) et en-tetes valides uniquement par mock (hypothese A5).
- Seuils d'alerte non valides par le proprietaire (A2).
- Pas de console.log / pas de test d'absence de fuite de la cle dans les logs au-dela de l'absence de logs dans le code.

## Known Stubs

Aucun.

## Self-Check: PASSED
