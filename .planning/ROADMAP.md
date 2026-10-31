# Roadmap: Gecko Cabane

## Milestones

- ✅ **v1.0 SEO, conversion et réputation** — Phases 1-8 (livré 2026-10-31, clos avec dette reportée) — archive : `.planning/milestones/v1.0-ROADMAP.md`, exigences : `.planning/milestones/v1.0-REQUIREMENTS.md`
- 🚧 **v1.1 Refonte de l'admin** — Phases 9-17 (code livré et audité 2026-10-31 : 37 exigences sur 44 vérifiées ; restent des validations du propriétaire, l'UAT de preview, la migration 020 et la passe 17c — voir `.planning/v1.1-MILESTONE-AUDIT.md`)

<details>
<summary>✅ v1.0 SEO, conversion et réputation (Phases 1-8) — livré 2026-10-31</summary>

Détail complet des phases, plans et preuves : `.planning/milestones/v1.0-ROADMAP.md`. Les phases 4 à 8 ont été livrées avec des restes bloqués sur le propriétaire ; ces éléments restent hors périmètre de v1.1 (voir REQUIREMENTS.md, « Future Requirements ») :

- 04-03 fiche Google Business Profile (OPS-01)
- SEO-08 (PageSpeed 85, LCP 2,5 s), CONV-02 (photo du couple)
- 06-10 TripAdvisor et NAP (OPS-04, OPS-05), relecture native DE/SV
- 07-02, 07-10, 07-11 : lancement de la newsletter
- 08-13 / KPI-08 : 2 semaines de TEST puis `KPI_REPORT_MODE=live` (pas avant le 2026-11-16)

Les dossiers `.planning/phases/01-04` et `08`, ainsi que les workstreams, restent en place.

</details>

## Overview

Objectif de v1.1 : refaire l'admin en outil de travail sobre (cheffe sur téléphone, serveurs sur tablette, développeur sur ordinateur), supprimer la gestion de salle sans toucher à la réservation, et ne garder que ce qui sert. Contrainte forte : le site est en production et la haute saison démarre ; l'API de réservation et la machine à statuts restent figées (emails, cron d'avis J+1, KPI en dépendent), les tables SQL `gecko_table*` restent en base, le build doit être vert à chaque commit (Vitest gate le build).

Ordre : audit validé par le propriétaire, suppression des tables (appelants avant appelés), fondation design, shell, puis refonte page par page du moins critique au plus critique (Site public, Carte, Réservations + Aujourd'hui, Réputation), clôture sécurité et QA.

Si le temps manque : livrer d'abord les phases 10, 11, 12 et 15 ; le shell rend les autres pages livrables indépendamment.

Granularité : standard. Numérotation : continue depuis v1.0 (phase 9 à 17).

## Phases

- [ ] **Phase 9: Audit et validation propriétaire** - Verdicts par page, navigation cible, brief de design, liste d'impact des tests, usage réel recueilli (sans code)
- [x] **Phase 10: Suppression de la gestion de salle** - Plus de page, d'API ni de types « tables » ; la réservation et la disponibilité fonctionnent comme avant
- [x] **Phase 11: Fondation du système de design** - Tokens `--adm-*`, primitives, états, hook de requêtes et page kit validés avant toute page
- [x] **Phase 12: Shell et navigation** - Un shell partagé responsive autour de toutes les pages admin, une seule source de navigation
- [x] **Phase 13: Site public (Horaires, Annonces, Capacité)** - Une section de réglages avec retour de sauvegarde et erreurs lisibles
- [x] **Phase 14: Carte** - Édition de la carte sur un seul écran
- [ ] **Phase 15: Réservations et Aujourd'hui** - Accueil du service du jour et liste dense avec actions de statut en un tap
- [ ] **Phase 16: Réputation (Avis et KPI)** - Avis et KPI regroupés dans le nouveau design, libellés TEST/live conservés
- [ ] **Phase 17: Accès, sécurité et QA finale** - Révocation des lectures publiques orphelines, invitation d'admin, « Complet ce soir », passe accessibilité et garde-fous

## Phase Details

### Phase 9: Audit et validation propriétaire
**Goal**: Le propriétaire a validé par écrit ce qui est gardé, simplifié, fusionné ou supprimé, et le cadre de la refonte (navigation, brief de design, impact sur les tests) est fixé avant d'écrire du code
**Depends on**: Nothing (première phase de v1.1)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04
**Success Criteria** (what must be TRUE):
  1. Un document d'audit liste chaque page admin avec son verdict (garder / simplifier / fusionner / supprimer) et le propriétaire l'a validé par écrit
  2. La navigation cible (2 niveaux au plus) et un brief de design « outil de travail sobre » d'une page (palette neutre ou accent de marque inclus) sont validés
  3. Une liste d'impact recense les tests qui lisent le source de l'admin et des routes tables, avec ce qu'il faut changer pour chacun
  4. Les retours de la cheffe et des serveurs sur l'usage réel de l'admin sont consignés, y compris l'état de la saisie manuelle des totaux d'avis et du flux d'invitation d'admin
**Plans**: TBD

### Phase 10: Suppression de la gestion de salle
**Goal**: Le plan de salle et le placement des réservations n'existent plus dans l'admin ni dans l'API, sans aucun effet sur la prise de réservation et la capacité
**Depends on**: Phase 9
**Requirements**: TAB-01, TAB-02, TAB-03, TAB-04, TAB-05, TAB-06
**Success Criteria** (what must be TRUE):
  1. Un test de contrat prouve que la création de réservation et le calcul de disponibilité ne référencent aucun objet table ; on réserve jusqu'à 40 couverts, le suivant est refusé
  2. L'admin n'affiche plus de page Tables, de modal de placement ni de lien du tableau de bord vers les tables, et aucun lien ne mène à une 404
  3. `/api/tables/*` répond 404, les types tables sont absents de `src/types/database.ts` et `tsc`, lint et Vitest passent
  4. Les réglages de capacité et de durée d'occupation d'un créneau s'affichent sans le mot « table » et gardent leurs clés `max_covers` et `table_block_duration_minutes`
  5. Un test négatif échoue si `/admin/tables` ou `/api/tables` réapparaissent ; les tables SQL `gecko_table*` sont toujours en base
**Plans**: TBD
**UI hint**: yes

### Phase 11: Fondation du système de design
**Goal**: Toute page admin peut être construite à partir de primitives communes, sobres, denses et accessibles, validées visuellement avant leur adoption
**Depends on**: Phase 10
**Requirements**: DSN-01, DSN-02, DSN-03, DSN-04, DSN-05, DSN-06, DSN-07
**Success Criteria** (what must be TRUE):
  1. Le spike Base UI conclut (build React Compiler, Toast, Select, retour du focus) ; en cas d'échec, le repli `<dialog>` natif + `sonner` est retenu et documenté
  2. Une page kit interne affiche Button, Field, Input, Card, Badge, DataTable, PageHeader, dialogue de confirmation et Toast à 360, 768, 1024 et 1440 px, en sans-serif avec chiffres tabulaires et sans fuite des styles du site public
  3. Les composants d'état chargement, vide et erreur et le hook `useAdminQuery`/`adminFetch` (avec annulation) sont utilisables par n'importe quelle page
  4. Un dialogue accessible (Échap, focus piégé puis restitué) remplace tous les `confirm()` natifs de l'admin
**Plans**: TBD
**UI hint**: yes

### Phase 12: Shell et navigation
**Goal**: Toutes les pages admin partagent la même enveloppe et la même navigation, adaptées au téléphone, à la tablette et à l'ordinateur
**Depends on**: Phase 11
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05
**Success Criteria** (what must be TRUE):
  1. Un admin connecté voit le même shell sur toutes les pages hors connexion ; connexion et inscription s'affichent sans shell
  2. La navigation est une barre du bas sur téléphone, un rail d'icônes sur tablette et une barre latérale sur ordinateur, avec un lien actif visible
  3. Une seule modification de `nav.ts` ajoute ou retire une entrée partout (barre, rail, barre latérale, cartes d'accueil)
  4. Les URL admin conservées répondent toujours et un test de liens échoue si un lien interne est mort
**Plans**: TBD
**UI hint**: yes

### Phase 13: Site public (Horaires, Annonces, Capacité)
**Goal**: Le propriétaire règle tout ce qui change l'affichage du site public depuis une seule section claire
**Depends on**: Phase 12
**Requirements**: SITE-01, SITE-02
**Success Criteria** (what must be TRUE):
  1. La section « Site public » permet de modifier horaires, horaires exceptionnels, annonces et capacité / durée d'occupation d'un créneau
  2. Chaque enregistrement affiche un toast de succès, et un échec affiche un message d'erreur lisible sans perdre la saisie
  3. Les modifications se reflètent sur le site public comme avant (horaires, bannière d'annonce, disponibilité)
**Plans**: TBD
**UI hint**: yes

### Phase 14: Carte
**Goal**: La cheffe met à jour prix et disponibilité des plats depuis son téléphone, sur un seul écran
**Depends on**: Phase 13
**Requirements**: MENU-01, MENU-02
**Success Criteria** (what must be TRUE):
  1. Sur un seul écran, on modifie le prix d'un plat, on le rend indisponible / disponible et on ajoute rapidement un plat
  2. Une modification de carte apparaît sur `/menu` (cache invalidé par `revalidateTag` dans les routes API)
  3. Les libellés figés par le test menu sont inchangés et la suite de tests passe
**Plans**: TBD
**UI hint**: yes

### Phase 15: Réservations et Aujourd'hui
**Goal**: La cheffe et les serveurs voient le service du jour d'un coup d'oeil et traitent chaque réservation en un tap, sans régression sur emails, cron d'avis et KPI
**Depends on**: Phase 14
**Requirements**: TDY-01, TDY-02, RSV-01, RSV-02, RSV-03, RSV-04, RSV-05, RSV-06
**Success Criteria** (what must be TRUE):
  1. L'accueil « Aujourd'hui » montre les arrivées du jour par heure, les couverts réservés sur `max_covers` et les réservations à confirmer
  2. Un indicateur par créneau (12h à 22h) affiche les couverts occupés sur 40, cohérent avec la disponibilité réelle du formulaire public
  3. Depuis la liste dense (navigation par date, recherche), l'admin confirme, termine, annule ou marque no-show en un tap ; les boutons se désactivent pendant la requête et les heures s'affichent à l'heure de Krabi
  4. Chaque réservation offre des liens `tel:` et WhatsApp, et le bouton « + Réservation » ouvre la saisie manuelle depuis n'importe quelle page
  5. Sur preview, hors service (12h-22h), l'UAT confirme les emails de confirmation et d'annulation, le cron d'avis J+1 et les couverts KPI inchangés
**Plans**: TBD
**UI hint**: yes

### Phase 16: Réputation (Avis et KPI)
**Goal**: Avis et rapport KPI vivent sous une même entrée « Réputation » dans le nouveau design, sans risque d'envoi involontaire
**Depends on**: Phase 15
**Requirements**: REP-01, REP-02, REP-03
**Success Criteria** (what must be TRUE):
  1. Une entrée « Réputation » regroupe avis et KPI avec les primitives du nouveau design, états chargement / vide / erreur compris
  2. Les libellés TEST / live du rapport KPI sont inchangés ; aucun envoi live n'est possible avant le 2026-11-16 et sans accord du propriétaire
  3. La saisie manuelle des totaux d'avis est retirée uniquement si l'audit confirme que la source KPI la remplace et que rien d'autre ne la lit ; sinon elle reste, redessinée
**Plans**: TBD
**UI hint**: yes

### Phase 17: Accès, sécurité et QA finale
**Goal**: Les accès orphelins sont fermés, l'ajout d'un admin et l'option « Complet ce soir » sont tranchés, et l'admin entier passe les contrôles d'accessibilité et de cohérence
**Depends on**: Phase 16
**Requirements**: ACC-01, ACC-02, ACC-03, QA-01, QA-02, QA-03, QA-04
**Success Criteria** (what must be TRUE):
  1. Après accord du propriétaire et vérification qu'aucune autre application du projet Supabase partagé ne les lit, une migration « revoke seulement » retire la lecture publique de `gecko_table*` ; sans accord, la dette est documentée
  2. `/admin/signup` n'existe plus et un processus d'invitation d'un nouvel admin est défini et testé
  3. « Complet ce soir » ferme la réservation en un tap, sur un modèle de données décidé, sans migration destructive
  4. Sur téléphone et tablette, cibles tactiles d'au moins 44 px ; navigation clavier, focus visible, dialogues et contraste conformes sur toutes les pages ; aucun statut porté par la seule couleur
  5. Aucun fichier de `src/app/admin` n'utilise les anciens tokens ; `npm run lint`, `tsc` et Vitest passent
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. Audit et validation propriétaire | n/a | Partiel : AUDIT-03 vérifié ; AUDIT-01/02 (validation écrite) et AUDIT-04 (retours cheffe/serveurs) en attente du propriétaire | - |
| 10. Suppression de la gestion de salle | n/a | Complete | 2026-10-31 |
| 11. Fondation du système de design | n/a | Complete | 2026-10-31 |
| 12. Shell et navigation | n/a | Complete | 2026-10-31 |
| 13. Site public | n/a | Complete | 2026-10-31 |
| 14. Carte | n/a | Complete | 2026-10-31 |
| 15. Réservations et Aujourd'hui | n/a | Code livré et vérifié ; RSV-06 (UAT sur preview hors service) en attente | - |
| 16. Réputation (Avis et KPI) | n/a | Code livré ; REP-03 (retrait de la saisie Google) non fait, reporté à 17c | - |
| 17. Accès, sécurité et QA finale | n/a | Code livré ; ACC-01 (migration 020, accord du propriétaire) et QA-02 (passage clavier/lecteur d'écran) en attente | - |

---
*Roadmap v1.1 créé le 2026-10-31, mis à jour à la clôture du 2026-10-31 (phases cochées uniquement quand toutes leurs exigences sont VERIFIED dans l'audit). Historique v1.0 : `.planning/milestones/v1.0-ROADMAP.md`.*
