# Requirements: Gecko Cabane

**Defined:** 2026-10-31
**Core Value:** geckocabanerestaurant.com doit devenir la première source de réservations des touristes européens de Krabi.
**Milestone v1.1 :** Refonte de l'admin (design UX/UI, revue d'utilité des fonctionnalités, suppression de la gestion de salle). L'admin reste en français fixe, sans i18n.

## v1.1 Requirements

### Audit (AUDIT)

- [ ] **AUDIT-01**: Le propriétaire valide par écrit, page par page, le verdict garder / simplifier / fusionner / supprimer avant toute implémentation
- [ ] **AUDIT-02**: La navigation cible (2 niveaux au plus) et un brief de design « outil de travail sobre » d'une page sont validés
- [x] **AUDIT-03**: Une liste d'impact des tests (tests qui lisent le source de l'admin et des routes tables) est établie avant toute suppression
- [ ] **AUDIT-04**: L'usage réel de l'admin est recueilli auprès de la cheffe et des serveurs

### Suppression de la gestion de salle (TAB)

- [x] **TAB-01**: Un test de contrat prouve que la création de réservation et le calcul de disponibilité ne référencent aucun objet table
- [x] **TAB-02**: La page `/admin/tables`, le modal de placement dans les réservations et les liens du tableau de bord sont retirés
- [x] **TAB-03**: Les routes `/api/tables/*` et leurs entrées dans les tests de garde sont supprimées dans le même commit
- [x] **TAB-04**: Les types liés aux tables sont retirés de `src/types/database.ts` sans erreur `tsc`
- [x] **TAB-05**: Les réglages `max_covers` et `table_block_duration_minutes` gardent leur clé et reçoivent des libellés sans « table » (ex. « Durée d'occupation d'un créneau »)
- [x] **TAB-06**: Un test négatif échoue si `/admin/tables` ou `/api/tables` réapparaissent ; les tables SQL `gecko_table*` restent en base

### Système de design (DSN)

- [x] **DSN-01**: Le spike Base UI valide le build React Compiler, Toast, Select et le retour du focus ; sinon repli sur `<dialog>` natif et `sonner`
- [x] **DSN-02**: Des tokens `--adm-*` propres à l'admin (couleurs, typographie sans-serif, `tabular-nums`, espacements) neutralisent les styles globaux du site public
- [x] **DSN-03**: Des primitives partagées existent dans `src/components/admin/` (Button, Field, Input, Card, Badge, DataTable, PageHeader, Dialog de confirmation, Toast)
- [x] **DSN-04**: Chaque page a des états de chargement, vide et erreur via des composants communs
- [x] **DSN-05**: Un hook `useAdminQuery`/`adminFetch` commun gère les appels aux routes `/api/*` existantes, avec annulation
- [x] **DSN-06**: Les `confirm()` natifs sont remplacés par un dialogue accessible
- [x] **DSN-07**: Une page kit interne permet de relire les composants à 360, 768, 1024 et 1440 px

### Shell et navigation (NAV)

- [x] **NAV-01**: Un shell partagé (route group `admin/(app)`) entoure toutes les pages hors connexion
- [x] **NAV-02**: La navigation s'adapte : barre du bas sur téléphone, rail d'icônes sur tablette, barre latérale sur ordinateur
- [x] **NAV-03**: Un seul fichier `nav.ts` alimente toutes les entrées de navigation
- [x] **NAV-04**: Les URL admin existantes conservées répondent toujours ; un test de liens détecte les liens morts
- [x] **NAV-05**: Connexion et inscription restent hors shell

### Aujourd'hui (TDY)

- [x] **TDY-01**: La cheffe voit en accueil les arrivées du jour par heure, les couverts réservés sur `max_covers` et les réservations à confirmer
- [x] **TDY-02**: Un indicateur de capacité par créneau (12h à 22h) affiche les couverts occupés sur 40, avec la logique de disponibilité existante

### Réservations (RSV)

- [x] **RSV-01**: L'admin change le statut d'une réservation en un tap (confirmer, terminer, annuler, no-show) via un helper de statut testé ; l'énumération des statuts et `PUT /api/reservations` ne changent pas
- [x] **RSV-02**: La liste est dense, avec navigation par date et recherche côté client
- [x] **RSV-03**: Chaque réservation propose des liens `tel:` et WhatsApp
- [x] **RSV-04**: Un bouton global « + Réservation » ouvre la saisie manuelle depuis toute page
- [x] **RSV-05**: Les boutons de statut sont désactivés pendant la requête ; les heures s'affichent sans conversion de fuseau (Krabi)
- [ ] **RSV-06**: Les emails de confirmation et d'annulation, le cron d'avis J+1 et les couverts KPI se comportent comme avant (UAT sur preview, fusion hors service 12h-22h)

### Site public (SITE)

- [x] **SITE-01**: Horaires, horaires exceptionnels, annonces et capacité/durée de repas sont réunis dans une section « Site public »
- [x] **SITE-02**: Chaque modification affiche un retour (toast) et un état d'erreur lisible

### Carte (MENU)

- [x] **MENU-01**: La carte s'édite sur un seul écran : prix, disponibilité, ajout rapide
- [x] **MENU-02**: `revalidateTag` reste appelé par les routes API et les libellés figés par le test menu sont conservés

### Réputation (REP)

- [x] **REP-01**: Avis et KPI sont regroupés sous « Réputation » avec le nouveau système de design
- [x] **REP-02**: Les libellés TEST/live du rapport KPI sont conservés ; aucun envoi live avant le 2026-11-16 et sans accord du propriétaire
- [x] **REP-03**: La saisie manuelle des totaux d'avis est retirée seulement si l'audit confirme que la source KPI la remplace et que rien d'autre ne la lit

### Sécurité et accès (ACC)

- [x] **ACC-01**: Une migration « revoke seulement » retire la lecture publique de `gecko_table*`, sur accord du propriétaire et après vérification qu'aucune autre application du projet Supabase partagé ne les lit
- [x] **ACC-02**: `/admin/signup` est supprimé après définition d'un processus d'invitation d'un nouvel admin
- [x] **ACC-03**: L'option « Complet ce soir » (fermer le service à la réservation en un tap) est décidée sur son modèle de données puis implémentée sans migration destructive

### Qualité (QA)

- [x] **QA-01**: Cibles tactiles d'au moins 44 px sur téléphone et tablette ; statut jamais porté par la seule couleur
- [ ] **QA-02**: Navigation clavier, focus visible, dialogues accessibles et contraste vérifiés sur toutes les pages
- [x] **QA-03**: Aucun fichier de `src/app/admin` n'utilise les anciens tokens (`var(--primary)` etc.) en fin de milestone
- [x] **QA-04**: `npm run lint`, `tsc` et la suite Vitest passent ; le build reste vert à chaque commit

## Future Requirements (dette v1.0, hors périmètre de v1.1)

- **SEO-08** : PageSpeed mobile 85 et LCP 2,5 s
- **CONV-02** : photo du couple, année d'ouverture, histoire
- **KPI-08** : 2 semaines de TEST puis `KPI_REPORT_MODE=live` (pas avant le 2026-11-16)
- **OPS-01, OPS-04, OPS-05** : fiche Google, TripAdvisor, cohérence NAP (accord du propriétaire)
- **Newsletter** : blocages 07-02, 07-10, 07-11 ; vérification migration 017 et webhook Resend
- **Relecture native** des textes DE et SV
- Vérifications ouvertes : 02-VERIFICATION, 04-VERIFICATION, 08-VERIFICATION
- Export CSV et vue semaine des réservations

## Out of Scope

| Fonctionnalité | Raison |
|----------------|--------|
| Plan de salle et placement des réservations | Décision du propriétaire : sans intérêt pour 40 couverts |
| Suppression des tables SQL `gecko_table*` | Migration destructive, seulement sur accord explicite |
| Modification de l'API de réservation ou de la machine à statuts | Dépendances : emails, cron J+1, KPI |
| CRM, analytics maison, éditeur de rôles | Hors besoin d'un restaurant de 40 couverts |
| Glisser-déposer de l'ordre de la carte | Complexité sans gain mesuré |
| Messagerie sortante ou édition de la newsletter dans l'admin | Hors périmètre ; envois à des tiers sur accord du propriétaire |
| i18n de l'admin | L'admin reste en français fixe |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 9 | Pending (HUMAN) : feuille de validation 09-OWNER-VALIDATION.md non signée page par page ; seules les décisions orales du 2026-10-31 sont consignées |
| AUDIT-02 | Phase 9 | Pending (HUMAN) : navigation et brief validés par la galerie (journal), feuille non signée |
| AUDIT-03 | Phase 9 | Complete |
| AUDIT-04 | Phase 9 | Pending (HUMAN) : questionnaire écrit, aucun retour de la cheffe ni des serveurs |
| TAB-01 | Phase 10 | Complete |
| TAB-02 | Phase 10 | Complete |
| TAB-03 | Phase 10 | Complete |
| TAB-04 | Phase 10 | Complete |
| TAB-05 | Phase 10 | Complete |
| TAB-06 | Phase 10 | Complete |
| DSN-01 | Phase 11 | Complete |
| DSN-02 | Phase 11 | Complete |
| DSN-03 | Phase 11 | Complete |
| DSN-04 | Phase 11 | Complete |
| DSN-05 | Phase 11 | Complete |
| DSN-06 | Phase 11 | Complete |
| DSN-07 | Phase 11 | Complete |
| NAV-01 | Phase 12 | Complete |
| NAV-02 | Phase 12 | Complete |
| NAV-03 | Phase 12 | Complete |
| NAV-04 | Phase 12 | Complete |
| NAV-05 | Phase 12 | Complete |
| SITE-01 | Phase 13 | Complete |
| SITE-02 | Phase 13 | Complete |
| MENU-01 | Phase 14 | Complete |
| MENU-02 | Phase 14 | Complete |
| TDY-01 | Phase 15 | Complete |
| TDY-02 | Phase 15 | Complete |
| RSV-01 | Phase 15 | Complete |
| RSV-02 | Phase 15 | Complete |
| RSV-03 | Phase 15 | Complete |
| RSV-04 | Phase 15 | Complete |
| RSV-05 | Phase 15 | Complete |
| RSV-06 | Phase 15 | Pending (HUMAN) : code gelé (diff vide), UAT sur preview hors service 12h-22h non exécuté |
| REP-01 | Phase 16 | Complete |
| REP-02 | Phase 16 | Complete |
| REP-03 | Phase 16 | Complete (17c : saisie Google retirée, TripAdvisor gardée, tests/review-totals.test.ts) |
| ACC-01 | Phase 17 | Complete : migration 020 appliquée le 2026-11-01 sur accord du propriétaire (vérifié : aucune autre lecture ; 4 politiques publiques retirées, droits anon retirés, données intactes) |
| ACC-02 | Phase 17 | Complete |
| ACC-03 | Phase 17 | Complete |
| QA-01 | Phase 17 | Complete |
| QA-02 | Phase 17 | Partial : axe sans violation de contraste/nom, heading-order et débordement à 195 px corrigés (FINAL-REVIEW-FIXES) ; passage clavier et lecteur d’écran complet non fait |
| QA-03 | Phase 17 | Complete |
| QA-04 | Phase 17 | Complete |

**Coverage:**
- v1.1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0
- Statut à la clôture (audit `.planning/v1.1-MILESTONE-AUDIT.md`, commit audité 3c93473) : 37 Complete (VERIFIED), 7 non clôturées (3 HUMAN_NEEDED, 4 PARTIAL dont 2 de validation écrite) ; aucune FAILED

---
*Requirements defined: 2026-10-31*
