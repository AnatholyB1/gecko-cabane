# Audit phases 14 (Carte) et 16 (Réputation) : revue, sécurité, objectifs

Date : 2026-10-31. Branche `audit/p14-p16` (depuis `milestone/v1.1`, tête `672f0aa docs: v1.1 run log`, un commit docs après `a399cdf test(admin-nav): longer timeout…` attendu). Lecture seule sur le code ; seul ce fichier est écrit.
Périmètre : `src/components/admin/menu/**`, `src/app/admin/(app)/{menu,avis,kpi,reputation}/**`, `src/components/admin/reputation/**`, `src/utils/review-badges.ts`, tests associés, routes `/api/menu/*` et `/api/kpi` (lues pour juger les écrans).

## Gate (exécuté)

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur, 3 avertissements (préexistants, hors périmètre) |
| `npx vitest run` | 1779 verts, 1 sauté, **2 échecs à froid** (`admin-nav-single-source` retirer une entrée ; `admin-shell` NAV-02, délai 5 s). Chacun repasse seul (27/27 puis 19/19). Voir F-M5 |
| `npx next build` | 1re passe en échec (Turbopack, `next/font/google` : récupération des polices, transitoire réseau) ; 2e passe OK, exit 0 |

## Preuves navigateur réelles (build + `next start` port 3114)

Route temporaire `/gcm/audit/[v]` (hors matcher, shell réel, API simulée par `page.route`, NON commitée, retirée). Chromium 1440x900 (avis à 390x844). Serveur arrêté par le PID qui écoutait sur 3114.

- Avis/KPI : 0 requête non GET à l'ouverture, au changement de semaine ; les segments sont des liens `/admin/avis`, `/admin/kpi` sans gestionnaire. Dialogue d'alerte : 0 PUT à l'ouverture, 0 après Échap, 0 après Annuler ; 1 PUT après confirmation. Avis vide à 390 px : pas de débordement, aucune « note moyenne ».
- Carte : prix `0` envoyé en PUT `{id, price: 0}`.
- Défauts constatés (détail plus bas) : course de réordonnancement (UI et base divergent), double Entrée = 2 POST, toast d'erreur sur les boutons d'en-tête.

## Ce que le proxy ne prouve pas
Garde admin (middleware, `requireAdmin`, RLS), base réelle (contrat des routes lu dans le code), envoi réel d'emails (Resend jamais appelé), mode live réel du serveur (`KPI_REPORT_MODE`), lecteur d'écran, vrai téléphone, effet réel de `revalidateTag` sur `/menu`.

## Verdict par exigence

| Exigence | Verdict | Raison |
|---|---|---|
| MENU-01 | PARTIAL | Fonctions présentes et prouvées (prix en ligne, interrupteur, ajout, flèches, états, ฿). Mais 2 défauts de cohérence d'état (course de réordonnancement, double envoi à Entrée) et 1 défaut d'a11y (toast d'erreur sur les actions) |
| MENU-02 | VERIFIED | `revalidateTag` appelé aux 3/3/3/1 endroits, routes inchangées, libellé « Sans gluten (confirmé par la cheffe) » et booléen `is_gluten_free` conservés (lecture du code et test). Prix 0 : voir F-M3 (bug préexistant de l'API) |
| REP-01 | VERIFIED | Un h1, deux segments, trois URL = mêmes composants, états chargement/vide/erreur. Hors-sujet : revendication « toast en haut » exacte (mesuré y=72) |
| REP-02 | PARTIAL | Aucun envoi par affichage/effet/onglet/`?` (prouvé). Dialogue correct (prouvé). Mais la pastille TEST/live est déduite du dernier rapport (F-H1) et la date 2026-11-16 n'est appliquée par aucun code serveur (F-M2) |
| REP-03 | HUMAN_NEEDED | La saisie est gardée, mais la prémisse de CONTEXT D-05 (« pas de TripAdvisor automatique ») est périmée : la collecte hebdo remplit désormais `tripadvisor_total` et `google_reviews_total` (F-M4). Décision propriétaire : conserver, ou retirer et lire la source KPI |

## Findings (SEV | fichier:ligne | problème | correctif)

### Haute
- **F-H1 | HAUTE | `src/components/admin/reputation/kpi-guard.ts:57-61` (`reportModeOf`), `KpiPanel.tsx:52-79,271` | La pastille « TEST » et le texte « live verrouillé » sont DÉDUITS du dernier rapport envoyé, jamais du réglage serveur. Sondé : aucun rapport -> TEST ; erreur API -> TEST (avec « — / 2 »). Si le serveur passe `KPI_REPORT_MODE=live` avant le premier envoi live, l'écran affiche encore « TEST » et « Le mode live n'est jamais activable depuis cette page ». Le faux rassurant va dans le sens dangereux (propriétaire croit verrouillé). Le code de P16 l'admet (« TEST par défaut ») mais l'UI l'affirme sans réserve | Exposer le mode serveur par `GET /api/kpi` (`mode: resolveReportMode(process.env.KPI_REPORT_MODE)`, lecture seule) et l'afficher ; à défaut, libeller « Dernier rapport envoyé : TEST » et « Mode serveur : non lu » quand il n'y a pas de rapport ou en erreur**

### Moyenne
- **F-M1 | MOYENNE | `src/components/admin/menu/useMenuData.ts:136-181` (+ `menu-logic.ts:209-228`) | Course de réordonnancement, prouvée. Les flèches ne sont pas désactivées pendant la requête. Clic 1 (échoue après 800 ms), clic 2 (réussit) : l'UI revient à `[Alpha,Beta,Gamma]` (`backward` = instantané `before`), la base a `[Beta,Gamma,Alpha]`. Le commentaire de `runOptimistic` promet « l'inverse précis, pas un instantané », ce que `moveItem/moveCategory/movePage` ne respectent pas. Le même instantané écrase aussi une bascule de disponibilité faite entre-temps dans la catégorie. La route `reorder` boucle sans transaction : deux requêtes qui se chevauchent entrelacent leurs `UPDATE` | Sérialiser les écritures de réordonnancement (file ou `busy` par liste qui désactive les flèches) et, à l'échec, recharger l'état serveur (`refetch`) plutôt que restaurer un instantané ; côté route, un seul `upsert` ou une fonction RPC transactionnelle**
- **F-M2 | MOYENNE | `src/app/api/cron/weekly-kpi/route.ts:254`, `src/utils/kpi-mode.ts:12`, `kpi-guard.ts:13-14` | « Aucun envoi live avant le 2026-11-16 » n'est qu'un libellé. Aucune comparaison de date côté serveur : seul `KPI_REPORT_MODE=live` décide. La garde repose donc sur la discipline de réglage, pas sur le code ; l'écran (liste « Date : rempli » via `krabiToday()` sur l'horloge du navigateur) ne contraint rien | Ajouter dans `resolveReportMode` un plancher de date (live ignoré avant `2026-11-16`) ou assumer et dire sur l'écran que la date est indicative ; ne pas calculer « Date : rempli » sur l'horloge du poste**
- **F-M3 | MOYENNE | `src/app/api/menu/items/route.ts:87` | Préexistant (non introduit par P14, `git diff milestone/v1.1 -- src/app/api` vide). `POST` fait `price: price || null` : un prix `0` est stocké `null`, alors que `PUT` conserve `0` (`if (price !== undefined) updateData.price = price`). L'écran accepte `0` (`parsePriceInput("0")` = 0) : « Ajouter » 0 ฿ donne « sans prix », « Valider » 0 ฿ en ligne donne 0. Le premier `display_order` vaut 1 (`items/route.ts:79`, `categories/route.ts:69`, `pages/route.ts:70` : `(max?.display_order \|\| 0) + 1`) alors que `reorder` renumérote de 0 : sans conséquence d'ordre, mais incohérent et le `.single()` sur table vide masque une erreur | `price: price ?? null` ; `maxOrder ? maxOrder.display_order + 1 : 0` avec `.maybeSingle()`. Tant que la route n'est pas corrigée, refuser `0` dans l'écran ou le documenter**
- **F-M4 | MOYENNE | `ReviewsPanel.tsx:245`, `KpiPanel.tsx:230`, `16-CONTEXT.md` D-05 | Textes périmés : « TripAdvisor n'est pas collecté automatiquement » est faux depuis `c4657fc..ed048a5` (collecte `tripadvisor_rank`/`tripadvisor_total`) ; « Avis Google (hors collecte automatique) » est faux depuis `d23dbdd`/`53c5731` (Places). La table `gecko_review_monthly_totals` (saisie mensuelle) et `gecko_weekly_kpis.google_reviews_total` (auto + saisie) sont deux sources non réconciliées pour le même chiffre. REP-03 (« retiré seulement si la source KPI la remplace et que rien d'autre ne la lit ») : seul `ReviewsPanel` et `api/review/stats` lisent les totaux mensuels, donc la condition est remplie pour TripAdvisor/Google côté KPI, mais n'a pas été ré-auditée | Décision propriétaire (REP-03), puis corriger les deux phrases ou retirer la saisie ; afficher l'origine (auto/saisi) de chaque total**
- **F-M5 | MOYENNE | `tests/admin-shell.test.ts:54`, `tests/admin-nav-single-source.test.ts:86-93` | Le gate n'est pas stable : 2 échecs à froid dans la même passe (délai 5 s, import dynamique), verts isolés. Comme `npm run build` exécute `vitest run`, un build de production peut échouer au hasard. Le dernier commit n'a allongé le délai que pour un test | Mettre `testTimeout`/`hookTimeout` à 30 s dans `vitest.config.ts` plutôt que test par test**
- **F-M6 | MOYENNE | `ItemSheet.tsx:74-101,137-139,152-154` | Double envoi, prouvé (2 POST). `Entrée` dans « Nom » ou « Prix » appelle `submit(false)` sans garde `busy` ; `readOnly={busy}` ne bloque pas la touche (ni la répétition de touche). Résultat : deux plats identiques (aucune unicité de nom). Les boutons, eux, sont désactivés | `if (saving) return` en tête de `submit`**
- **F-M7 | MOYENNE (a11y) | `Toast.tsx:55`, `menu.css:9-14`, `MenuScreen.tsx:30-35` | Mesuré à 1440 px : le toast d'erreur (persistant, `timeout: 0`) couvre « Réorganiser » et « Ajouter un plat » (recouvrement x et y confirmé). Un échec de réordonnancement ou de prix bloque donc les deux actions de l'en-tête jusqu'à fermeture (WCAG 2.4.11 focus non masqué ; 44 px dû à la croix seulement). P14 le signale sans le corriger | Placer le toast en bas sur la carte, ou hors de la zone d'actions (sous l'en-tête), ou fermer à l'action suivante**

### Basses (9)
1. `Switch.tsx:37` + `ItemRow.tsx:115` : nom accessible « Disponibilité de X » ne contient pas le texte visible « Disponible/Indisponible » (WCAG 2.5.3 étiquette dans le nom).
2. `ItemRow.tsx:62` : `window.setTimeout` non nettoyé après démontage (mise à jour d'état sur composant démonté, sans effet visible).
3. `useMenuData.ts:44` : `local ?? query.data` : après la première écriture, un `refetch` serveur est ignoré (états périmés si un second poste modifie la carte) ; `refetch` n'est utilisé qu'à l'erreur initiale.
4. `reorder/route.ts:26-33` : `type` inconnu retombe sur `gecko_menu_items` ; `items` non validés (id, `display_order`) ; échec partiel laisse un ordre à moitié appliqué (préexistant, derrière `requireAdmin`).
5. `KpiPanel.tsx:162` : `submit` sans garde `saving` ; sondé : Entrée pendant l'envoi ne fait pas de 2e PUT ici (1 PUT), et l'email porte une clé d'idempotence (`api/kpi/route.ts` `kpi-lowrating-{semaine}-{note}`), donc pas de double alerte.
6. `KpiPanel.tsx:160`, `kpi-guard.ts:104` : la règle du dialogue lit `row.google_min_rating` du client ; si la donnée est périmée (autre onglet), le serveur peut alerter sans dialogue (cas étroit, administrateur unique).
7. `ReviewsPanel.tsx:106-109,260` : changer de mois avec une saisie non enregistrée écrase silencieusement le brouillon précédent ; `fieldError` s'affiche sous « Google » même si le champ en cause est TripAdvisor et n'est pas effacé au changement de mois.
8. `ReviewsPanel.tsx:180` : le titre « Note et totaux » promet une note qui n'existe pas (aucun chiffre inventé, c'est correct, mais le titre induit en erreur).
9. `review-badges.ts:11-13` : `className` (Tailwind gris/bleu/ambre) est du code mort pour l'admin actuel : seul `ReservationDetails.tsx:44` appelle `getReviewBadges` ; vérifier qu'il ne lit que `tone` (sinon le garder). À supprimer avec le champ `BASE`, ou à garder tant qu'un écran le lit.

## Sondes propres (confirmées sans défaut)
- Aucun envoi à l'affichage, à l'effet, au changement de semaine ou de segment ; `?vue=` n'accepte que `kpi`, tout autre (dont `?send=1`) donne Avis ; le seul `PUT` d'alerte passe par `submitManualEntry` avec confirmation préalable ; Échap et Annuler n'écrivent rien ; un seul PUT après confirmation.
- Libellés conservés : « Rapports TEST envoyés : N / 2 », phrase de garde, « Passage en live : décision du propriétaire… », « Saisie enregistrée — alerte envoyée au propriétaire ».
- Liens d'emails `/admin/kpi` et `/admin/avis` rendent toujours la vue (`SITE_URL/admin/kpi` dans `api/kpi/route.ts`).
- Note moyenne : aucune affichée, aucun chiffre inventé ; valeur absente = « — » (jamais 0).
- Carte : `revalidateTag` toujours présent ; ฿ jamais €, aucun `confirm()` natif ; échec de prix/ajout/détails conserve la saisie et affiche une alerte ; suppression avec `alertdialog` (focus initial sur l'action non destructrice).
- Statut jamais par la couleur seule (mot de l'interrupteur, icônes + texte des avis, `sr-only` des écarts).
- Cibles : segments, onglets, boutons de semaine à `--adm-target`.
