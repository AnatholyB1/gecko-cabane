# Phase 3: Carte HTML et pages d'atterrissage clés - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Google peut lire la carte et les pages ciblant « french restaurant krabi » mènent à la réservation. Couvre MENU-01, MENU-02, PAGE-01, PAGE-02. Réintroduit `hasMenu` dans le schema (complète SEO-03, reporté de la phase 2, D-08 de la phase 2). Échéance P1 : 1er novembre 2026.

Hors périmètre : preuve sociale complète, section « Qui sommes-nous » complète, bloc « Comment venir » complet (phase 5, CONV-01/02/03) ; mention des moyens de paiement (MENU-03, phase 5) ; autres pages SEO et versions FR de french-restaurant (phase 6) ; DE/SV (phase 6).

</domain>

<decisions>
## Implementation Decisions

### Vins et bières belges (MENU-02)
- **D-01:** Le contenu réel (noms, producteurs/brasseries, formats, prix) **est fourni par le propriétaire** (une photo de la carte des vins suffit). Rien n'est inventé ni rédigé « plausible ». La section ne part pas en production avant réception de la liste.
- **D-02:** Nouvelle **page de menu `Vins & bières belges`** (5e entrée de `gecko_menu_pages`, slug dédié) avec ses catégories (vins rouges / blancs / rosés, bières belges…). Gérable depuis l'admin existant ; PAGE-06 (phase 6) pourra la réutiliser. L'actuelle catégorie « Bières » (Chang, Leo, Singha, Heineken) et « Champagne & crémant (verre) » restent où elles sont.
- **État constaté en base (2026-10-17) :** 4 pages (Ardoise, La Carte, Boissons, Cocktails), 27 catégories ; aucune bière belge ni aucun vin (seulement Champagne 650 ฿ et Crémant/Vouvray 350 ฿ au verre).

### Sans gluten et modèle de données (MENU-01)
- **D-03:** Nouvelle colonne **`is_gluten_free boolean not null default false`** sur `gecko_menu_items` (migration 009, idempotente comme la baseline 007/008), case à cocher dans le formulaire admin d'article, picto et légende « sans gluten », types `MenuItem` / `MenuItemFormData` mis à jour dans `src/types/database.ts`.
- **D-04:** **Sécurité allergies : aucun plat n'est marqué sans gluten par défaut.** Claude prépare une feuille d'export des 162 articles ; la **cheffe Jariya** marque les plats ; le flag n'est posé qu'après sa confirmation. Les plats non confirmés restent non marqués.
- **D-05:** Les allergènes restent affichés en **texte HTML** (champ `allergens` existant), visibles sans survol. La description, elle, n'apparaît aujourd'hui qu'au survol (`opacity-0 group-hover`) : à corriger pour `/menu`.

### Structure et langue de /menu (MENU-01)
- **D-06:** `/menu` est **rendu côté serveur** (Server Component, lecture Supabase anon) : tous les plats sont dans le HTML initial. **Une seule longue page avec sections ancrées** (Ardoise, La Carte, Boissons, Cocktails, Vins & bières belges) et une navigation d'ancres collante. Pas d'onglets cachés.
- **D-07:** Prix en bahts en texte (`{price} ฿`), `price_label` conservé ; descriptions visibles sans survol pour être lisibles par Google et sur mobile.
- **D-08:** Langue : **UI en next-intl (fr/en), noms de plats et descriptions en français** tels que stockés (conforme à D-12 de la phase 2 : « /en 100 % anglais hors noms de plats »). Pas de colonnes `name_en` / `description_en` dans cette phase. Titres de sections/catégories : ceux de la base (français).
- **D-09:** Sur l'accueil, la section carte devient un **teaser avec lien vers `/menu`** (mise en avant de l'Ardoise, bouton « Voir la carte complète »). `/menu` est la page canonique de la carte, pas de contenu dupliqué sur l'accueil. `MenuDisplay` (client) n'est plus monté sur l'accueil.
- **D-10:** `hasMenu` (URL `/menu` de la locale) est ajouté au JSON-LD Restaurant ; `/menu` est ajouté au sitemap (`PUBLISHED_PATHS`) avec `alternates.languages` fr/en ; metadata via `buildPageMetadata` et namespace `meta`.

### Accueil enrichi (PAGE-01)
- **D-11:** **Versions légères, la phase 5 les améliore.** Avis : note Google 4,7 / 1 062 avis en texte simple avec lien vers la fiche, **sans `aggregateRating`** ni citations inventées. Histoire : section « À propos » existante. Accès : adresse, horaires et lien Google Maps. Le title EN (« Gecko Cabane – French-Thai Restaurant in Krabi Town ») est déjà posé en phase 2 : à vérifier, pas à refaire.

### Page /en/french-restaurant-krabi (PAGE-02)
- **D-12:** Angle : **cuisine française authentique par un couple franco-thaï** à Krabi Town. Contenu : intro, plats signatures (bourguignon, velouté, poulet crème côté français ; massaman côté thaï), vins et bières belges (lien vers la section de `/menu`), histoire du couple, situation Maharat Road, **CTA de réservation** vers `#reservation`. Pas d'angle « dîner romantique » (réservé à PAGE-03, phase 6).
- **D-13:** Photos : **uniquement l'existant** : `food-bourguignon.jpg`, `food-massaman.jpg`, `food-poulet-creme.jpg`, `food-veloute.jpg`, `chef-jariya.jpg`, `exterior-entrance.jpg` / `exterior-sign.jpg`. Pas d'attente de nouvelles photos (alt descriptifs via next-intl).
- **D-14:** La page est publiée **en EN** ; son équivalent FR relève de PAGE-08 (phase 6). `/menu` et l'accueil existent dans les deux langues. Tant que la version FR n'existe pas, la page n'est ni dans le sitemap ni en hreflang pour `fr` (jamais de hreflang vers une page inexistante, cf. D-13 de la phase 2) ; sitemap en `en` seulement, canonical auto-référent, `x-default` vers l'EN.

### Claude's Discretion
Structure des composants (`MenuSections` serveur, légende de pictos), style de la navigation d'ancres, ordre des sections de la page landing, textes de meta (title/description) de `/menu` et de la page french-restaurant, noms des clés i18n, numérotation du fichier de migration, forme exacte du JSON-LD `hasMenu` (sans affirmation non vérifiable), liens de navigation vers `/menu` et la page landing (header/footer).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planification
- `.planning/ROADMAP.md` §Phase 3 : objectif, critères de succès
- `.planning/REQUIREMENTS.md` : MENU-01, MENU-02, PAGE-01, PAGE-02 ; SEO-03 (`hasMenu` reporté ici), PAGE-08 (FR phase 6), MENU-03 (phase 5)
- `.planning/PROJECT.md` : contraintes (échéance 1er nov., aucune affirmation non vérifiable dans le schema, accord du propriétaire pour toute action externe, i18n)
- `.planning/phases/02-fondations-seo-techniques/02-CONTEXT.md` : D-04 (JSON-LD Server Component), D-08 (`hasMenu` reporté ici), D-10/D-11 (namespace `meta`, title EN), D-12 (EN 100 % anglais), D-13/D-14 (hreflang et sitemap uniquement pour les pages publiées)
- `.planning/phases/01-r-servation-s-re-et-sans-friction/01-CONTEXT.md` : migrations 007/008, WhatsApp, `/privacy`

### Code concerné
- `src/components/MenuDisplay.tsx` : composant client actuel (onglets, description au survol), à remplacer par un rendu serveur sur `/menu`
- `src/app/[locale]/page.tsx` (773 lignes ; section `#menu` ~ligne 341) : teaser carte, blocs avis/histoire/accès
- `src/utils/seo.ts` : `buildPageMetadata`, `PUBLISHED_PATHS`, `localeUrl`, JSON-LD
- `src/components/RestaurantJsonLd.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`
- `src/types/database.ts` (`MenuPage`, `MenuCategory`, `MenuItem`, `MenuItemFormData`)
- `src/app/api/menu/{pages,categories,items,reorder,upload}` et pages admin de la carte (case sans gluten)
- `supabase/migrations/007_gecko_baseline.sql` (+ 008) : modèle de migration idempotente
- `messages/fr.json`, `messages/en.json`, `tests/i18n.test.ts` (parité + absence de texte français en dur dans `[locale]`)
- `CLAUDE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/ARCHITECTURE.md`

### Spec d'origine
- `Specs site Gecko Cabane – SEO et conversion.md` (C1, T3, pages) : chemin à localiser par le planificateur

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MenuDisplay.tsx` : assemblage pages → catégories → articles, pictos Lucide `Leaf` (végétarien, `text-gc-celadon`) et `Flame` (épicé, `text-gc-copper`), légende, styles Cinzel/Cormorant/Raleway.
- `buildPageMetadata()` dans `src/utils/seo.ts` : metadata complète par locale/page (canonical, hreflang, OG, twitter).
- `src/app/[locale]/privacy/page.tsx` : modèle de page localisée avec `generateMetadata`.
- Photos existantes dans `public/` (4 plats, cheffe, façade) ; lecture anon publique sur les tables de menu.

### Established Patterns
- Textes visibles de `[locale]` via next-intl (clés fr + en, parité testée) ; vitest exécuté avant le build ; Tailwind v4 (`bg-(--var)`, tokens `gc-*`).
- Tables préfixées `gecko_`, migrations numérotées dans `supabase/migrations/`.
- Server Components privilégiés pour les fetches initiaux ; JSON-LD en Server Component.

### Integration Points
- Nouvelles routes : `src/app/[locale]/menu/page.tsx`, `src/app/[locale]/french-restaurant-krabi/page.tsx`.
- `PUBLISHED_PATHS` / `sitemap.ts` : ajout de `/menu` (fr+en) et de la page landing (en seulement).
- `RestaurantJsonLd` : ajout de `hasMenu`.
- Admin menu : champ `is_gluten_free`.
- Navigation publique : liens vers `/menu` et la page landing.

</code_context>

<specifics>
## Specific Ideas

- Le propriétaire fournit une photo de la carte des vins/bières ; Claude la structure.
- Feuille d'export pour la cheffe Jariya : liste des 162 articles avec une colonne « sans gluten (oui/non) » à compléter.
- `Ardoise` (plats du moment, cuisine française + thaïe) sert de vitrine au teaser d'accueil.

</specifics>

<deferred>
## Deferred Ideas

- Colonnes `name_en` / `description_en` (traduction des plats et catégories) : à évaluer en phase 6 avec le contenu DE/SV.
- Mention « espèces, cartes, PromptPay » et frais carte sur la carte : phase 5 (MENU-03).
- Preuve sociale complète (Travellers' Choice, vrais avis), « Qui sommes-nous » complet, bloc « Comment venir » avec carte intégrée : phase 5 (CONV-01/02/03).
- `aggregateRating` : phase 5, seulement avec de vrais avis affichés.
- Version FR de french-restaurant-krabi, romantic-dinner, wine-belgian-beer (réutilise la page de menu) : phase 6.
- Nouvelles photos de plats : à la discrétion du propriétaire.

</deferred>

---

*Phase: 3-Carte HTML et pages d'atterrissage clés*
*Context gathered: 2026-10-17*
