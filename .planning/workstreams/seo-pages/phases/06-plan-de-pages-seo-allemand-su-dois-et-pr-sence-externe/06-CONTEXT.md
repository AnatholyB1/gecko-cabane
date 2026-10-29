# Phase 6: Plan de pages SEO, allemand/suédois et présence externe - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Le site couvre les requêtes secondaires en FR/EN/DE et la présence hors site (Google, TripAdvisor, blogs, hôtels) est cohérente. Couvre PAGE-03 à PAGE-08, I18N-01, I18N-02, OPS-02 à OPS-07. Échéance P1 : 1er novembre 2026 (haute saison).

Livre : les pages `romantic-dinner`, `where-to-eat-krabi-town`, `getting-here-from-ao-nang`, `wine-belgian-beer` (EN, avec titles/meta/H1/CTA/navigation/liens croisés) ; les versions FR de accueil, french-restaurant, romantic-dinner, where-to-eat et `/menu` ; le socle DE (puis SV) publié seulement après relecture humaine ; les livrables hors site (TripAdvisor, NAP, posts Google, modèles de réponse, blogs, concierge).

Hors périmètre : traduction des 162 plats, preuve sociale complète / « Qui sommes-nous » / bloc « Comment venir » complet (phase 5), `aggregateRating`, newsletter (phase 7), envoi effectif à des tiers sans accord du propriétaire.

</domain>

<decisions>
## Implementation Decisions

### URLs, gabarit et navigation (PAGE-03..08)
- **D-01:** **Slugs traduits par langue** : le mot-clé figure dans l'URL de chaque langue (ex. `/fr/restaurant-francais-krabi`, `/en/french-restaurant-krabi`, `/de/franzoesisches-restaurant-krabi`). Mapping de pathnames next-intl (`src/i18n/`) + table de slugs par page et par langue dans `src/utils/seo.ts` (source unique pour canonical, hreflang, sitemap, liens internes).
- **D-02:** **Les slugs EN déjà publiés ne changent pas** (`/en/french-restaurant-krabi` est indexé). Seuls FR et DE reçoivent des slugs traduits : aucune redirection 301 à poser. Les nouveaux slugs EN suivent les URL de REQUIREMENTS (`romantic-dinner-krabi`, `where-to-eat-krabi-town`, `getting-here-from-ao-nang`, `wine-belgian-beer-krabi`).
- **D-03:** **Gabarit commun, texte par langue** : un composant de page partagé (hero, sections, CTA vers `#reservation`, bloc de liens croisés) alimenté par des clés next-intl **rédigées pour chaque langue, pas traduites mot à mot** (PAGE-08). Cohérent avec `/en/french-restaurant-krabi`.
- **D-04:** **Navigation (PAGE-07)** : le header garde Carte / Réserver ; un sous-menu « Guides » liste les pages SEO ; chaque page se termine par un bloc « À découvrir » de 2-3 liens contextuels + CTA de réservation. Le footer reprend les liens. Pas de 7 liens dans le header (mobile).

### Ouverture technique de DE/SV (I18N-01, I18N-02)
- **D-05:** **`de` et `sv` deviennent des locales actives dès cette phase** (config next-intl, middleware, `seo.ts`), mais la publication est pilotée **par page et par langue** : `PUBLISHED_PAGES` ne liste une page en `de`/`sv` qu'après validation écrite de la relecture. Une page DE non listée reste accessible mais en **`noindex`**, sans hreflang ni entrée de sitemap (D-13/D-14 de la phase 2 respectés). Le sélecteur de langue n'affiche que les langues publiées.
- **D-06:** **Relecture DE par un relecteur humain fourni par le propriétaire** : Claude produit un document de relecture structuré (texte DE en regard du FR), reporte les corrections, puis le propriétaire donne une validation écrite avant publication. Aucune page DE n'est publiée sans cette validation (contrainte PROJECT.md).
- **D-07:** **Périmètre : DE complet, SV en socle.** DE : accueil, french-restaurant, romantic-dinner, where-to-eat, `/menu` et pages d'avis (`/de/review`, alias `/bewertung`). SV : locale prête (fichier de messages, routage) et textes rédigés après DE, publiés après leur propre relecture ; hreflang `sv` ajouté à la publication.
- **D-08:** **Noms et descriptions de plats : restent en français** sur `/menu` en DE (et EN), comme une carte de restaurant français ; seuls l'interface, les titres de sections et les légendes sont traduits. Pas de colonnes `name_de` / `description_de`, pas de migration. `name_en` / `description_en` (report de la phase 3) restent écartés.
- **D-09:** Le repli `de` → `en` de la page `/review` et des emails (D-10 / D-08 de la phase 4) est levé pour `de` à la publication DE ; `sv` continue de retomber sur `en` jusqu'à sa propre publication. Les textes DE du QR (insert et chevalet) sont relus par le même relecteur.

### Contenu et sources des faits
- **D-10:** **getting-here-from-ao-nang** : les prix, durées et horaires viennent **du propriétaire** (ce que les clients paient réellement), recoupés avec 1-2 sources publiques par Claude. Tout chiffre sans source est présenté comme approximatif ou omis. Aucun tarif inventé.
- **D-11:** **where-to-eat-krabi-town** : guide honnête centré sur **lieux, marchés et quartiers** (night market, Walking Street, front de rivière), types de cuisine et moments pour y aller ; Gecko présenté pour le dîner. **Aucun concurrent nommé**, aucun classement ni avis négatif inventé.
- **D-12:** **romantic-dinner** : **photos existantes uniquement** (façade, plats, cheffe) ; **ambiance sans offre chiffrée** : pas de « menu dégustation pour deux » défini, donc pas de formule ni de prix sur la page. Elle décrit l'ambiance, la carte et la réservation « occasion » (champ déjà présent). Une formule pourra être ajoutée plus tard si le propriétaire la crée.
- **D-13:** **wine-belgian-beer** : présentation, choix belge et **accords mets-vins rédigés** ; la liste (prix, formats) **reste sur `/menu#vins-bieres-belges`** et la page y renvoie, sans dupliquer la carte.

### Présence externe (OPS-02..07)
- **D-14:** **Format des livrables** : dossier **`docs/ph6/`** dans le repo (Markdown, et PDF pour le dossier concierge imprimable), comme `docs/print/` en phase 4. Contenu : posts Google, modèles de réponse aux avis, liste de blogs avec messages, dossier concierge, tableau NAP.
- **D-15:** **Posts Google (OPS-02)** : **4 semaines d'avance, FR + EN** (plat de la semaine, soirée, offre basse saison), validés par le propriétaire, publiés par lui ou après son accord explicite.
- **D-16:** **Modèles de réponse aux avis (OPS-03)** : réponses sous 48 h incluant « French restaurant in Krabi Town », en FR/EN/DE, sans contrepartie ni demande d'avis incitée.
- **D-17:** **TripAdvisor (OPS-04) et NAP (OPS-05) via Chrome piloté** (extension claude-in-chrome), **comme GBP en phase 4 (D-19)** : textes prêts à coller d'abord, validation du propriétaire avant chaque clic. Le lien du site TripAdvisor passe de `tripadvisor.be` à `.com`. Audit NAP en tableau (site, Google, TripAdvisor, Facebook, Trip.com, Wanderlog), écarts signalés puis corrigés avec accord.
- **D-18:** **Blogs/guides (OPS-06) et concierge (OPS-07) : préparés, rien n'est envoyé.** Messages FR/EN/DE par cible (Petit Futé, Travelfish, Faszination Südostasien, Marco Polo) et dossier hôtels (carte de recommandation, commission) prêts ; **le propriétaire déclenche chaque envoi** et aucune commission chiffrée n'est proposée sans son accord. Pas de brouillons Gmail.

### Claude's Discretion
Noms exacts des slugs FR/DE (recherche de mots-clés), structure du composant de page partagé, clés i18n et namespace `meta` par page, style du sous-menu « Guides » et du bloc « À découvrir », forme du document de relecture DE, ordre de livraison avant le 1er novembre (pages EN et FR d'abord, DE/SV selon la relecture), données structurées par page (BreadcrumbList, FAQ si contenu réel), tests (parité des clés fr/en/de, absence de hreflang vers page non publiée, slugs/sitemap).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planification
- `.planning/workstreams/seo-pages/ROADMAP.md` §Phase 6 : objectif, critères de succès
- `.planning/workstreams/seo-pages/REQUIREMENTS.md` : PAGE-03..08, I18N-01/02, OPS-02..07
- `.planning/PROJECT.md` : contraintes (échéance 1er nov., textes DE/SV relus par un humain, aucune affirmation non vérifiable, accord du propriétaire pour toute action externe)
- `.planning/phases/02-fondations-seo-techniques/02-CONTEXT.md` : D-04 (JSON-LD Server Component), D-10/D-11 (namespace `meta`), D-13/D-14 (hreflang et sitemap uniquement pour pages publiées)
- `.planning/phases/03-carte-html-et-pages-d-atterrissage-cl-s/03-CONTEXT.md` : D-08 (noms de plats en français), D-12/D-13/D-14 (french-restaurant-krabi, photos, FR reportée ici), page `Vins & bières belges`, `/menu#vins-bieres-belges`
- `.planning/phases/04-tunnel-d-avis-et-fiche-google/04-CONTEXT.md` : D-08/D-10 (repli `de` → `en`), D-17 (textes DE du QR à relire), D-19 (pilotage Chrome avec validation avant clic)

### Code concerné
- `src/i18n/config.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts`, `src/middleware.ts` : locales actuellement `fr`/`en` seulement, `localePrefix: 'always'`, `localeDetection: false` ; mapping de pathnames et ajout de `de`/`sv`
- `src/utils/seo.ts` : `LOCALES`, `OG_LOCALE`, `PUBLISHED_PAGES`, `PUBLISHED_PATHS`, `pageLanguages`, `localeUrl`, `buildPageMetadata`, `SAME_AS`, identifiants Google/TripAdvisor
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/components/RestaurantJsonLd.tsx`
- `src/app/[locale]/page.tsx` : header/nav (sous-menu « Guides »), lien TripAdvisor en `tripadvisor.be` (ligne ~548) à corriger, footer
- `src/app/[locale]/french-restaurant-krabi/page.tsx` : modèle du gabarit de page SEO (EN)
- `src/app/[locale]/menu/page.tsx`, `src/app/[locale]/review/page.tsx`, `src/components/LanguageSwitcher.tsx`
- `messages/fr.json`, `messages/en.json` (+ nouveaux `de.json`, `sv.json`), `tests/i18n.test.ts` (parité, absence de français en dur dans `[locale]`)
- `public/` : photos existantes (`food-*.jpg`, `chef-jariya.jpg`, `exterior-*.jpg`)
- `docs/print/` : modèle de dossier de livrables ; `docs/ph6/` à créer
- `CLAUDE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/ARCHITECTURE.md`

### Spec d'origine
- `Specs site Gecko Cabane – SEO et conversion.md` (pages, L1, OPS) : chemin à localiser par le planificateur

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildPageMetadata()` + `PUBLISHED_PAGES` dans `src/utils/seo.ts` : metadata, hreflang et sitemap déjà pilotés page par page et locale par locale ; à étendre à `de`/`sv` et aux slugs traduits.
- `src/app/[locale]/french-restaurant-krabi/page.tsx` : gabarit de landing page SEO (EN) à factoriser en composant partagé.
- `/menu` (Server Component) avec ancres et section `vins-bieres-belges` ; lien conditionnel vers cette section tant qu'elle est peuplée.
- Page `/review` + alias `/review`, `/avis`, `/bewertung` ; PDF QR FR/EN/DE sous `docs/print/`.
- Photos existantes de plats, cheffe et façade.

### Established Patterns
- Textes visibles de `[locale]` via next-intl, parité testée ; vitest avant le build ; Tailwind v4 (`bg-(--var)`, tokens `gc-*`).
- Hreflang et sitemap uniquement vers des pages publiées (D-13/D-14 phase 2) ; pas de forecast d'URL.
- Actions externes : textes prêts d'abord, accord du propriétaire, validation avant chaque clic (D-19 phase 4).

### Integration Points
- `src/i18n/*` et `src/middleware.ts` : ajout de `de`/`sv` et des pathnames traduits.
- `src/utils/seo.ts` : table de slugs, `PUBLISHED_PAGES`, `OG_LOCALE` (`de_DE`, `sv_SE`).
- Header de l'accueil (sous-menu « Guides ») et footer ; `LanguageSwitcher` filtré sur les langues publiées.
- Nouvelles routes sous `src/app/[locale]/` pour les 4 pages ; `messages/{fr,en,de,sv}.json`.
- `docs/ph6/` : livrables hors site.

</code_context>

<specifics>
## Specific Ideas

- Document de relecture DE : texte allemand en regard du français, un fichier par page, avec case de validation par page.
- Les hreflang `de` / `sv` ne s'ajoutent qu'à la publication d'une page relue (jamais en avance).
- Le lien TripAdvisor du site doit pointer vers `tripadvisor.com` (aujourd'hui `fr.tripadvisor.be` dans le header/avis de l'accueil).

</specifics>

<deferred>
## Deferred Ideas

- Traduction des plats (`name_en`/`name_de`, `description_*`) : écartée ; à rouvrir si les analytics montrent un besoin.
- Formule « menu dégustation pour deux » sur romantic-dinner : seulement si le propriétaire la définit.
- Guide local avec établissements nommés : écarté pour cette phase.
- Brouillons Gmail pour blogs/concierge : écartés ; envois déclenchés par le propriétaire.
- Données structurées avancées par page (FAQ, BreadcrumbList) : à la discrétion du planificateur si contenu réel.

</deferred>

---

*Phase: 6-Plan de pages SEO, allemand/suédois et présence externe*
*Context gathered: 2026-10-17*
