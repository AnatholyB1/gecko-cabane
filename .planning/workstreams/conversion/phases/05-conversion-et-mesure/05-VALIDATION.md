---
phase: 5
slug: conversion-et-mesure
status: planned
nyquist_compliant: true
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
| **Quick run command** | `node_modules/.bin/vitest run <fichiers>` (npx vitest échoue dans ce shell) |
| **Full suite command** | `npm run lint && npm run build` (build exécute vitest) |
| **Estimated runtime** | ~60 secondes |

## Sampling Rate

- **After every task commit:** `node_modules/.bin/vitest run <fichiers touchés>`
- **After every plan wave:** `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** suite complète verte
- **Max feedback latency:** 90 secondes

Chaque plan commence par une tâche RED (tests en échec) : c'est le « Wave 0 » de chaque tranche verticale (mode MVP).

## Per-Task Verification Map

| Plan | Task | Requirement | Decisions | Test file(s) | Automated command | Type |
|------|------|-------------|-----------|--------------|-------------------|------|
| 05-01 | 1 (RED) | KPI-01, RESA-06 | D-01..D-05 | tests/analytics.test.ts, tests/attribution.test.ts, tests/analytics-wiring.test.ts, tests/middleware-matcher.test.ts | `node_modules/.bin/vitest run tests/analytics.test.ts tests/attribution.test.ts tests/analytics-wiring.test.ts tests/middleware-matcher.test.ts` (must fail) | unit + source scan |
| 05-01 | 2 | KPI-01 | D-01, D-02 | idem | `node_modules/.bin/vitest run tests/analytics.test.ts tests/attribution.test.ts tests/middleware-matcher.test.ts` | unit |
| 05-01 | 3 | RESA-06 | D-03, D-05 | tests/analytics-wiring.test.ts, tests/reservation-form.test.ts | `node_modules/.bin/vitest run tests/analytics-wiring.test.ts tests/reservation-form.test.ts` | source scan |
| 05-02 | 1 (RED) | RESA-06 | D-04..D-06 | tests/reservation-source.test.ts, tests/migrations.test.ts, tests/reservations-post.test.ts, tests/reservations-admin.test.ts | same 4 files (must fail) | unit + handler |
| 05-02 | 2 | RESA-06 | D-04, D-05 | idem + tests/reservation-schema.test.ts | `node_modules/.bin/vitest run tests/reservation-source.test.ts tests/migrations.test.ts tests/reservations-post.test.ts tests/reservations-admin.test.ts tests/reservation-schema.test.ts` | unit + handler |
| 05-02 | 3 | RESA-06 | D-06 | tests/reservations-admin.test.ts + grep | `node_modules/.bin/vitest run tests/reservations-admin.test.ts tests/reservation-source.test.ts` | handler + grep |
| 05-03 | 1 (RED) | CONV-01, MENU-03 | D-11..D-15, D-21 | tests/social-proof.test.ts, tests/payment-note.test.ts, tests/seo-jsonld.test.ts, tests/seo-jsonld-wiring.test.ts, tests/home-page.test.ts | same 5 files (must fail) | unit + source scan |
| 05-03 | 2 | CONV-01 | D-12..D-14 | tests/seo-jsonld*.test.ts, tests/i18n*.test.ts | `node_modules/.bin/vitest run tests/seo-jsonld.test.ts tests/seo-jsonld-wiring.test.ts tests/i18n.test.ts tests/i18n-hardcoded.test.ts` | unit |
| 05-03 | 3 | CONV-01, MENU-03 | D-15, D-21 | + tests/social-proof.test.ts, tests/payment-note.test.ts, tests/home-page.test.ts, tests/menu-wiring.test.ts | see plan | source scan |
| 05-04 | 1 (RED) | RESA-05 | D-22 | tests/line.test.ts, tests/floating-contact.test.ts | `node_modules/.bin/vitest run tests/line.test.ts tests/floating-contact.test.ts` (must fail) | unit + source scan |
| 05-04 | 2 | RESA-05, RESA-06, KPI-01 | D-03, D-22 | + tests/whatsapp.test.ts, tests/i18n*.test.ts, tests/analytics-wiring.test.ts | see plan | unit + source scan |
| 05-05 | 1 (RED) | REV-06 | D-07, D-08 | tests/review-links.test.ts, tests/review-stats.test.ts, tests/review-page-wiring.test.ts, tests/review-click-wiring.test.ts, tests/migrations.test.ts | same 5 files (must fail) | unit + handler + source scan |
| 05-05 | 2 | REV-06 | D-07, D-08 | tests/review-links.test.ts, tests/review-stats.test.ts, tests/migrations.test.ts | `node_modules/.bin/vitest run tests/review-links.test.ts tests/review-stats.test.ts tests/migrations.test.ts` | unit + handler |
| 05-05 | 3 | REV-06 | D-07, D-08 | + tests/review-page-wiring.test.ts, tests/review-click-wiring.test.ts, tests/review-wiring.test.ts | see plan | source scan |
| 05-06 | 1 (RED) | RESA-06 | D-06 | tests/manual-reservation.test.ts, tests/admin-routes-guarded.test.ts | `node_modules/.bin/vitest run tests/manual-reservation.test.ts tests/admin-routes-guarded.test.ts` (must fail) | unit + handler |
| 05-06 | 2 | RESA-06 | D-04, D-06 | idem | `node_modules/.bin/vitest run tests/manual-reservation.test.ts tests/admin-routes-guarded.test.ts` | unit + handler |
| 05-06 | 3 | RESA-06 | D-06 | idem + tests/reservations-admin.test.ts + grep | see plan | grep |
| 05-07 | 1 (RED) | SEO-08 | discretion | tests/hero-image.test.ts (+ PSI baseline via curl) | `node_modules/.bin/vitest run tests/hero-image.test.ts` (must fail) | source scan + fs size |
| 05-07 | 2 | SEO-08 | discretion | tests/hero-image.test.ts, tests/home-page.test.ts, tests/landing-page.test.ts, tests/middleware-matcher.test.ts | see plan + `npm run build` | source scan + build |
| 05-07 | 3 (checkpoint) | SEO-08 | discretion | PSI API / Lighthouse on preview or local prod build | `node_modules/.bin/vitest run tests/hero-image.test.ts tests/home-page.test.ts` + measurement recorded; gate before wave 3 | manual gate |
| 05-08 | 1 (RED) | REV-07 | D-23 | tests/review-feedback.test.ts, tests/rate-limit.test.ts, tests/review-page-wiring.test.ts | same 3 files (must fail) | unit + handler + source scan |
| 05-08 | 2 | REV-07 | D-23 | + tests/reservations-post.test.ts, tests/resend-escape.test.ts | `node_modules/.bin/vitest run tests/review-feedback.test.ts tests/rate-limit.test.ts tests/reservations-post.test.ts tests/resend-escape.test.ts` | unit + handler |
| 05-08 | 3 | REV-07 | D-23 | tests/review-feedback.test.ts, tests/review-page-wiring.test.ts, tests/review-click-wiring.test.ts, tests/i18n*.test.ts | see plan | source scan |
| 05-09 | 1 (RED) | REV-05, REV-06 | D-09, D-10 | tests/review-report.test.ts, tests/review-whatsapp.test.ts, tests/admin-routes-guarded.test.ts | same 3 files (must fail) | unit + handler |
| 05-09 | 2 | REV-05, REV-06 | D-09, D-10 | idem | `node_modules/.bin/vitest run tests/review-report.test.ts tests/review-whatsapp.test.ts tests/admin-routes-guarded.test.ts` | unit + handler |
| 05-09 | 3 | REV-05, REV-06 | D-09, D-10 | idem + grep | see plan | grep |
| 05-10 | 1 (RED) | CONV-02, CONV-03 | D-16..D-20 | tests/about-section.test.ts, tests/map-embed.test.ts | `node_modules/.bin/vitest run tests/about-section.test.ts tests/map-embed.test.ts` (must fail) | source scan |
| 05-10 | 2 | CONV-02, CONV-03 | D-17..D-20 | tests/i18n*.test.ts, tests/seo-jsonld.test.ts, tests/home-page.test.ts | see plan | unit |
| 05-10 | 3 | CONV-02, CONV-03 | D-16, D-19, D-20 | tests/about-section.test.ts, tests/map-embed.test.ts, tests/home-page.test.ts, tests/hero-image.test.ts, tests/social-proof.test.ts | see plan + `npm run build` | source scan + build |
| 05-11 | 1 | REV-07, KPI-01 (privacy) | Pitfall 8 | tests/privacy-copy.test.ts | `node_modules/.bin/vitest run tests/privacy-copy.test.ts tests/i18n.test.ts tests/seo-pages.test.ts` | i18n |
| 05-11 | 2 | all (owner items) | D-02, D-11, D-14, D-17, D-18, D-22 | OWNER-CHECKLIST.md | node presence check (see plan) | doc check |
| 05-12 | 1 (checkpoint:human-action) | CONV-01 | D-11 | REVIEW-CANDIDATES.md consent line | `grep -c "Accord du propriétaire" .../REVIEW-CANDIDATES.md` | manual |
| 05-12 | 2 | CONV-01 | D-11, D-13 | REVIEW-CANDIDATES.md | node check: >= 8 sourced candidates or refusal line | doc check |
| 05-12 | 3 (checkpoint:decision) | CONV-01 | D-11 | REVIEW-CANDIDATES.md selection | node check: selection or deferral recorded | manual |
| 05-13 | 1 | CONV-01 | D-11, D-13, D-14 | tests/social-proof.test.ts (verbatim vs REVIEW-CANDIDATES.md, 3-4 reviews, aggregateRating present) | `node_modules/.bin/vitest run tests/social-proof.test.ts tests/seo-jsonld.test.ts tests/seo-jsonld-wiring.test.ts tests/home-page.test.ts` | unit |
| 05-13 | 2 (checkpoint) | SEO-08 + 5 ROADMAP criteria | all | checkpoint | full suite + lint + tsc, then human preview check (PSI, review cards, JSON-LD aggregateRating, functional steps) | manual |

## Wave 0 Requirements

- [ ] Every plan's Task 1 creates or updates its tests first and confirms they fail (RED), before implementation.
- [ ] Deliberately updated existing tests: `middleware-matcher`, `migrations`, `seo-jsonld`, `seo-jsonld-wiring`, `home-page`, `review-page-wiring`, `review-click-wiring`, `review-links`, `reservations-post`, `reservations-admin`, `admin-routes-guarded`, `rate-limit`.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PageSpeed mobile ≥ 85, LCP < 2,5 s | SEO-08 | Mesure Lighthouse sur déploiement | 05-07 tâche 3 (porte avant la vague 3) puis 05-13 tâche 2 : PSI mobile sur la preview, comparé à la référence 05-07 |
| Événements Plausible reçus | KPI-01 | Compte propriétaire requis | Tableau de bord temps réel Plausible (objectifs créés par le propriétaire) |
| Rendu LINE / carte au clic / avis réels | RESA-05, CONV-01, CONV-03 | Dépend de données du propriétaire (sélection d'avis 05-12) | Contrôle visuel mobile sur la preview (05-13) |
| Email « Un souci ? » reçu | REV-07 | Boîte du propriétaire | Message de test depuis /fr/review |
| Création manuelle d'une réservation | RESA-06 | Nécessite la migration 015 appliquée | /admin/reservations > « Ajouter une réservation » |

**Approval:** pending
