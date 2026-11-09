# 19a BUILD REPORT (ONP-04 à ONP-09)

Branche `phase/19a-pages` (base `milestone/v1.2`, merge de `milestone/v1.2` refait avant le gate). Aucun push, aucun déploiement, aucune migration.

## Ce qui est fait

- **ONP-04 / ONP-05** : `getting-here-from-ao-nang` et `wine-belgian-beer-krabi` existent maintenant en fr/en/de/sv dans le registre `PAGES` (`src/utils/seo.ts`), mécanisme de slugs par langue déjà existant (réutilisé, rien d'inventé).
  - getting-here : fr `/venir-depuis-ao-nang`, de `/anreise-von-ao-nang`, sv `/resa-fran-ao-nang`.
  - wine-beer : fr `/vins-bieres-belges-krabi`, de `/wein-belgisches-bier-krabi`, sv `/vin-belgisk-ol-krabi`.
  - Textes DE/SV : déjà présents dans `messages/de.json` et `sv.json` (ajoutés par une phase antérieure, pas par moi) ; je n'ai fait que corriger les occurrences « couple ». Textes FR : rédigés ici d'après l'EN (`gettingHere`, `wineBeer`, `meta.gettingHere*`, `meta.wineBeer*` dans `messages/fr.json`). La bière est belge, pas le vin (texte repris tel quel de l'EN).
- **Publication (important)** : `PUBLISHED_PAGES` liste ces deux pages en **fr + en** seulement. de/sv ont le contenu et la route mais restent **noindex, hors sitemap, hors hreflang, hors navigation** (la porte `tests/i18n-publication-gate.test.ts` l'exige : pas de de/sv publié sans relecture signée). Les URLs de/sv répondent 200 en noindex si on les connaît.
- **ONP-06** : sitemap et hreflang dérivés de `PUBLISHED_PAGES` (fr, en, x-default = fr). Nouveau test `tests/seo-hreflang-reciprocity.test.ts` : une entrée par couple publié, chaque version pointe vers toutes les autres et vers elle-même, mêmes alternates sur chaque version, x-default valide, cibles toutes présentes dans le sitemap, metadata de page identiques au sitemap, pages « contenu sans publication » absentes partout.
- **ONP-07** : `src/utils/menu-jsonld.ts` + `src/components/MenuJsonLd.tsx`, branchés sur `/[locale]/menu` à côté du JSON-LD Restaurant (ajouté aussi sur cette page pour que `provider: #restaurant` se résolve). Menu > MenuSection (page) > MenuSection (catégorie) > MenuItem (name, description, offers.price + priceCurrency THB, suitableForDiet végétarien si le drapeau est vrai). Pas d'offre si pas de prix, aucune note ni avis. Test `tests/seo-menu-jsonld.test.ts` (forme structurelle).
- **ONP-08** : Next supprime l'image `opengraph-image.tsx` dès qu'une page renvoie son propre `openGraph` (constaté dans le HTML : seules les accueils avaient og:image). `buildPageMetadata` ajoute maintenant `openGraph.images` et `twitter.images` (URL `/{locale}/opengraph-image`, sans hash, le route sert le PNG, vérifié 200 image/png) ; `buildShareMetadata` fait de même pour les pages noindex (review, wifi, newsletter, confirm, unsubscribe, et les couples page/langue non publiés). Test `tests/seo-og-twitter.test.ts` (helpers + scan de toutes les `page.tsx`).
- **ONP-09** : voir ci-dessous. Test `tests/no-couple-wording.test.ts` (fr/en/de/sv).

## ONP-09, occurrences « couple franco-thaï » (toutes modifiées)

fr : `frenchRestaurant.subtitle`, `frenchRestaurant.intro1`, `frenchRestaurant.storyTitle`, `nav.frenchRestaurantHint`, `romanticDinner.sections.ambiance.p1`.
en : `frenchRestaurant.subtitle`, `.intro1`, `.storyTitle`, `nav.frenchRestaurantHint`, `romanticDinner.sections.ambiance.p1`, `wineBeer.sections.belgian.p1`.
de : `frenchRestaurant.subtitle`, `.intro1`, `.storyTitle`, `nav.frenchRestaurantHint`, `romanticDinner.sections.ambiance.p1`, `wineBeer.sections.belgian.p1`.
sv : `frenchRestaurant.subtitle`, `.intro1`, `.storyTitle`, `nav.frenchRestaurantHint`, `romanticDinner.sections.ambiance.p1`, `wineBeer.sections.belgian.p1`.
(FR `wineBeer.sections.belgian.p1` est nouveau, déjà écrit sans « couple ».) Aucun JSON-LD, `about-content.ts`, `page.tsx`, manifest ni email ne contient « couple » au sens visé ; `COUPLE_PHOTO` (null, jamais affichée) et les clés `couplePhotoAlt`/`coupleCaption` sont des identifiants, pas du texte publié.

**Non touché (hors périmètre, à décider par le propriétaire)** : les phrases qui présentent Jariya et « son mari français, Frédéric » (`about.story1` et `frenchRestaurant.story1` dans les quatre langues, `romanticDinner.sections.chef.p1` fr/en/de, `about.couplePhotoAlt`/`coupleCaption`), ainsi que `docs/ph6/review/en/wine-belgian-beer-krabi.md` (feuille signée qui cite l'ancien texte EN). Elles ne disent pas « couple franco-thaï » mais restent en tension avec « présentation = cheffe Jariya ».

## Vérifié (réellement exécuté)

- `npx vitest run` : 144 fichiers, 2411 tests passés, 1 skipped. `npx tsc --noEmit` : 0 erreur (avant et après build). `npm run lint` : 0 erreur, 2 warnings déjà existants. `npm run build` : OK (vitest + next build).
- `next start -p 3104` sur la build : 200 pour les 8 URLs nouvelles (fr/en/de/sv x 2 pages). fr/en : `robots index`, canonical auto-référent, hreflang fr + en + x-default (fr), og:image et twitter:image/card présents. de/sv : `noindex, follow`. `sitemap.xml` : 4 nouvelles URLs (fr+en), 0 URL de/sv des deux pages.
- `/fr/menu`, `/en/menu`, `/de/menu` : JSON-LD Restaurant + Menu parsables (5 sections, 303 plats, 237 avec offre THB). `/fr/review` : og:image et twitter:image présents malgré noindex. Accueil : og:image unique (pas de doublon).
- Playwright (iPhone 14 et 1440 px) sur 5 pages : pas de débordement horizontal, pas d'erreur JS, H1 corrects. Captures dans le scratchpad (hors git).

## Non prouvé

- Rich Results Test en ligne du JSON-LD Menu (forme validée seulement par test vitest).
- Rendu des previews sociaux réels (Facebook/X/WhatsApp) ; l'image OG de de/sv est la variante anglaise (le composant ne connaît que fr/en).
- Relecture de contenu : la build lit la vraie base Supabase publique (clé anon, lecture) pour la carte, comme tout build de ce dépôt.
- La publication FR de `wine-belgian-beer-krabi` est techniquement active, mais la validation propriétaire sur l'alcool (2026-10-18) porte sur le texte EN ; le texte FR demande le même accord avant mise en ligne.

## À relire (ONP-11), jamais publié sans relecture humaine

- DE et SV : `gettingHere.*`, `wineBeer.*`, `meta.gettingHere*`, `meta.wineBeer*` (existants, non rédigés ici) et les 12 phrases corrigées pour ONP-09 (6 en de, 6 en sv) : `frenchRestaurant.subtitle`, `.intro1`, `.storyTitle`, `nav.frenchRestaurantHint`, `romanticDinner.sections.ambiance.p1`, `wineBeer.sections.belgian.p1`. Attention : plusieurs de ces clés sont dans des pages **déjà publiées en de/sv** (french-restaurant, romantic-dinner, nav), dont les feuilles signées `docs/ph6/review/{de,sv}/*.md` citent l'ancien texte : ces feuilles sont à refaire valider.
- FR : textes de `gettingHere`, `wineBeer` et meta (nouveaux) à relire par le propriétaire.
- Pour publier de/sv : ajouter les entrées dans `scripts/translation-scope.json`, générer et signer les feuilles `docs/ph6/review/{de,sv}/…`, puis ajouter `de`,`sv` à `PUBLISHED_PAGES` (sinon `tests/review-docs.test.ts` et la porte de publication échouent, ce qui est voulu).
