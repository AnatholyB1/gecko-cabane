# Roadmap: Gecko Cabane — SEO, conversion et réputation

## Overview

Objectif : faire de geckocabanerestaurant.com la première source de réservations des touristes européens de Krabi. Les 24 exigences [P1] doivent être en ligne avant le **1er novembre 2026** (aujourd'hui : 16 octobre) ; elles sont donc regroupées dans les phases 1 à 4. Les phases 5 à 8 (conversion, contenu, newsletter, KPI) suivent la haute saison de démarrage.

Granularité : standard. Mode : MVP vertical (chaque phase livre une capacité utilisable de bout en bout).

## Phases

- [ ] **Phase 1: Réservation sûre et sans friction** - Fermer la fuite PII, limiter les abus, rendre le SMS facultatif, email obligatoire, bouton WhatsApp
- [ ] **Phase 2: Fondations SEO techniques** - Canonical, schema complet, EN 100 % anglais, hreflang, sitemap, Search Console et Bing
- [ ] **Phase 3: Carte HTML et pages d'atterrissage clés** - `/menu` indexable avec vins et bières belges, accueil enrichi, page « french restaurant krabi »
- [ ] **Phase 4: Tunnel d'avis et fiche Google** - `/review`, statut honorée/no-show, email J+1, QR code, fiche Google Business Profile à jour
- [ ] **Phase 5: Conversion et mesure** - Preuve sociale, histoire du couple, accès, LINE, paiement, performance mobile, suivi des clics d'avis
- [ ] **Phase 6: Plan de pages SEO, allemand/suédois et présence externe** - Pages restantes FR/EN, /de relu, /sv, posts Google, TripAdvisor, NAP, blogs, hôtels
- [ ] **Phase 7: Newsletter** - Brevo, double opt-in, formulaires, séquences et segments
- [ ] **Phase 8: Reporting KPI hebdomadaire** - Workflow n8n, synthèse Claude, rapport email + WhatsApp, tableau de bord, alertes

## Phase Details

### Phase 1: Réservation sûre et sans friction

**Goal**: Un touriste étranger réserve en moins de 60 secondes, et le flux de réservation n'expose plus de données personnelles ni n'est exploitable par des abus
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, RESA-01, RESA-02, RESA-03, RESA-04
**Success Criteria** (what must be TRUE):

  1. Un visiteur anonyme qui appelle `GET /api/reservations?phone=…` ne reçoit aucune donnée de réservation
  2. Un touriste avec un numéro étranger remplit le formulaire, saisit son email et reçoit la confirmation par email en moins de 60 secondes, sans code SMS obligatoire
  3. Le formulaire exige l'email et propose une case « Recevoir nos actualités et offres » non pré-cochée, dont le consentement est enregistré avec date et source
  4. Des appels répétés aux endpoints SMS et réservation depuis une même IP ou un même numéro/email sont refusés après le seuil ; un utilisateur connecté non-admin Gecko reçoit un refus sur les routes admin
  5. Un bouton WhatsApp flottant ouvre la conversation depuis toutes les pages publiques ; les migrations du dépôt s'appliquent sur une base vierge et reproduisent le schéma `gecko_*`

**Plans**: 11 plans

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — requireAdmin() guard on all admin API routes + vitest alias (SEC-03)
- [x] 01-02-PLAN.md — Floating WhatsApp button + localized /privacy page (RESA-04, D-13)
- [x] 01-03-PLAN.md — Read-only prod dump -> idempotent 007 baseline, legacy migrations archived (SEC-04) [checkpoint]
- [x] 01-04-PLAN.md — TDD: Krabi-time slot rules, international phone, zod schema, zod declared (D-04/05/06, SEC-06)
- [x] 01-05-PLAN.md — Bilingual fr/en escaped transactional emails

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-06-PLAN.md — Booking API without SMS: migration 008 (capacity RPC, consents, locale), admin-only GET/PUT/DELETE, server-only webhooks (RESA-01/02, SEC-01/05)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-07-PLAN.md — OTP-free form (email required, consent, honeypot, 429 WhatsApp) + SMS backend/twilio removed
- [x] 01-08-PLAN.md — Rate limits (migration 009) + honeypot/min fill time on POST (SEC-02)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-09-PLAN.md — [BLOCKING] Scratch-DB proof + push 008/009 to production [checkpoint]

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-10-PLAN.md — Owner approvals, Vercel env, deploy, smoke tests, human <60 s check [checkpoint]

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 01-11-PLAN.md — Post-launch: drop gecko_phone_verifications (010), retire Twilio [checkpoint]

**UI hint**: yes

### Phase 2: Fondations SEO techniques

**Goal**: Google et Bing indexent correctement le site dans ses versions FR et EN, sur le bon domaine, avec un schema complet
**Mode:** mvp
**Depends on**: Nothing (indépendante de la phase 1, exécutable en parallèle)
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07
**Success Criteria** (what must be TRUE):

  1. Chaque page expose un canonical auto-référent sur `https://geckocabanerestaurant.com/{locale}/…` et `gecko-cabane.com` redirige en 301
  2. Le Rich Results Test valide le schema Restaurant (geo, hasMenu, acceptsReservations, sameAs, paymentAccepted, priceRange) sans erreur, sans `aggregateRating` non affiché
  3. `/en` est entièrement en anglais (title, meta, `og:locale` `en_US`, description du schema, titres de sections)
  4. Chaque page déclare hreflang fr, en et x-default (pas de `de` tant que `/de` n'est pas publié) ; `sitemap.xml` liste toutes les pages publiées et `robots.txt` le déclare
  5. Le domaine est vérifié dans Google Search Console et Bing Webmaster avec le sitemap soumis

**Plans**: TBD

### Phase 3: Carte HTML et pages d'atterrissage clés

**Goal**: Google peut lire la carte et les pages ciblant « french restaurant krabi » mènent à la réservation
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: MENU-01, MENU-02, PAGE-01, PAGE-02
**Success Criteria** (what must be TRUE):

  1. `/menu` affiche plats, prix en bahts, pictos végétarien / sans gluten / épicé et allergènes en texte HTML sélectionnable
  2. La carte comprend une section vins et bières belges
  3. L'accueil EN a le title « Gecko Cabane – French-Thai Restaurant in Krabi Town » et présente avis, histoire et accès
  4. `/en/french-restaurant-krabi` existe avec plats signatures, cave, couple franco-thaï et photos, et un lien vers la réservation

**Plans**: TBD
**UI hint**: yes

### Phase 4: Tunnel d'avis et fiche Google

**Goal**: Chaque client honoré est invité à laisser un avis Google ou TripAdvisor, et la fiche Google est optimisée pour la haute saison
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: REV-01, REV-02, REV-03, REV-04, OPS-01
**Success Criteria** (what must be TRUE):

  1. `/review`, `/avis` et `/bewertung` présentent deux boutons (Google d'abord, TripAdvisor ensuite) et ouvrent la fenêtre d'avis depuis un mobile
  2. L'admin marque une réservation « honorée » ou « no-show » ; sans annulation elle est « honorée » par défaut
  3. Une réservation honorée reçoit à J+1 11h (heure de Krabi) un email Resend dans sa langue avec lien `/review?rid=…&src=email`, et un seul rappel à J+5 si le lien n'a pas été cliqué
  4. Un QR code vers `/review?src=qr` avec textes FR/EN/DE est prêt à imprimer pour l'addition et le chevalet
  5. La fiche Google Business Profile est à jour (catégories, attributs, lien de réservation, carte, 20 photos), après accord du propriétaire

**Plans**: TBD
**UI hint**: yes

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

**Plans**: TBD
**UI hint**: yes

### Phase 6: Plan de pages SEO, allemand/suédois et présence externe

**Goal**: Le site couvre les requêtes secondaires en FR/EN/DE et la présence hors site (Google, TripAdvisor, blogs, hôtels) est cohérente
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, I18N-01, I18N-02, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07
**Success Criteria** (what must be TRUE):

  1. Les pages romantic-dinner, where-to-eat-krabi-town, getting-here-from-ao-nang et wine-belgian-beer existent avec title, meta, H1, lien de réservation, navigation et liens croisés
  2. Les pages d'accueil, french-restaurant, romantic-dinner, where-to-eat et `/menu` existent en FR avec un contenu écrit pour la langue
  3. `/de` couvre ces pages et les pages d'avis, publié seulement après relecture humaine, avec ajout de `de` aux hreflang et au sitemap à la publication ; `/sv` suit de la même façon
  4. TripAdvisor est à jour avec le lien du site vers `.com`, et nom, adresse, téléphone sont identiques sur toutes les plateformes
  5. Posts Google, modèles de réponse aux avis, liste de blogs et dossier concierge sont prêts, rien n'est envoyé sans accord du propriétaire

**Plans**: TBD
**UI hint**: yes

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

**Plans**: TBD
**UI hint**: yes

### Phase 8: Reporting KPI hebdomadaire

**Goal**: Le propriétaire reçoit chaque lundi un rapport fiable avec lecture et actions recommandées
**Mode:** mvp
**Depends on**: Phase 5, Phase 7
**Requirements**: KPI-02, KPI-03, KPI-04, KPI-05, KPI-06, KPI-07, KPI-08
**Success Criteria** (what must be TRUE):

  1. Chaque lundi 7h (Krabi), `weekly_kpis` reçoit réservations, no-show, Search Console, Google Business Profile, avis, rang TripAdvisor, clics `/review` et Brevo
  2. Le rapport arrive à 8h par email et en résumé WhatsApp, avec comparaison à S-1, seuils d'alerte, 3 phrases de lecture et 3 actions en français
  3. Un tableau de bord en ligne affiche l'historique des KPI
  4. Un avis ≤ 3 étoiles ou un retour privé de `/review` déclenche une alerte immédiate
  5. Le rapport a tourné 2 semaines en test avant d'être déclaré fiable

**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Réservation sûre et sans friction | 10/11 | In Progress|  |
| 2. Fondations SEO techniques | 0/TBD | Not started | - |
| 3. Carte HTML et pages clés | 0/TBD | Not started | - |
| 4. Tunnel d'avis et fiche Google | 0/TBD | Not started | - |
| 5. Conversion et mesure | 0/TBD | Not started | - |
| 6. Pages SEO, DE/SV, présence externe | 0/TBD | Not started | - |
| 7. Newsletter | 0/TBD | Not started | - |
| 8. Reporting KPI hebdomadaire | 0/TBD | Not started | - |
