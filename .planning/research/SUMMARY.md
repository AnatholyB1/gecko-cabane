# Project Research Summary

**Project:** Gecko Cabane, milestone v1.1 « Refonte de l'admin »
**Domain:** Back-office d'un petit restaurant (40 couverts, sans plan de salle), refait sur place sur un site en production (Next.js 16 / Supabase)
**Researched:** 2026-10-31
**Confidence:** MEDIUM-HIGH (code : HIGH ; choix de bibliothèque et benchmarks UX : MEDIUM)

## Executive Summary

Refonte d'environ 4 000 lignes de pages admin `'use client'` (10 pages, sans shell ni composants partagés). Trois profils : la cheffe sur téléphone, les serveurs sur tablette, le développeur sur ordinateur. Les outils de référence (Zenchef, TheFork, OpenTable, Toast) partagent une forme : une accueil « service du jour », un cycle de statuts court avec actions en un tap, une zone de configuration rarement ouverte.

Approche recommandée : un shell partagé dans un route group, un petit système de design maison sur des tokens Tailwind v4 propres à l'admin, puis une refonte page par page sur l'API existante, qui reste figée.

La suppression de l'affectation aux tables est sûre : la réservation et la capacité ne dépendent que de `gecko_reservations`, `max_covers` et `table_block_duration_minutes` (RPC `gecko_create_reservation`, migration 008). Les vrais risques : les tests qui lisent le source et bloquent le build (`admin-routes-guarded`, `kpi-admin-wiring`, `menu-admin-wiring`, `review-badges`), les liens morts du tableau de bord, et le piège de nommage `table_block_duration_minutes` (changer l'étiquette, jamais la clé). Les 4 tables SQL `gecko_table*` restent en base.

Risque opérationnel : Vercel déploie au push, en pleine entrée en haute saison. Mitigations : figer la machine à statuts et l'API, supprimer les tables d'abord, construire shell et primitives avant toute page, migrer du moins critique au plus critique, une PR par page, validation du propriétaire sur preview.

## Key Findings

### Stack (STACK.md)

Ajouter peu : `@base-ui/react` ^1.9.0 (Dialog, AlertDialog, Select, Menu, Tabs, Switch, Toast, états en `data-*`), `clsx` ^2.1.1, déclarer `zod` ^4.3.6 (déjà transitif), réutiliser `lucide-react`. Composants maison dans `src/components/admin/` (Button, Field, Input, Card, Badge, DataTable, PageHeader, EmptyState, Skeleton, ErrorState, ConfirmDialog, Toast, AdminShell). Inputs date/heure natifs. `fetch` simple derrière un hook partagé. Ne pas ajouter : CLI shadcn, tailwind-merge, cva, tanstack-table, react-day-picker, react-hook-form, react-query.

Tokens : `globals.css` est celui du site public (corps sombre, Cormorant, `color-scheme` sombre forcé sur les inputs). Déclarer des tokens `--adm-*` sur `:root` exposés via `@theme inline` (les portails sortent du wrapper). Police sans-serif avec `tabular-nums`.

**Conflit tranché :** ARCHITECTURE penchait pour `<dialog>` natif, STACK pour Base UI. Décision : Base UI, après un court spike en début de phase design (build React Compiler, Toast, Select, retour du focus). Repli si le spike échoue : `<dialog>` natif + `sonner`, pas de seconde famille de primitives.

### Features (FEATURES.md)

L'accueil actuel n'a ni données du jour ni navigation. Correctif : une accueil « Aujourd'hui » et un shell persistant.

**Indispensable :** navigation partagée avec action globale « + Réservation » ; « Aujourd'hui » (arrivées par heure, couverts contre `max_covers`, réservations à confirmer) ; liste de réservations dense (statut en un tap, `tel:` et `wa.me`, navigation par date, recherche côté client) ; états chargement/vide/erreur partout ; dialogues de confirmation au lieu de `confirm()` ; mise en page accessible et responsive ; réglages renommés (clé inchangée) ; plan de salle et `/api/tables/*` supprimés.

**Différenciateur du MVP :** indicateur de capacité par créneau (couverts occupés sur 40, de 12h à 22h).

**Reporté :** « Complet ce soir » (décision de modèle de données), export CSV, vue semaine, résumé KPI en accueil, suppression de `/admin/signup` (il faut d'abord un processus d'invitation).

**Anti-fonctionnalités :** CRM, analytics maison, éditeur de rôles, glisser-déposer de la carte, messagerie dans l'admin, édition de la newsletter.

| Page | Verdict |
|------|---------|
| Tableau de bord | Remplacé par « Aujourd'hui » |
| Réservations | Conservée, très simplifiée |
| Tables | Supprimée |
| Carte | Deux niveaux fusionnés en un écran |
| Horaires + Annonces + Réglages | Fusionnés en « Ouverture et capacité » |
| Avis + KPI | Regroupés en « Réputation » ; KPI isolé, non refait en profondeur |

Navigation proposée (2 niveaux max) : Aujourd'hui/Réservations, Carte, Site public, Réputation.

### Architecture (ARCHITECTURE.md)

- Shell dans un route group `src/app/admin/(app)/layout.tsx` (Server Component qui lit l'utilisateur et rend un `AdminShell` client). Login et signup restent sans shell, les URL ne changent pas.
- Un seul `nav.ts` typé alimente barre latérale, barre du bas et cartes d'accueil (le doublon codé en dur a causé le lien mort vers `/admin/tables`).
- Auth inchangée (middleware, `requireAdmin()`, RLS). Mutations sur les routes REST existantes.
- Fetch : Server Components pour les pages en lecture (accueil, kpi, avis) ; hook `useAdminQuery`/`adminFetch` avec abort pour les pages interactives.
- Logique pure extraite dans `src/utils/` (`reservation-status`, `reservation-view`) pour être testable sous Vitest (env node).

**Suppression des tables, appelants avant appelés, tests verts à chaque commit :** (1) test de contrat « réservation et disponibilité ne référencent aucun objet table » ; (2) retirer les appelants UI ; (3) supprimer `/api/tables/*` avec les entrées des tests de garde ; (4) supprimer les types ; (5) renommer les réglages ; (6) docs ; (7) aucune migration de suppression.

### Critical Pitfalls (PITFALLS.md)

1. **Les tests qui lisent le source cassent le build** (`npm run build` lance Vitest d'abord) : liste d'impact des tests d'abord, suppression des entrées dans le même commit que les routes, test de garde admin qui énumère dynamiquement, test négatif « `/api/tables` et `/admin/tables` n'existent plus », découpler `review-badges` des classes Tailwind.
2. **`table_block_duration_minutes` n'est pas du code « table »** : il pilote `reservation-rules.ts` et la RPC de capacité. Changer l'étiquette seulement ; test de fumée : réserver jusqu'à 40 couverts, puis un de plus.
3. **Régression du workflow de statuts** (emails de confirmation/annulation, cron J+1, couverts KPI) : machine à statuts et `PUT /api/reservations` figés, helper de statut testé, boutons désactivés pendant la requête, UAT manuelle sur preview.
4. **Admin à moitié migré en production** : ordre des phases ci-dessous, une PR par page, validation propriétaire sur preview, test de liens, URL stables.
5. **Politiques `using (true)` de lecture publique restées sur les tables orphelines** (`gecko_table_assignments` expose des horaires de réservation) : migration « revoke seulement » à proposer, sur accord du propriétaire et après vérification qu'aucune autre application du projet Supabase partagé ne les lit ; sinon dette explicite.

Autres : cibles tactiles 44 px, dialogues accessibles, statut jamais porté par la seule couleur, portée des tokens Tailwind v4 et classes non concaténées, erreurs de lint React Compiler, dérive des skills de design hors du brief « outil de travail sobre » (rédiger un brief admin d'une page), affichage horaire sans conversion (Krabi UTC+7), sécurité d'envoi KPI (live interdit avant le 2026-11-16, envois à des tiers sur accord du propriétaire).

## Implications for Roadmap

Divergence d'ordre : ARCHITECTURE refait les réservations en premier, PITFALLS en dernier. Résolution : valider les patterns de formulaire et d'état sur de petites pages, puis traiter Réservations avec « Aujourd'hui » comme pièce centrale ; Réputation après.

**Phases suggérées (8) :**

1. **Audit et validation propriétaire** (sans code) : verdicts par page, structure de navigation, brief de design admin, liste d'impact des tests.
2. **Suppression des tables** : test de contrat, appelants UI, routes, types, tests de garde, réglages renommés, docs, test négatif. Migration de révocation optionnelle sur accord.
3. **Fondation design** : spike Base UI, tokens `--adm-*`, primitives et états, `useAdminQuery`, helper `reservation-status` testé, page kit interne à 360/768/1024/1440 px.
4. **Shell et navigation** : route group via `git mv` (grep des chemins admin codés en dur avant), `AdminShell`, `nav.ts`, `PageHeader`, login/signup sans shell, test de liens.
5. **Site public : Horaires + Annonces + Capacité** : faible risque, valide formulaire, toast et confirmation.
6. **Carte** : éditeur en un écran (prix, disponibilité, ajout rapide), `revalidateTag` conservé, chaînes figées par le test menu conservées.
7. **Réservations et « Aujourd'hui »** : liste dense, actions de statut via le helper, navigation par date, recherche, « + Réservation », indicateur de capacité par créneau ; fusion hors service (12h–22h Krabi), UAT sur preview.
8. **Réputation (Avis + KPI) et QA finale** : regroupement, retrait de la saisie manuelle des totaux seulement si l'audit confirme que la source KPI les couvre, libellés TEST/live conservés, passe accessibilité et responsive, garde-fou sur les anciens tokens.

Si le temps manque (haute saison au 1er novembre) : livrer d'abord 2, 3, 4 et 7 ; le shell rend les autres pages livrables indépendamment.

**Drapeaux de recherche :** phase 3 (docs Base UI Toast/Select/AlertDialog via Context7, compatibilité React Compiler) ; phase 7 (statuts, liste mobile, calcul de capacité par créneau) ; migration de politiques en phase 2 (accord propriétaire, vérification Supabase). Phases 2 (code), 4, 5, 6, 8 : patterns standard, lire le test « wiring » concerné avant d'éditer.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Versions vérifiées (`npm view`). Adéquation Base UI et Compiler non vérifiées dans les docs. |
| Features | MEDIUM | Audit du code HIGH ; benchmarks de connaissance générale ; verdicts à valider par le propriétaire. |
| Architecture | HIGH | Indépendance des tables lue dans le code et la migration 008 ; choix de shell et composants = jugement. |
| Pitfalls | HIGH (code) / MEDIUM (générique) | Couplage des tests et pièges de nommage vérifiés par grep. |

## Gaps to Address

- Usage réel de l'admin (pas de télémétrie) : interroger la cheffe et les serveurs pendant l'audit.
- Totaux d'avis saisis à la main : vérifier si `gecko_review_totals` alimente le rapport avant de retirer le formulaire.
- « Complet ce soir » : modèle de données à décider (exception d'horaires spéciaux ou plafond ponctuel). Hors MVP.
- `/admin/signup` : inspecter le flux et définir un processus d'invitation avant suppression.
- Chemins `src/app/admin/**` codés en dur (tests, scripts, config Sentry) : grep avant le `git mv`.
- Politiques de lecture publique sur `gecko_table*` : décision propriétaire + vérification inter-applications.
- Palette admin : neutre ou accent de marque `--gc-jungle`, à trancher dans le brief.

---
*Synthèse écrite par l'orchestrateur à partir de STACK, FEATURES, ARCHITECTURE et PITFALLS.*
