---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Vitesse mobile, SEO on-page et sécurité
status: ready_to_plan
last_updated: "2026-11-09T15:00:00.000Z"
last_activity: 2026-11-09
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-31)

**Core value:** geckocabanerestaurant.com doit devenir la première source de réservations des touristes européens de Krabi : être trouvé (SEO FR/EN/DE) et réserver en moins de 60 secondes.
**Current focus:** Milestone v1.2, Phase 18 Vitesse mobile (prochaine étape : `/gsd-plan-phase 18`)

## Current Position

Phase: 18 (Vitesse mobile) — pas commencée
Plan: —
Status: Roadmap v1.2 créée (phases 18-20), prête pour la planification
Last activity: 2026-11-09 — Roadmap v1.2 créée

Progress: [..........] 0% (0/3 phases)

## Performance Metrics

**Velocity:**

- Total plans completed (v1.2): 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

## Accumulated Context

### Decisions

- v1.2 : phases 18-20 (numérotation continue) ; 18 Vitesse mobile, 19 SEO on-page, 20 Sécurité + a11y + mesure finale
- v1.2 : PERF-07 (Lighthouse >= 90) rattaché à la phase 20 pour être mesuré après CSP et correctifs a11y
- v1.2 : la CSP (SEC-05) vient après la phase 18 car elle dépend du chargement final des scripts (next/font, script analytics)
- v1.2 : A11Y-01 sans changement d'identité visuelle ; pas de changement de design ni de textes hors liste
- v1.1 : les phases continuent la numérotation de v1.0 (9 à 17) ; les dossiers `.planning/phases/01-08` et les workstreams ne sont pas touchés
- v1.1 : API de réservation, `PUT /api/reservations` et machine à statuts figés (emails, cron J+1, KPI en dépendent)
- v1.1 : Base UI retenu après spike en phase 11 ; repli `<dialog>` natif + `sonner`
- v1.1 : tables SQL `gecko_table*` laissées en base ; la révocation de lecture publique (ACC-01) exige l'accord du propriétaire
- v1.1 : ordre de migration du moins critique au plus critique (Site public, Carte, Réservations, Réputation) ; une PR par page, validation sur preview
- v1.1 : ACC-01..03 et QA-* regroupés en phase 17 (ACC-02 supprime `/admin/signup` après le shell, qui le garde hors shell en phase 12)
- 2026-10-30 : restaurant ouvert tous les jours 12h-22h ; coordonnées Apple Maps
- Décisions v1.0 conservées dans `.planning/milestones/v1.0-ROADMAP.md`

### Pending Todos

None yet.

### Blockers/Concerns

- Aucune télémétrie d'usage de l'admin : retours de la cheffe et des serveurs jamais reçus (AUDIT-04)
- Validation écrite du propriétaire page par page absente (AUDIT-01/02) : seules les décisions orales du 2026-10-31 sont consignées (`09-OWNER-VALIDATION.md`)
- UAT sur preview, hors service 12h-22h Krabi (RSV-06, `15-UAT.md`) : emails de confirmation et d'annulation, cron J+1, couverts KPI
- Migrations 019, 021 et 022 additives, 020 (revoke seulement) : écrites, JAMAIS appliquées par le code ; 021 est nécessaire à l'invitation et au mot de passe oublié ; 020 exige l'accord écrit du propriétaire et la vérification de l'autre application du projet Supabase partagé
- 17c non réalisée : retrait de la saisie Google (REP-03), passage clavier / lecteur d'écran (QA-02)
- Tests qui lisent le source (`admin-routes-guarded`, `kpi-admin-wiring`, `menu-admin-wiring`, `review-badges`) : liste d'impact en phase 9 avant toute suppression
- Chemins `src/app/admin/**` codés en dur (tests, scripts, Sentry) : grep avant le `git mv` du route group (phase 12)
- Aucun envoi KPI live avant le 2026-11-16 et sans accord du propriétaire
- Texte DE/SV : relecture par un natif toujours recommandée (dette v1.0) ; obligatoire pour les nouvelles pages de la phase 19 (ONP-11)
- Phase 20 : la CSP doit être vérifiée dans le navigateur (réservation, admin, Maps, GTM, Sentry, Supabase) avant mise en production

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 261101-scj | Horaires dynamiques : une source de vérité pour le texte visible et le schema JSON-LD | 2026-11-01 | 8a122a6 | [261101-scj-horaires-dynamiques-une-source-de-verite](./quick/261101-scj-horaires-dynamiques-une-source-de-verite/) |
| 261102-or1 | Bouton Reserver visible en haut des pages vues + titres/descriptions SEO (accueil, french-restaurant-krabi) | 2026-11-02 | 458785f | [261102-or1-bouton-de-reservation-en-haut-des-pages-](./quick/261102-or1-bouton-de-reservation-en-haut-des-pages-/) |

## Session Continuity

Last session: 2026-11-09
Stopped at: roadmap v1.2 créée ; prochaine étape : `/gsd-plan-phase 18`
Resume file: None

## Deferred Items

Dette v1.0 reconnue à la clôture (2026-10-31), hors périmètre de v1.1 :

| Catégorie | Élément | Statut |
|-----------|---------|--------|
| Vérification | 02-VERIFICATION | human_needed |
| Vérification | 04-VERIFICATION | gaps_found |
| Vérification | 08-VERIFICATION | gaps_found |
| Plan | 04-03 fiche Google (OPS-01) | reporté par le propriétaire |
| Plan | 06-10 TripAdvisor et NAP (OPS-04, OPS-05) | bloqué, accord requis |
| Plan | 07-02, 07-10, 07-11 newsletter | bloqués |
| Plan | 08-13 KPI-08 (2 semaines de TEST puis live) | pas avant le 2026-11-16 |
| Exigence | SEO-08, CONV-02 | ouvertes |
| Audit | audit de milestone v1.1 | exécuté 2026-10-31 (`v1.1-MILESTONE-AUDIT.md`) |

## Operator Next Steps

- Lundi 2026-11-02 : observer le premier cron KPI automatique (00:00 UTC collecte, 01:00 UTC envoi, TEST)
- Supprimer la clé Google `gecko-cabane-places-server` (inutile) ; restreindre ou supprimer l'ancienne « Maps API Key »
- Faire valider par écrit `09-OWNER-VALIDATION.md` (AUDIT-01/02), recueillir les retours AUDIT-04, jouer l'UAT `15-UAT.md` (RSV-06)
- Appliquer 019, 021 puis 022 hors service ; 020 seulement sur accord écrit ; désactiver l'inscription publique dans Supabase Auth
