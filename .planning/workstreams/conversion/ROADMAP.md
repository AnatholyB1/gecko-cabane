# Roadmap (workstream: conversion): Gecko Cabane — SEO, conversion et réputation

## Overview

Workstream parallèle extrait du ROADMAP principal. Phases 1 à 4 terminées (voir `.planning/ROADMAP.md` à la racine). Cette workstream ne porte que la phase 5. Travail dans un worktree git dédié (branche `ws/conversion`) ; l'audit design vient en fin de projet.

## Phases

- [ ] **Phase 5: Conversion et mesure**

## Phase Details

### Phase 5: Conversion et mesure

**Goal**: Le site rassure, convertit mieux sur mobile, et mesure d'où viennent réservations et avis
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: SEO-08, MENU-03, RESA-05, RESA-06, CONV-01, CONV-02, CONV-03, REV-05, REV-06, REV-07, KPI-01
**Success Criteria** (what must be TRUE):

  1. Le bloc de preuve sociale (note Google 4,7, Travellers' Choice, avis réels avec prénom et pays, lien « Laisser un avis ») s'affiche au-dessus de la réservation
  2. Les sections « Qui sommes-nous » et « Comment venir » (carte intégrée, bouton d'itinéraire) sont visibles
  3. La page mobile atteint PageSpeed ≥ 85 avec LCP < 2,5 s en 4G
  4. Les modes de paiement et frais carte sont visibles sur la carte et la réservation ; un bouton LINE est présent
  5. Les réservations portent un champ source, les événements « réservation envoyée » et « clic WhatsApp » sont mesurés, les clics `/review` sont comptés par source, et « Un souci ? » envoie un email au propriétaire

**Plans**: 11 plans (5 waves)

Plans:
- [ ] 05-01-PLAN.md — Plausible proxy (inert sans ID), événement « Reservation Sent », capture UTM/ref (wave 1)
- [ ] 05-02-PLAN.md — Migration 015 source/UTM, POST non falsifiable, sélecteur de source admin (wave 1)
- [ ] 05-03-PLAN.md — Preuve sociale avant #reservation, aggregateRating (D-14), ligne paiement /menu + réservation (wave 1)
- [ ] 05-04-PLAN.md — Bouton LINE empilé sur WhatsApp, clics WhatsApp/LINE mesurés (wave 2)
- [ ] 05-05-PLAN.md — Migration 016, comptage des visites /review et clics sortants par source (wave 2)
- [ ] 05-06-PLAN.md — Ajout manuel de réservations admin (WhatsApp, téléphone, sans réservation) (wave 2)
- [ ] 05-07-PLAN.md — Hero et images en next/image AVIF/WebP, référence PageSpeed (wave 2)
- [ ] 05-08-PLAN.md — « Un souci ? » sur /review : POST protégé + email Resend au propriétaire (wave 3)
- [ ] 05-09-PLAN.md — Page admin « Avis » : tableau mensuel, totaux manuels, modèle WhatsApp (wave 3)
- [ ] 05-10-PLAN.md — #about enrichi (propriétaire, photo du couple) et « Comment venir » avec carte au clic (wave 4)
- [ ] 05-11-PLAN.md — Confidentialité, OWNER-CHECKLIST, vérification preview PageSpeed et critères (wave 5, checkpoint)
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Conversion et mesure | 0/11 | Not started | - |
