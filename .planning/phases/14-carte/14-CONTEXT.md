# Phase 14 : Carte, CONTEXT

Date : 2026-10-31. Branche : `phase/14-carte` (depuis `milestone/v1.1`, tête « merge: phase 12 shell and navigation »). Exigences : MENU-01, MENU-02.
Références : `d3-site-menu/D3-DESIGN-CONTRACT.md` (§2.2 Carte, §3 états, §4 libellés figés, §7 accessibilité, §10) et les maquettes `carte*.html` ; `RECONCILIATION.md`, `OPEN-QUESTIONS.md` ; `09-AUDIT.md` §2.4-2.5 ; `09-TEST-IMPACT.md` (test n° 3) ; `12-CONTEXT.md`.

## Décisions du propriétaire (2026-10-31) appliquées

- Direction « luxe discret » validée (titre de page serif, filet laiton, filets 1 px, pas d'ombre sur les lignes).
- La cheffe édite depuis son téléphone : ligne de plat compacte avec « Détails », **toast en haut**, **flèches haut/bas** (aucun glisser-déposer), cibles 44 px.
- Prix en **bahts (฿)** partout dans l'admin carte (même format que le site public : `formatPrice` de `src/utils/menu.ts`).
- `price_label` (libellé de prix alternatif) conservé : champ « Libellé de prix » dans Détails, rappelé en lecture sur la ligne.
- Gestion des pages de carte (créer, renommer, adresse, afficher/masquer, ordre, supprimer) repliée sous « Gérer les pages ».

## Décisions d'implémentation

- **D-01 (MENU-01) un seul écran** : `src/components/admin/menu/MenuScreen.tsx` (client). `/admin/menu` le rend ; `/admin/menu/[pageId]` (fichier conservé, le test de liens vérifie son existence) le rend positionné sur cette page de carte (`initialPageId`, repli sur la première page si l'identifiant est inconnu). Aucune navigation pour modifier un prix, basculer une disponibilité ou ajouter un plat.
- **D-02 découpage** (nouveaux fichiers, tous sous `src/components/admin/menu/`) : `menu-logic.ts` (logique pure testée : prix ฿, réordonnancement, arbre immuable, `runOptimistic`, recherche, charges utiles), `useMenuData.ts` (chargement via `useAdminQuery`, toutes les écritures via `adminFetch` vers `/api/menu/*`), `ItemRow.tsx`, `Switch.tsx`, `Sheet.tsx` (Base UI Dialog), `ItemSheet.tsx` (ajout rapide + Détails), `CategorySheet.tsx`, `PagesManager.tsx`, `menu.css` (classes `.mn-*`).
- **D-03 écritures** : prix = `PUT /api/menu/items {id, price}` (enregistré à Entrée ou « Valider » ; **pas** optimiste : la saisie reste affichée jusqu'à la réponse, échec = saisie conservée) ; disponibilité = `PUT {id, is_available}` **optimiste** avec retour arrière précis (`runOptimistic` : l'inverse exact de la modification, jamais un instantané qui écraserait une autre édition) ; ajout = `POST` ; réordonner = `POST /api/menu/reorder` optimiste avec retour de la liste concernée. L'état local suit le serveur sans rechargement (la réponse du `POST` ajoute la ligne).
- **D-04 MENU-02** : les routes `src/app/api/menu/**` ne sont **pas modifiées** (compteurs `revalidateTag(MENU_TAG, 'max')` 3/3/3/1 inchangés). L'écran n'écrit que par elles. Preuve : `tests/menu-admin-cache.test.ts` exécute les vrais gestionnaires (Supabase simulé).
- **D-05 test `menu-admin-wiring`** : la moitié « routes » est intacte. La moitié « page admin » lisait `menu/[pageId]/page.tsx` ; ce fichier ne contient plus que `<MenuScreen initialPageId=…/>`. Mêmes assertions, déplacées vers les fichiers qui portent désormais les chaînes : `is_gluten_free: itemForm.is_gluten_free` et `item.is_gluten_free ?? false` dans `menu-logic.ts` (paramètre nommé `itemForm`, fonction `itemToForm(item)`), libellé `Sans gluten (confirmé par la cheffe)` dans `ItemSheet.tsx`. Ajouts : la feuille utilise bien `itemToForm(item)`, `data.updateItem(item.id, itemForm`, `checked={itemForm.is_gluten_free}` ; les deux adresses rendent `MenuScreen`.
- **D-06 `confirm()` natifs** : les 3 de la carte (page, catégorie, plat) deviennent `useConfirm()` (suppression de plat, de catégorie, de page ; fermeture de feuille avec saisie). Le cliquet `tests/admin-ui-confirm.test.ts` perd les entrées `menu/page.tsx` (1) et `menu/[pageId]/page.tsx` (2). Aucune nouvelle dépendance.
- **D-07 toast en haut (fichier partagé)** : le toast P11 est en bas (12 px au-dessus de la barre du bas). Au montage, `MenuScreen` pose `data-adm-toast="top"` sur `<body>` (retiré au démontage) et `menu.css` repositionne le conteneur et les transformations d'empilement du toast sous l'en-tête. **Les autres écrans gardent le bas** ; aucun fichier de la primitive Toast ni `admin.css` n'est touché. Si le propriétaire généralise « toast en haut », déplacer ce bloc CSS dans `admin.css`.
- **D-08 feuilles** : `Sheet` = Base UI Dialog (bas d'écran < 768, panneau droit 460 px ensuite), clic sur le fond désactivé (`disablePointerDismissal`) pour ne jamais perdre une saisie par un tap raté ; Échap et la croix demandent la fermeture : directe, ou `useConfirm` « Fermer sans enregistrer ? » (Rester ici) s'il y a une saisie. Un échec d'enregistrement garde la feuille ouverte avec une alerte en ligne (le toast d'erreur est caché derrière la feuille modale), champs inchangés.
- **D-09 catégories** : en-tête = `<h2><button aria-expanded>` (un titre ne peut pas contenir un bouton, la maquette l'avait inversé), repliables, toutes ouvertes par défaut (fidèle à `carte.html`). « Options de la catégorie » (renommer, supprimer) est une feuille plutôt qu'un menu volant. « Ajouter une catégorie » en pied de liste et dans l'état vide.
- **D-10 recherche** : insensible à la casse et aux accents, sur le nom et la description ; désactivée pendant « Réorganiser » (les rangs se calculent sur la liste complète).
- **D-11 `price` vide** : valider un champ vide enregistre « aucun prix » (`null`), utile avec un libellé de prix ; le bouton « Valider » rend l'action explicite.

## Écarts à la maquette / au contrat (assumés)

- Le toast d'erreur n'a pas de bouton « Réessayer » (la primitive Toast P11 n'en a pas) : « Réessayer » est dans la ligne (prix) et le bouton de la feuille (ajout, détails) ; l'interrupteur revient seul à sa position.
- Les noms accessibles des interrupteurs suivent le contrat (« Disponibilité de X »), qui ne contient pas le mot visible « Disponible » (critère 2.5.3 « label in name » non satisfait à la lettre). À trancher avec D3 si le propriétaire veut la lettre du critère.
- Focus initial d'une feuille : premier champ du DOM (la liste « Catégorie » dans l'ajout rapide).
- Le menu « Options de la catégorie » est une feuille, pas un menu contextuel.
- Pas d'état « Enregistré » après un succès d'ajout/détails dans la ligne : le toast et l'apparition de la ligne tiennent lieu de retour.
- Le glisser-déposer n'est pas reproduit, même ≥ 768 px (option du contrat, hors périmètre REQUIREMENTS).

## Bugs ou remarques sur les routes (non modifiées, à rapporter)

- `POST /api/menu/items` : `price: price || null` transforme un prix `0` en `null` (un plat offert devient « sans prix »). Sans conséquence pour la carte actuelle.
- `POST /api/menu/items` : `display_order` = `(max || 0) + 1` ; sur une catégorie vide, le premier plat reçoit 1 (pas 0). Sans effet visible (tri par rang).
- `GET /api/menu/pages` et `GET /api/menu/items` ne sont pas protégées par `requireAdmin` (lecture publique, RLS) : voulu pour le site public, mais l'écran admin lit les plats indisponibles par ce chemin (la RLS décide).
- Les messages d'erreur serveur sont en anglais (« Internal server error ») ; l'écran ne les affiche jamais (`readableError` les remplace par une phrase française).

## Fichiers partagés touchés

Aucun fichier partagé n'est modifié (`nav.ts`, `admin.css`, primitives, shell, layout `(app)` inchangés). Fichiers existants modifiés : `src/app/admin/(app)/menu/page.tsx` et `menu/[pageId]/page.tsx` (propres à la phase), `tests/menu-admin-wiring.test.ts`, `tests/admin-ui-confirm.test.ts` (cliquet).
