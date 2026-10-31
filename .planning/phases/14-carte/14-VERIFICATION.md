# Phase 14 : Carte, VERIFICATION

Date : 2026-10-31. Branche `phase/14-carte`. Exigences MENU-01, MENU-02.

## Exigence -> test

| Exigence | Test automatisé | Preuve navigateur (Chromium headless, `next build` + `next start`, port 3104) |
|---|---|---|
| MENU-01 prix éditable en ligne, format ฿ | `tests/menu-screen-logic.test.ts` (format ฿ = site public, lecture de la saisie, `isPriceDirty`, corps du PUT) ; `tests/menu-screen-markup.test.ts` (étiquette « Prix de X en bahts », ฿, jamais €) | 390/768/1440 : saisie + Entrée -> `PUT {id, price}` (2 clés), bordure « modifiée », « Enregistré », toast `Prix de « Tom Kha Gai » enregistré : 395 ฿.` ; saisie invalide : message, aucune requête ; Échap et Annuler rétablissent |
| MENU-01 interrupteur Disponible/Indisponible immédiat | `menu-screen-logic` : `runOptimistic` (état modifié avant la réponse, retour arrière exact, une autre édition concurrente n'est pas écrasée) ; `menu-screen-markup` : `role="switch"`, `aria-checked`, mot visible | bascule visible 120 ms avant la réponse (réponse retardée à 700 ms) ; échec : retour à la position précédente + toast d'erreur |
| MENU-01 ajout rapide | `menu-screen-logic` : `itemCreateBody` | feuille, catégorie conservée, « Ajouter et en saisir un autre » garde la feuille, vide le nom et remet le focus dessus ; échec : feuille ouverte, champs conservés, alerte en ligne ; nom vide : erreur liée (`aria-invalid`), aucune requête |
| MENU-01 catégories repliables, recherche, drapeaux, allergènes, `price_label` | `menu-screen-logic` (filtre sans casse ni accents, compteurs) ; `menu-screen-markup` (drapeaux lecture seule, allergènes, libellé de prix conservé, prix vide) | `aria-expanded` + contenu masqué ; recherche, résultat vide + « Effacer la recherche » ; onglets de pages au clic et aux flèches |
| MENU-01 réordonnancement par flèches | `menu-screen-logic` : `moveInList` (bornes, immutabilité), `reorderBody`, retour arrière de la liste | flèches 44 px, ordre immédiat, `POST /api/menu/reorder {type:'items', items[rangs 0..n-1]}` ; échec : ordre rétabli + toast ; flèches de catégories présentes |
| MENU-01 états chargement / vide / erreur, saisie jamais perdue | `menu-screen-markup` (composants P11, pas de `console.`) | squelette « Chargement de la carte… » (`role=status`, `aria-busy`) ; erreur de chargement + Réessayer ; page vide + « Ajouter une catégorie » ; échec prix, ajout, détails : valeurs identiques avant/après |
| MENU-01 plus de `confirm()` natif | `tests/admin-ui-confirm.test.ts` (cliquet : entrées carte retirées, 0 natif) ; `menu-screen-markup` (aucun `confirm(`, `alert(`, emoji, `€`, `draggable`) | suppression plat/catégorie/page et fermeture avec saisie : `alertdialog`, focus initial sur l'action non destructrice, Échap = garder, focus rendu |
| MENU-01 une URL, `/admin/menu/[pageId]` répond | `tests/admin-nav-links.test.ts` (`/admin/menu`, `/admin/menu/abc123` existent) ; `tests/menu-admin-wiring.test.ts` (les deux adresses rendent `MenuScreen`) | n/a (la garde admin n'est pas rejouée, voir limites) |
| MENU-02 `revalidateTag` conservé | `tests/menu-admin-wiring.test.ts` : 3/3/3/1 inchangés, routes non modifiées (`git diff milestone/v1.1 -- src/app/api` vide) | n/a |
| MENU-02 libellés figés | `menu-admin-wiring` : `is_gluten_free: itemForm.is_gluten_free`, `item.is_gluten_free ?? false` (`menu-logic.ts`), `Sans gluten (confirmé par la cheffe)` (`ItemSheet.tsx`), usage réel dans la feuille | case présente dans la feuille Détails ; enregistrement -> `PUT` avec `is_gluten_free: true` (booléen) et `price_label` |
| MENU-02 une modification apparaît sur `/menu` | `tests/menu-admin-cache.test.ts` : exécute les vrais gestionnaires des routes (Supabase simulé) : le cache `getMenu` est étiqueté `menu` ; PUT prix, PUT disponibilité, POST ajout, DELETE, reorder, catégories, pages appellent `revalidateTag('menu','max')` ; erreur base, 401, 400 : aucune invalidation, aucun message technique renvoyé | n/a |

## Mesures navigateur (99 contrôles, 0 échec sur la dernière passe complète, + passe 1440 de confirmation)

Méthode : `next build` puis `next start -p 3104`, Chromium headless (Playwright dans `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-p14`, hors repo, non dépendance), 390x844 (DPR 2, tactile), 768x1024, 1440x900. Page de test temporaire sous `/gcm/mn-test` (hors du matcher du middleware) rendant `AdminRoot` + `AdminShell` réels + `MenuScreen`, **API `/api/menu/*` simulée dans le navigateur** (`page.route`, base en mémoire, échecs 500 / réseau injectés). Page et dossier RETIRÉS avant commit.

- Aucun débordement horizontal aux 3 largeurs (`scrollWidth <= clientWidth`), y compris feuille Détails.
- Texte visible >= 14 px dans la carte et la feuille (le shell garde ses libellés de navigation à 12 px, exception E1 validée en phase 12).
- Cibles interactives >= 44 x 44 : 0 échec (prix mesuré sur son cadre, cases sur la ligne cliquable). Un échec trouvé puis corrigé : bouton « Options de la catégorie » à 36 px de large en pointeur fin.
- Focus clavier : 25 tabulations par largeur, chaque élément focalisé a un anneau >= 2 px (prix : anneau sur le cadre).
- Toast : en haut (sous l'en-tête, top = 72 px à 768 et 1440, sous l'en-tête à 390), succès `adm-toast--success` disparaît seul, erreur persistante ; porté par la région `aria-live` de Base UI.
- Pas d'erreur JavaScript (les 500 simulés sont filtrés).
- Comparaison aux maquettes `carte.html`, `--prix-*`, `--dispo-*`, `--ajout-*`, `--details`, `--reordonner`, `--replie`, `--vide`, `--erreur`, `--chargement` : structure, ordre des éléments, libellés et états identiques ; écarts listés dans `14-CONTEXT.md` (menu des options en feuille, toast sans « Réessayer »).

Captures : `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-p14\shots\` (`<390|768|1440>-NN-*.png`).

## Ce que la vérification NE prouve PAS

- **Garde admin** : le middleware, `requireAdmin` et la RLS ne sont pas rejoués (page de test hors matcher). Les routes ne sont pas modifiées ; leurs tests existants les couvrent.
- **Base réelle** : l'API est simulée. Le contrat JSON des routes (`{data}` après POST/PUT) est celui lu dans le code, pas celui d'un Supabase vivant. Les ids, `display_order` et la forme de `GET /api/menu/pages` viennent du code de la route.
- **Rendu réel de `/menu` après modification** : prouvé par le test du cache (étiquette + `revalidateTag`), pas par un aller-retour navigateur sur un `/menu` alimenté par une vraie base. L'effet de `revalidateTag(…, 'max')` sur le rendu relève de Next.js.
- **Téléversement d'image** : le bouton existe et appelle `/api/menu/upload` ; non exercé (route inchangée).
- Lecteur d'écran réel (NVDA, VoiceOver), zoom 200 %, mouvement réduit, vrai téléphone : non testés. Le toast est dans une région `aria-live` de Base UI ; le rôle exact annoncé n'a pas été écouté.
- Un toast d'erreur persistant recouvre, sur écran large, les boutons « Réorganiser / Ajouter un plat » de l'en-tête jusqu'à sa fermeture (croix 44 px) ; sur téléphone il recouvre le haut du contenu. Constaté pendant les tests ; l'alerte en ligne reste visible dans les feuilles.

## Passe finale (GATE)

Voir la réponse de livraison : `npx vitest run`, `npx tsc --noEmit`, `npm run lint`, `npx next build`, `npx tsc --noEmit`.
Note d'environnement : sous Windows avec `core.autocrlf=true`, `admin.css` est en CRLF et deux tests de phase 12 (`admin-shell`, regex `\n`) échouaient ; `tests/admin-shell.test.ts` normalise désormais les fins de ligne (une ligne). Ce n'est pas un changement de comportement.
