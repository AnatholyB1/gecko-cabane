# Requirements: Gecko Cabane

**Defined:** 2026-10-31
**Core Value:** geckocabanerestaurant.com doit devenir la première source de réservations des touristes européens de Krabi.
**Milestone v1.1 :** Refonte de l'admin (design UX/UI, revue d'utilité des fonctionnalités, suppression de la gestion de salle). L'admin reste en français fixe, sans i18n.

## v1.1 Requirements

### Audit (AUDIT)

- [ ] **AUDIT-01**: Le propriétaire valide par écrit, page par page, le verdict garder / simplifier / fusionner / supprimer avant toute implémentation
- [ ] **AUDIT-02**: La navigation cible (2 niveaux au plus) et un brief de design « outil de travail sobre » d'une page sont validés
- [ ] **AUDIT-03**: Une liste d'impact des tests (tests qui lisent le source de l'admin et des routes tables) est établie avant toute suppression
- [ ] **AUDIT-04**: L'usage réel de l'admin est recueilli auprès de la cheffe et des serveurs

### Suppression de la gestion de salle (TAB)

- [ ] **TAB-01**: Un test de contrat prouve que la création de réservation et le calcul de disponibilité ne référencent aucun objet table
- [ ] **TAB-02**: La page `/admin/tables`, le modal de placement dans les réservations et les liens du tableau de bord sont retirés
- [ ] **TAB-03**: Les routes `/api/tables/*` et leurs entrées dans les tests de garde sont supprimées dans le même commit
- [ ] **TAB-04**: Les types liés aux tables sont retirés de `src/types/database.ts` sans erreur `tsc`
- [ ] **TAB-05**: Les réglages `max_covers` et `table_block_duration_minutes` gardent leur clé et reçoivent des libellés sans « table » (ex. « Durée d'occupation d'un créneau »)
- [ ] **TAB-06**: Un test négatif échoue si `/admin/tables` ou `/api/tables` réapparaissent ; les tables SQL `gecko_table*` restent en base

### Système de design (DSN)

- [ ] **DSN-01**: Le spike Base UI valide le build React Compiler, Toast, Select et le retour du focus ; sinon repli sur `<dialog>` natif et `sonner`
- [ ] **DSN-02**: Des tokens `--adm-*` propres à l'admin (couleurs, typographie sans-serif, `tabular-nums`, espacements) neutralisent les styles globaux du site public
- [ ] **DSN-03**: Des primitives partagées existent dans `src/components/admin/` (Button, Field, Input, Card, Badge, DataTable, PageHeader, Dialog de confirmation, Toast)
- [ ] **DSN-04**: Chaque page a des états de chargement, vide et erreur via des composants communs
- [ ] **DSN-05**: Un hook `useAdminQuery`/`adminFetch` commun gère les appels aux routes `/api/*` existantes, avec annulation
- [ ] **DSN-06**: Les `confirm()` natifs sont remplacés par un dialogue accessible
- [ ] **DSN-07**: Une page kit interne permet de relire les composants à 360, 768, 1024 et 1440 px

### Shell et navigation (NAV)

- [ ] **NAV-01**: Un shell partagé (route group `admin/(app)`) entoure toutes les pages hors connexion
- [ ] **NAV-02**: La navigation s'adapte : barre du bas sur téléphone, rail d'icônes sur tablette, barre latérale sur ordinateur
- [ ] **NAV-03**: Un seul fichier `nav.ts` alimente toutes les entrées de navigation
- [ ] **NAV-04**: Les URL admin existantes conservées répondent toujours ; un test de liens détecte les liens morts
- [ ] **NAV-05**: Connexion et inscription restent hors shell

### Aujourd'hui (TDY)

- [ ] **TDY-01**: La cheffe voit en accueil les arrivées du jour par heure, les couverts réservés sur `max_covers` et les réservations à confirmer
- [ ] **TDY-02**: Un indicateur de capacité par créneau (12h à 22h) affiche les couverts occupés sur 40, avec la logique de disponibilité existante

### Réservations (RSV)

- [ ] **RSV-01**: L'admin change le statut d'une réservation en un tap (confirmer, terminer, annuler, no-show) via un helper de statut testé ; l'énumération des statuts et `PUT /api/reservations` ne changent pas
- [ ] **RSV-02**: La liste est dense, avec navigation par date et recherche côté client
- [ ] **RSV-03**: Chaque réservation propose des liens `tel:` et WhatsApp
- [ ] **RSV-04**: Un bouton global « + Réservation » ouvre la saisie manuelle depuis toute page
- [ ] **RSV-05**: Les boutons de statut sont désactivés pendant la requête ; les heures s'affichent sans conversion de fuseau (Krabi)
- [ ] **RSV-06**: Les emails de confirmation et d'annulation, le cron d'avis J+1 et les couverts KPI se comportent comme avant (UAT sur preview, fusion hors service 12h-22h)

### Site public (SITE)

- [ ] **SITE-01**: Horaires, horaires exceptionnels, annonces et capacité/durée de repas sont réunis dans une section « Site public »
- [ ] **SITE-02**: Chaque modification affiche un retour (toast) et un état d'erreur lisible

### Carte (MENU)

- [ ] **MENU-01**: La carte s'édite sur un seul écran : prix, disponibilité, ajout rapide
- [ ] **MENU-02**: `revalidateTag` reste appelé par les routes API et les libellés figés par le test menu sont conservés

### Réputation (REP)

- [ ] **REP-01**: Avis et KPI sont regroupés sous « Réputation » avec le nouveau système de design
- [ ] **REP-02**: Les libellés TEST/live du rapport KPI sont conservés ; aucun envoi live avant le 2026-11-16 et sans accord du propriétaire
- [ ] **REP-03**: La saisie manuelle des totaux d'avis est retirée seulement si l'audit confirme que la source KPI la remplace et que rien d'autre ne la lit

### Sécurité et accès (ACC)

- [ ] **ACC-01**: Une migration « revoke seulement » retire la lecture publique de `gecko_table*`, sur accord du propriétaire et après vérification qu'aucune autre application du projet Supabase partagé ne les lit
- [ ] **ACC-02**: `/admin/signup` est supprimé après définition d'un processus d'invitation d'un nouvel admin
- [ ] **ACC-03**: L'option « Complet ce soir » (fermer le service à la réservation en un tap) est décidée sur son modèle de données puis implémentée sans migration destructive

### Qualité (QA)

- [ ] **QA-01**: Cibles tactiles d'au moins 44 px sur téléphone et tablette ; statut jamais porté par la seule couleur
- [ ] **QA-02**: Navigation clavier, focus visible, dialogues accessibles et contraste vérifiés sur toutes les pages
- [ ] **QA-03**: Aucun fichier de `src/app/admin` n'utilise les anciens tokens (`var(--primary)` etc.) en fin de milestone
- [ ] **QA-04**: `npm run lint`, `tsc` et la suite Vitest passent ; le build reste vert à chaque commit

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
| AUDIT-01 | Phase 9 | Pending |
| AUDIT-02 | Phase 9 | Pending |
| AUDIT-03 | Phase 9 | Pending |
| AUDIT-04 | Phase 9 | Pending |
| TAB-01 | Phase 10 | Pending |
| TAB-02 | Phase 10 | Pending |
| TAB-03 | Phase 10 | Pending |
| TAB-04 | Phase 10 | Pending |
| TAB-05 | Phase 10 | Pending |
| TAB-06 | Phase 10 | Pending |
| DSN-01 | Phase 11 | Pending |
| DSN-02 | Phase 11 | Pending |
| DSN-03 | Phase 11 | Pending |
| DSN-04 | Phase 11 | Pending |
| DSN-05 | Phase 11 | Pending |
| DSN-06 | Phase 11 | Pending |
| DSN-07 | Phase 11 | Pending |
| NAV-01 | Phase 12 | Pending |
| NAV-02 | Phase 12 | Pending |
| NAV-03 | Phase 12 | Pending |
| NAV-04 | Phase 12 | Pending |
| NAV-05 | Phase 12 | Pending |
| SITE-01 | Phase 13 | Pending |
| SITE-02 | Phase 13 | Pending |
| MENU-01 | Phase 14 | Pending |
| MENU-02 | Phase 14 | Pending |
| TDY-01 | Phase 15 | Pending |
| TDY-02 | Phase 15 | Pending |
| RSV-01 | Phase 15 | Pending |
| RSV-02 | Phase 15 | Pending |
| RSV-03 | Phase 15 | Pending |
| RSV-04 | Phase 15 | Pending |
| RSV-05 | Phase 15 | Pending |
| RSV-06 | Phase 15 | Pending |
| REP-01 | Phase 16 | Pending |
| REP-02 | Phase 16 | Pending |
| REP-03 | Phase 16 | Pending |
| ACC-01 | Phase 17 | Pending |
| ACC-02 | Phase 17 | Pending |
| ACC-03 | Phase 17 | Pending |
| QA-01 | Phase 17 | Pending |
| QA-02 | Phase 17 | Pending |
| QA-03 | Phase 17 | Pending |
| QA-04 | Phase 17 | Pending |

**Coverage:**
- v1.1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-10-31*
