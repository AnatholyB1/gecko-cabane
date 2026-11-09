# Gecko Cabane — SEO, conversion et réputation

## What This Is

Site web du restaurant **Gecko Cabane** (cuisine Franco-Thaï, 40 couverts, Maharat Road, Krabi Town), tenu par la cheffe Jariya et son mari. Stack Next.js 16 / TypeScript / Tailwind v4 / Supabase / next-intl, déployé sur Vercel. Ce projet transforme le site d'une page unique en machine à réservations pour les touristes européens, et ajoute le tunnel d'avis, la newsletter et le reporting hebdomadaire qui l'entourent.

## Core Value

**geckocabanerestaurant.com doit devenir la première source de réservations des touristes européens de Krabi** : être trouvé (SEO FR/EN/DE) et réserver en moins de 60 secondes, même avec un numéro étranger.

## Requirements

### Validated

<!-- Capacités existantes, déduites du code (carte .planning/codebase/). -->

- ✓ Site vitrine bilingue FR/EN (next-intl, locale par défaut `fr`) — existing
- ✓ Réservation en ligne avec vérification SMS (Twilio Verify) et emails Resend — existing
- ✓ Interface d'administration (horaires, annonces, carte, réservations) protégée par Supabase Auth — existing
- ✓ Serveur MCP exposé (`/api/mcp`) pour les assistants IA — existing
- ✓ Suivi d'erreurs Sentry — existing
- ✓ Carte complète en base (4 pages, 27 catégories, 162 lignes) avec pictos Lucide végétarien/épicé — 2026-10-16
- ✓ Galerie avec 4 photos réelles de plats — 2026-10-16

### Validated (v1.0)

- ✓ Sécurité de la réservation : fuite PII fermée, limiteur de débit, rôle admin, migrations alignées sur `gecko_*`, SMS retiré, email obligatoire, WhatsApp — v1.0
- ✓ SEO technique : canonical, hreflang, JSON-LD Restaurant, sitemap, EN 100 % anglais, Search Console — v1.0
- ✓ Carte HTML `/menu` indexable (prix en bahts, pictos, vins et bières belges) — v1.0
- ✓ Tunnel d'avis : `/review` `/avis` `/bewertung`, honorée/no-show, email J+1 et relance J+5, QR code — v1.0
- ✓ Pages SEO FR/EN et allemand/suédois publiés après validation écrite du propriétaire — v1.0
- ✓ Newsletter sur Resend (double opt-in, journal de consentement, séquences et campagne codées, envois désactivés par défaut) — v1.0
- ✓ Rapport KPI hebdomadaire en production (cron, Search Console, TripAdvisor via Bright Data, avis Google via Places API, rédaction Claude, email TEST, tableau de bord) — v1.0

### Active (v1.1 : refonte de l'admin)

- [ ] **Audit d'utilité** de chaque page admin (garder, simplifier, fusionner, supprimer), validé avec le propriétaire avant implémentation : audit et liste d'impact faits (AUDIT-03) ; validation écrite page par page (AUDIT-01/02) et retours de la cheffe et des serveurs (AUDIT-04) en attente du propriétaire
- [x] **Suppression de la gestion de salle** (`/admin/tables`, `/api/tables/*`, affectation réservation ↔ table) ; la réservation reste, sans placement : vérifié par l'audit de fin de milestone (TAB-01 à TAB-06) ; tables SQL `gecko_table*` laissées en base, migration 020 (revoke seulement) écrite et non appliquée (ACC-01, accord du propriétaire requis)
- [x] **Système de design admin** sobre et dense (tokens, composants partagés), responsive téléphone / tablette / ordinateur : vérifié (DSN-01 à DSN-07, NAV-01 à NAV-05)
- [ ] **Refonte de chaque page admin conservée** avec états de chargement, vide et erreur, accessibilité : pages refaites et vérifiées (Aujourd'hui, Réservations, Site public, Carte, Réputation, Accès, « Complet ce soir ») ; restent l'UAT de preview (RSV-06), le retrait de la saisie Google (REP-03) et le passage clavier / lecteur d'écran (QA-02)

### Active (v1.2 : vitesse mobile, SEO on-page, sécurité)

- [ ] Vitesse mobile (SEO-08 repris) : rendu statique/ISR, polices, JS, images
- [ ] SEO on-page : H1, titres/descriptions, pages FR/DE/SV, JSON-LD Menu, og/Twitter
- [ ] En-têtes de sécurité et CSP ; accessibilité mobile

### Deferred (dette v1.0, hors périmètre de v1.2)

- [ ] **Histoire du couple** (CONV-02) : photo, année d'ouverture, histoire
- [ ] **KPI-08** : 2 semaines de rapports TEST puis `KPI_REPORT_MODE=live` (pas avant le 2026-11-16)
- [ ] **Actions hors code** (accord du propriétaire requis) : Google Business Profile (OPS-01), TripAdvisor et cohérence NAP (OPS-04, OPS-05), citations, partenariats hôtels
- [ ] **Newsletter** : lever les blocages 07-02, 07-10, 07-11 et activer les envois
- [ ] **Relecture native** des textes DE et SV

### Out of Scope

- Review gating (rediriger seulement les clients contents vers Google) — interdit par Google et TripAdvisor, risque de suppression des avis
- Contrepartie contre un avis (dessert, réduction) — interdit ; la recette offerte en N3 récompense l'inscription newsletter, pas l'avis
- Avis payés ou incités, faux avis — interdit ; `aggregateRating` seulement si de vrais avis sont affichés sur la page
- Traduction automatique brute des pages DE/SV — la spec exige une traduction relue
- Publication ou envoi à des tiers (blogs, hôtels, Google, TripAdvisor) sans validation explicite du propriétaire

## Current Milestone: v1.2 Vitesse mobile, SEO on-page et sécurité

**Goal:** Rendre le site rapide sur mobile (Lighthouse ≥ 90 sur /fr et /en, HTML en cache public), renforcer le SEO on-page (H1, titres, pages FR/DE/SV, JSON-LD Menu, og/Twitter) et ajouter les en-têtes de sécurité et l'accessibilité mobile, sans changer le design.

**Target features:**
- Vitesse : rendu statique/ISR de `app/[locale]` (cause du `private, no-store` à trouver), polices `next/font`, moins de JavaScript (server components, lazy sous la ligne de flottaison), cache long ou `lazyOnload` pour `/gcm/js/script.js`, width/height sur les images
- SEO : logo non-H1 + H1 descriptif par langue, title/description de l'accueil EN et de `/en/french-restaurant-krabi`, versions fr/de/sv de `getting-here-from-ao-nang` et `wine-belgian-beer-krabi` (slugs traduits, hreflang, sitemap), JSON-LD Menu depuis la carte, og:image + Twitter sur les pages internes, plus aucune mention de « couple franco-thaï »
- Sécurité : X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy, CSP compatible GTM/analytics et Google Maps
- Accessibilité : contrastes, zones cliquables ≥ 48 px, aria-label alignés sur le texte visible

**Critères d'acceptation :** build OK ; Lighthouse mobile ≥ 90 sur /fr et /en ; `x-vercel-cache: HIT` après le premier appel ; un seul H1 par page ; JSON-LD Restaurant et Menu valides (Rich Results Test) ; sitemap à jour avec hreflang réciproques.

**Contraintes du milestone :** ne pas modifier le design ni les textes hors de la liste ; textes DE/SV relus par un humain ; tout ce qui est publié ou envoyé à un tiers exige l'accord du propriétaire. Reprend SEO-08 (dette v1.0).

## Context

- **Constat SEO (relevé Bright Data du 16 oct. 2026)** : 4e en France sur « restaurant français krabi », absent en anglais sur « french restaurant krabi » (cible la plus facile). Sur les requêtes larges, Google montre TripAdvisor, Trip.com et blogs : on y gagne en étant cité.
- **Réputation** : Google 4,7 (1 065 avis) ; TripAdvisor 6e sur 434 à Krabi Town, objectif top 3 ; lien du site TripAdvisor pointe vers tripadvisor.be (à corriger).
- **Dette connue** (cartographie `.planning/codebase/`) : canonical et schema sur `gecko-cabane.com` (mauvais domaine), migrations ne correspondant pas au schéma réel, aucun test automatisé réel, config vitest sans alias `@/`.
- **Déjà en place** : Resend envoie depuis `reservations@geckocabanerestaurant.com` ; webhooks sortants n8n pour la réservation ; MCP exposé ; base Supabase partagée avec le portfolio (tables préfixées `gecko_`).
- **Cibles avril 2027** : 30 % des couverts du soir via le site ; top 3 sur « french restaurant krabi » (UK) ; 1er sur « restaurant français krabi » (FR) ; 1 200 avis Google à ≥ 4,7 ; TripAdvisor top 3 ; 1 500 contacts newsletter consentants, ouverture ≥ 40 %.

## Constraints

- **Timeline**: P1 (T1–T6, C1, R1, N1, A1–A4) en ligne avant le **1er novembre 2026** — la haute saison commence en novembre ; aujourd'hui = 16 octobre
- **Tech stack**: Next.js 16 App Router, Tailwind v4, Supabase, next-intl — pas de migration ; `createServerClient`/`createBrowserClient` selon le contexte, jamais la service-role côté client
- **i18n**: toute chaîne visible dans `src/app/[locale]/` via next-intl, clés dans `messages/fr.json` et `en.json` (et `de.json` ensuite) ; l'admin reste en français fixe
- **Conformité**: PDPA thaïlandais B.E. 2562 et RGPD — consentement explicite, double opt-in, lien de désinscription, consentement horodaté avec source
- **Emails**: Resend pour le transactionnel (confirmations, email J+1) ; Brevo pour la newsletter (segments FR/EN/DE/SV, pays, résident/touriste, dernière visite) ; 1 email/mois maximum hors séquences
- **Actions externes**: tout ce qui est publié ou envoyé à un tiers exige l'accord du propriétaire avant exécution
- **Qualité du contenu**: textes DE/SV relus par un humain ; aucune affirmation non vérifiable dans le schema (notes, avis)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Périmètre complet : code d'abord, puis actions hors code via intégrations/MCP/CLI/Chrome | Choix du propriétaire ; le code débloque le reste | — Pending |
| Sécurité en phase 1, couplée à R1/N1 | Ces specs modifient les mêmes routes (verify, reservations) ; un SMS facultatif exige un rate limit | — Pending |
| Resend (transactionnel) + Brevo (newsletter) | Resend déjà intégré ; Brevo apporte double opt-in, segments, séquences | — Pending |
| Allemand rédigé par Claude, relu par un humain | La spec exclut l'auto-traduction brute | — Pending |
| Domaine principal : geckocabanerestaurant.com (301 depuis gecko-cabane.com) | Spec T1 ; l'email Resend l'utilise déjà | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-09 after starting milestone v1.2*
