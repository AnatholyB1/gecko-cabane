---
phase: 5
slug: conversion-et-mesure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-17
---

# Phase 5 — Validation Strategy

> Contrat de validation de la phase. Détail par exigence : section « Validation Architecture » de `05-RESEARCH.md`.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1 (env node) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run lint && npm run build` (build exécute vitest) |
| **Estimated runtime** | ~60 secondes |

## Sampling Rate

- **After every task commit:** `npx vitest run`
- **After every plan wave:** `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** suite complète verte
- **Max feedback latency:** 90 secondes

## Per-Task Verification Map

Rempli par le planificateur à partir de la table exigence → test de `05-RESEARCH.md` (SEO-08, MENU-03, RESA-05/06, CONV-01..03, REV-05..07, KPI-01).

## Wave 0 Requirements

- [ ] Nouveaux fichiers `tests/*.test.ts` listés dans `05-RESEARCH.md` (source de réservation, comptage review, feedback, social-proof, i18n parité)

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PageSpeed mobile ≥ 85, LCP < 2,5 s | SEO-08 | Mesure Lighthouse sur déploiement | Lancer PageSpeed Insights sur l'URL de preview |
| Événements Plausible reçus | KPI-01 | Compte propriétaire requis | Vérifier les goals dans le tableau de bord Plausible |
| Rendu LINE / carte au clic / avis réels | RESA-05, CONV-01, CONV-03 | Dépend de données du propriétaire | Contrôle visuel mobile |

**Approval:** pending
