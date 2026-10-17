# Roadmap (workstream: newsletter): Gecko Cabane — SEO, conversion et réputation

## Overview

Workstream parallèle extrait du ROADMAP principal. Phases 1 à 4 terminées (voir `.planning/ROADMAP.md` à la racine). Cette workstream ne porte que la phase 7. Travail dans un worktree git dédié (branche `ws/newsletter`) ; l'audit design vient en fin de projet.

## Phases

- [ ] **Phase 7: Newsletter**

## Phase Details

### Phase 7: Newsletter

**Goal**: Le restaurant construit une liste de contacts consentants et leur envoie des séquences pertinentes
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: NEWS-01, NEWS-02, NEWS-03, NEWS-04, NEWS-05, NEWS-06, NEWS-07
**Success Criteria** (what must be TRUE):

  1. Un visiteur s'inscrit via le formulaire de pied de page ou le pop-up de sortie (une fois, pas plein écran sur mobile), confirme par double opt-in et reçoit le Guide gourmand
  2. Chaque contact a un consentement horodaté avec source et un lien de désinscription fonctionnel
  3. Le QR de l'addition et le portail WiFi mènent à des inscriptions distinctes du lien d'avis
  4. Les séquences bienvenue, J+1, J+3, retour octobre et saison verte partent, avec 1 email/mois maximum hors séquences
  5. Les contacts sont segmentés par langue, pays, résident/touriste et dernière visite

**Plans**: 11 plans

Plans:
- [x] 07-01-PLAN.md — Subscribe API: migration 015, signed links, ledger state, confirmation email (W1)
- [ ] 07-02-PLAN.md — Guide gourmand + crab curry PDFs, bill insert and WiFi card from owner content (W1, checkpoint)
- [x] 07-03-PLAN.md — Footer sign-up form + full newsletter/wifi i18n contract (W2)
- [x] 07-04-PLAN.md — Confirm page/route -> Brevo upsert with segments -> welcome email with guide (W3)
- [x] 07-05-PLAN.md — /newsletter (bill QR) and /wifi pages, short-URL aliases, pdf matcher fix (W3)
- [x] 07-06-PLAN.md — Exit-intent pop-up / mobile bottom sheet + anonymous signup counters (W3)
- [x] 07-07-PLAN.md — FR/EN sequence drafts, Brevo runbook, privacy update, owner review (W3, checkpoint)
- [x] 07-08-PLAN.md — Unsubscribe page/route (one-click) + Brevo webhook to the ledger (W4)
- [x] 07-09-PLAN.md — Daily newsletter-sync cron (visit date, country, resident) + D-03 legacy job (W4)
- [ ] 07-10-PLAN.md — Launch: approvals, migration 015 push, Brevo setup, env, deploy, probes (W5, checkpoint)
- [ ] 07-11-PLAN.md — Brevo automations activation, device checks, round trip, D-03 mailing (W6, checkpoint)
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Newsletter | 8/11 | In Progress|  |
