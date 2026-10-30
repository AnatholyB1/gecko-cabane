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

### Active

<!-- Specs détaillées dans "Specs site Gecko Cabane – SEO et conversion.md" (IDs T/C/R/L/N/A). -->

- [ ] **Sécurité et fiabilité (phase 1)** : fermer la fuite PII `GET /api/reservations?phone=`, ajouter des rate limits (SMS/OTP, réservations), contrôle de rôle admin sur les routes API admin, réaligner les migrations sur le schéma réel `gecko_*`, retirer le préfixe `NEXT_PUBLIC_` des webhooks, déclarer `zod`
- [ ] **SEO technique P1** : canonical par page (T1), GPS et URLs du schema (T2), schema Restaurant complet (T3), version EN 100 % anglaise (T4), hreflang fr/en/de (T5), sitemap + robots + Search Console/Bing (T6)
- [ ] **Carte HTML** (C1) : page `/menu` lisible par Google, prix en bahts, pictos, section vins et bières belges
- [ ] **Réservation sans friction** (R1) : SMS facultatif, email obligatoire (N1), bouton WhatsApp flottant et LINE
- [ ] **Tunnel d'avis P1** (A1–A4) : pages `/review` `/avis` `/bewertung`, statut honorée/no-show dans l'admin, email J+1 à 11h (heure de Krabi), QR code
- [ ] **Conversion P2** : performance mobile (T7), preuve sociale (C2), histoire du couple (C3), bloc « Comment venir » (C4), transparence prix et paiement (R2)
- [ ] **Plan de pages SEO** : 7 pages par langue (accueil, menu, french-restaurant-krabi, romantic-dinner, where-to-eat-krabi-town, getting-here-from-ao-nang, wine-belgian-beer), FR + EN puis DE
- [ ] **Newsletter** (N1–N5) : collecte avec consentement, double opt-in, séquences automatiques, segments (Brevo)
- [ ] **KPI hebdomadaires** : collecte par cron dans l'application → table `gecko_weekly_kpis`, synthèse via API Claude, envoi email (WhatsApp reporté), tableau de bord
- [ ] **Allemand** (L1) : /de rédigé par Claude, relu par un humain avant publication ; suédois ensuite
- [ ] **Actions hors code, via intégrations/MCP/CLI/extension Chrome** : Google Business Profile, TripAdvisor, Search Console, cohérence NAP, citations et blogs, partenariats hôtels (chaque action publique validée par le propriétaire)

### Out of Scope

- Review gating (rediriger seulement les clients contents vers Google) — interdit par Google et TripAdvisor, risque de suppression des avis
- Contrepartie contre un avis (dessert, réduction) — interdit ; la recette offerte en N3 récompense l'inscription newsletter, pas l'avis
- Avis payés ou incités, faux avis — interdit ; `aggregateRating` seulement si de vrais avis sont affichés sur la page
- Traduction automatique brute des pages DE/SV — la spec exige une traduction relue
- Publication ou envoi à des tiers (blogs, hôtels, Google, TripAdvisor) sans validation explicite du propriétaire

## Context

- **Constat SEO (relevé Bright Data du 16 oct. 2026)** : 4e en France sur « restaurant français krabi », absent en anglais sur « french restaurant krabi » (cible la plus facile). Sur les requêtes larges, Google montre TripAdvisor, Trip.com et blogs : on y gagne en étant cité.
- **Réputation** : Google 4,7 (1 062 avis) ; TripAdvisor 6e sur 434 à Krabi Town, objectif top 3 ; lien du site TripAdvisor pointe vers tripadvisor.be (à corriger).
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
*Last updated: 2026-10-16 after initialization*
