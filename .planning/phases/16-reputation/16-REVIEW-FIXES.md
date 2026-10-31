# Corrections des findings d'audit P14 (Carte) et P16 (Réputation)

Date : 2026-10-31. Branche `fix/p14-p16-audit` (depuis `milestone/v1.1`, `b685cc4`). Source : `16-AUDIT.md`.
Commits : `1288fb1` (réputation), `cddcdc2` (carte), `e49f5ed` (stabilité du gate). Fusion de `milestone/v1.1` : `0799ba0`.

## Dispositions

| Finding | Disposition | Hash |
|---|---|---|
| F-H1 pastille TEST/live déduite du dernier rapport | Corrigé. `GET /api/kpi` renvoie `mode` (`resolveReportMode(KPI_REPORT_MODE)`, lecture seule, sans autre effet) ; l'écran l'affiche. Mode inconnu (chargement, erreur, champ absent) : badge neutre « mode inconnu », ni « TEST » ni « live verrouillé ». Libellés TEST / live conservés. Tests : route (6 valeurs de l'env) et rendu des 3 états | `1288fb1` |
| F-M1 course de réordonnancement | Corrigé. Un seul réordonnancement à la fois (flèches `aria-disabled`, focus conservé, clics ignorés) ; retour arrière qui rétablit l'ordre sans écraser le contenu des plats ; à l'échec, rechargement de l'état serveur (la copie locale est rattachée à la réponse serveur qui lui sert de base, donc un rechargement la remplace). Corrige aussi la basse n°3 (refetch ignoré). Tests + preuve navigateur | `cddcdc2` |
| F-M6 double Entrée | Corrigé. Verrou synchrone (`createSubmitLock`) sur l'ajout, les détails et la catégorie ; Entrée répétée = 1 seul POST. Tests + preuve | `cddcdc2` |
| F-M7 toast sur « Réorganiser » / « Ajouter un plat » | Corrigé. Tant qu'un toast d'erreur persistant chevauche ces actions (ordinateur), le contenu descend (`useToastClearance`, `--mn-toast-clear`) ; aucun saut pour les toasts de succès, ni quand la page est défilée, ni sur téléphone (actions masquées). Mesures ci-dessous | `cddcdc2` |
| F-M3 prix 0 | Corrigé côté écran : seuls les prix strictement positifs sont acceptés, message « Entrez un prix supérieur à 0, ou laissez vide pour ne pas afficher de prix. ». Bugs d'API documentés plus bas (routes non modifiées) | `cddcdc2` |
| F-M2 date du 2026-11-16 | Corrigé (libellé). « Date indicative : repère du 2026-11-16 (horloge de ce poste, non vérifié par le serveur : seul le réglage serveur décide) ». La phrase de garde du propriétaire (`GUARD_PHRASE`) est inchangée | `1288fb1` |
| F-M4 textes périmés | Corrigés (voir « Source des totaux »). Les saisies manuelles ne sont PAS retirées | `1288fb1` |
| F-M5 stabilité du gate | Timeout global 30 s déjà en place (vérifié). Mais il restait un vrai aléa, sans rapport avec le délai : `admin-nav-single-source` lisait parfois le vrai NAV (1 à 2 échecs sur environ 3 passes complètes sur 8, y compris dans `npm run build`). Cause : mock par `vi.doMock` + `resetModules` + imports dynamiques. Remplacé par un mock hoisted à getter. 10 passes complètes sur 10, puis `npm run build` complet 3 fois sur 3 | `e49f5ed` |
| Basse 1 nom accessible du Switch | Corrigé : « Disponible, Tom Kha Gai » (commence par le texte visible, WCAG 2.5.3). `Button` laisse maintenant passer `aria-disabled` | `cddcdc2` |
| Basse 2 `setTimeout` non nettoyé | Corrigé (ItemRow) | `cddcdc2` |
| Basse 3 refetch ignoré | Corrigé avec F-M1 | `cddcdc2` |
| Basse 4 route `reorder` | Documenté, non modifié (`src/app/api/menu/**` hors périmètre) | - |
| Basse 5 `KpiPanel.submit` sans garde | Corrigé (`if (saving) return`) | `1288fb1` |
| Basse 6 règle du dialogue lue du client | Documenté, non modifié : cas étroit (administrateur unique, onglet périmé) ; la clé d'idempotence côté serveur évite le double envoi | - |
| Basse 7 brouillon et erreur de champ | Corrigé : un brouillon par mois, erreur rattachée au champ en cause (erreur serveur sous le formulaire) | `1288fb1` |
| Basse 8 titre « Note et totaux » | Corrigé : « Totaux d'avis » | `1288fb1` |
| Basse 9 `review-badges` | Corrigé : `grep` fait, le seul consommateur (`ReservationDetails.tsx`) lit `label` et `title` ; `className` et `BASE` supprimés (le type garde `tone`) | `1288fb1` |

## Bugs d'API préexistants à connaître (non corrigés ici)

1. `POST /api/menu/items` (`items/route.ts:87`) : `price: price || null` transforme un prix 0 en `null`, alors que `PUT` conserve 0. L'écran n'accepte plus 0, donc le cas ne se présente pas par l'interface. Correctif de route suggéré : `price ?? null`.
2. Le premier `display_order` créé vaut 1 (`items`, `categories`, `pages` : `(max?.display_order || 0) + 1`), alors que `reorder` renumérote à partir de 0 ; `.single()` sur table vide masque une erreur. Sans effet visible sur l'ordre. Suggéré : `maxOrder ? maxOrder.display_order + 1 : 0` avec `.maybeSingle()`.
3. `reorder` : `type` inconnu retombe sur `gecko_menu_items`, `items` non validés, boucle d'`UPDATE` sans transaction (échec partiel possible). Derrière `requireAdmin`. L'écran se recale maintenant sur le serveur après un échec.

## Source des totaux d'avis (décision du propriétaire)

Il existe deux sources distinctes, non réconciliées :

- **Collecte KPI** (`gecko_weekly_kpis.google_reviews_total`, hebdomadaire). Remplie le lundi par l'API Places seulement si la semaine n'a pas encore de total. Une saisie manuelle déjà présente n'est jamais écrasée par la collecte (`kpi-sources.ts`). La saisie manuelle de la semaine (PUT `/api/kpi`) écrase la valeur à tout moment, sans trace de l'origine hormis `manual_updated_at`. C'est cette valeur qui alimente le rapport KPI.
- **Saisie mensuelle** (`gecko_review_monthly_totals`, Google et TripAdvisor, page Avis). Purement manuelle, lue par l'écran Avis et `/api/review/stats` uniquement.

Si les deux diffèrent : aucune comparaison ni alerte. Chaque écran affiche sa propre source ; le rapport KPI utilise la valeur hebdomadaire, l'écran Avis la valeur mensuelle. Correction à l'audit : `tripadvisor_total` n'est PAS un nombre d'avis, c'est le nombre de restaurants du classement (« n°14 sur N »). La collecte TripAdvisor ne fournit donc que le rang ; le nombre d'avis TripAdvisor reste de la saisie manuelle uniquement (aucune source automatique). Seul le total Google est en double.

À trancher : (a) garder les deux saisies telles quelles (état actuel, textes maintenant exacts) ; (b) retirer la saisie mensuelle Google et lire la source KPI ; (c) afficher l'origine (collecte / saisi) de chaque total. Recommandation : (b) pour Google seulement, TripAdvisor reste manuel.

## Preuves navigateur (Chromium headless, `next dev` port 3116, route temporaire hors matcher non commitée et retirée, API simulée)

Serveur arrêté par le PID qui écoutait sur 3116. Zéro envoi réel.

- F-M1 : requête 1 échoue après 800 ms ; pendant l'attente les flèches sont `aria-disabled="true"` et le focus reste sur la flèche cliquée ; un 2e clic forcé n'envoie rien (1 seul POST reorder) ; après l'échec l'écran = la base (`Alpha,Beta,Gamma`) ; clic réussi ensuite : écran = base (`Beta,Alpha,Gamma`) ; flèches réactivées.
- F-M6 : Entrée, Entrée, Entrée maintenue dans « Nom » puis dans « Prix » : 1 seul POST (aucune garde avant : 2).
- F-M3 : `0` en ligne : aucun PUT + message ; `0` à l'ajout : aucun POST + message.
- F-M7 (mesure y de « Ajouter un plat », toast d'erreur affiché) : 1440 px, avant : toast y 72-170 sur boutons y 125 (recouvrement x et y, bouton non cliquable) ; après : boutons y 179, aucun recouvrement, « Réorganiser » cliquable. Au repos y 125, avec toast de succès y 125, après fermeture de l'erreur y 125. 390 px : pas de recouvrement avant ni après (actions d'en-tête masquées ; « Réorganiser » y 343, « Ajouter un plat » y 724).
- F-H1 (1440 et 390) : serveur test : « TEST » + « live verrouillé » ; serveur live sans aucun rapport live : « live » (le défaut d'origine affichait TEST) ; champ absent, API en erreur, chargement : « mode inconnu », sans « live verrouillé » ; 0 requête non GET.
- F-M2/F-M4 : textes affichés tels que corrigés ; erreur TripAdvisor sous TripAdvisor ; brouillon conservé en changeant de mois.

## Gate

`npx vitest run` 1861 verts, 1 sauté (10 passes complètes sur 10 après correction) ; `npx tsc --noEmit` 0 erreur ; `npm run lint` 0 erreur, 2 avertissements préexistants ; `npm run build` complet (vitest + `next build`, variables publiques factices) 3 fois sur 3, Turbopack et polices Google OK dans ce worktree.

## Non prouvé

Garde admin, RLS et base réelle (API simulée) ; effet réel de `revalidateTag` ; lecteur d'écran ; téléphone réel ; `KPI_REPORT_MODE` réel en production (le champ `mode` est testé, pas la variable d'un déploiement) ; l'aléa de `admin-nav-single-source` est supprimé sur 10 passes, pas démontré impossible.
