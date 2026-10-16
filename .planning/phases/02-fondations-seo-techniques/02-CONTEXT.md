# Phase 2: Fondations SEO techniques - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Google et Bing indexent correctement le site dans ses versions FR et EN, sur le bon domaine (`https://geckocabanerestaurant.com`), avec un schema Restaurant complet et exact. Couvre SEO-01 à SEO-07. Échéance P1 : 1er novembre 2026. Indépendante de la phase 1 (livrée).

</domain>

<decisions>
## Implementation Decisions

### Domaine et redirections (SEO-01)
- **D-01:** `https://geckocabanerestaurant.com` est le seul domaine canonique. **`gecko-cabane.com` n'appartient pas à l'utilisateur** (absent de son compte Vercel, « n'existe pas / pas à moi ») : aucune redirection 301 n'est possible. SEO-01 est donc réinterprété : **supprimer toute référence à `gecko-cabane.com`** dans le code (metadataBase, canonical, openGraph.url, JSON-LD url/image/menu, placeholder `admin@gecko-cabane.com` du formulaire de login, docs).
- **D-02:** `www.geckocabanerestaurant.com` → apex en **301** (configuration du domaine Vercel). La racine `/` → `/fr` en **308** via le middleware next-intl existant (langue par défaut, pas de détection Accept-Language). `x-default` pointe vers `/fr`.
- **D-03:** Canonical **auto-référent** par page et par langue : `https://geckocabanerestaurant.com/{locale}/…` (jamais `/` générique comme aujourd'hui).

### Schema Restaurant (SEO-02, SEO-03)
- **D-04:** Le JSON-LD est rendu par un **Server Component** (par langue), plus dans le layout racine statique. `description` dans la langue de la page.
- **D-05:** `openingHoursSpecification` **généré depuis `gecko_opening_hours`** (aujourd'hui faux : 11h-23h tous les jours sauf mardi ; réel 12h-22h, fermé le mardi, modifiable par l'admin). Pas de `gecko_special_hours` dans le schema.
- **D-06:** `geo` = **lat 8.0615, lon 98.9157** (valeurs de REQUIREMENTS SEO-02, remplacent 8.0863 / 98.9063 actuels). `url` et `image` sur le domaine principal.
- **D-07:** **`aggregateRating` retiré** (4.8 / 150 est inventé ; règle du projet : seulement avec de vrais avis affichés, phase 5). `priceRange: ฿฿` (remplace `$$`), `acceptsReservations: true`, `paymentAccepted`, `currenciesAccepted: THB`.
- **D-08:** **`hasMenu` / `menu` retirés en phase 2** (la page `/menu` n'existe qu'en phase 3, ne pas lier une 404) ; la phase 3 les réintroduit (SEO-03 sera complété à ce moment — à noter dans le plan et dans la traçabilité).
- **D-09:** `sameAs` (Google Maps, TripAdvisor, Facebook, Instagram) : **Claude cherche les URLs officielles et les soumet à l'utilisateur pour validation** ; aucune URL n'est mise en ligne sans accord. Seuls les profils vérifiés entrent dans le schema.

### Metadata par langue et /en (SEO-04)
- **D-10:** `generateMetadata` dans `[locale]/layout.tsx` et chaque page, textes dans un namespace **`meta`** de `messages/fr.json` / `en.json` (parité testée). Le layout racine ne garde que les valeurs communes (icons, robots, metadataBase, formatDetection).
- **D-11:** Titles accueil : EN **« Gecko Cabane – French-Thai Restaurant in Krabi Town »** (imposé PAGE-01) ; FR **« Gecko Cabane – Restaurant franco-thaï à Krabi Town »**. Meta description ~150 caractères par langue (cheffe Jariya, 40 couverts, Maharat Road, réservation en ligne). `og:locale` `fr_FR` / `en_US` avec `og:locale:alternate` pour l'autre langue ; twitter card dans la langue ; `<html lang>` = locale.
- **D-12:** **Portée « /en 100 % anglais » = tous les textes visibles en dur** de `src/app/[locale]/` et `src/components/` migrés vers next-intl (titres « Notre Histoire », « Notre Cuisine », « La Carte », « Nos Créations », alt d'images, aria-label), hors noms de plats. Un **test** garantit qu'aucun texte français accentué en dur ne subsiste dans ces dossiers. Titres EN : Our Story / Our Cuisine / The Menu / Our Creations.
- **D-13:** hreflang : `fr`, `en` et `x-default` (→ `/fr`) sur chaque page ; **pas de `de`** tant que `/de` n'est pas publié (jamais vers une page inexistante).

### Sitemap, robots, Search Console (SEO-05, SEO-06, SEO-07)
- **D-14:** `src/app/sitemap.ts` liste **uniquement les pages publiées** : `/fr`, `/en`, `/fr/privacy`, `/en/privacy`, chacune avec `alternates.languages` (fr, en). `src/app/robots.ts` : `allow /`, `disallow /admin /api /auth /monitoring`, ligne `Sitemap: https://geckocabanerestaurant.com/sitemap.xml`. Les pages futures s'ajoutent à leur phase (pas d'URL prévisionnelle).
- **D-15:** **Propriété de domaine Google Search Console** vérifiée par **enregistrement TXT DNS posé via Vercel DNS** (action approuvée par l'utilisateur : « j'approuve tes actions »), sitemap soumis avec l'outil GSC connecté (`mcp__gsc__*`). **Bing Webmaster** : import du site depuis GSC ; l'étape de validation dans l'interface Bing relève de l'utilisateur si une connexion est requise.

### Claude's Discretion
- og:image par langue (`opengraph-image.tsx` existant), manifest `lang`, `noindex` des pages d'erreur/admin, structure des helpers SEO (`src/utils/seo.ts`), tests (parité meta, absence de `gecko-cabane.com`, sitemap, schema valide sans `aggregateRating`), choix des textes de meta description.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planification
- `.planning/ROADMAP.md` §Phase 2 — objectif, critères de succès
- `.planning/REQUIREMENTS.md` — SEO-01 à SEO-07 (SEO-08 = phase 5), PAGE-01 (title EN)
- `.planning/PROJECT.md` — contraintes (échéance, aucune affirmation non vérifiable dans le schema, accord du propriétaire pour toute action externe)
- `.planning/phases/01-r-servation-s-re-et-sans-friction/01-CONTEXT.md` — décisions de la phase 1 (webhooks supprimés, email de contact)

### Code concerné
- `src/app/layout.tsx` — metadata statique française, JSON-LD à refondre
- `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx` (textes en dur), `src/app/[locale]/privacy/page.tsx` (modèle de `generateMetadata`)
- `src/i18n/config.ts`, `src/i18n/request.ts`, `src/middleware.ts`
- `src/app/manifest.ts`, `src/app/opengraph-image.tsx`
- `messages/fr.json`, `messages/en.json`, `tests/i18n.test.ts`
- `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/ARCHITECTURE.md`, `CLAUDE.md`

### Spec d'origine
- `Specs site Gecko Cabane – SEO et conversion.md` (T1–T6, référencée par REQUIREMENTS.md ; chemin à localiser)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/[locale]/privacy/page.tsx` : exemple de `generateMetadata` par locale.
- `src/utils/reservation-rules.ts` (`bangkokNow`, `resolveHours`) : lecture/normalisation des horaires.
- `src/app/opengraph-image.tsx`, `src/app/manifest.ts` : à adapter par locale si nécessaire.
- `tests/i18n.test.ts` : parité des clés fr/en.
- Outil GSC MCP connecté (`list_sites`, `submit_sitemap`, `search_analytics_query`).

### Established Patterns
- Textes visibles de `[locale]` via next-intl ; clés dans fr.json et en.json.
- Tables `gecko_*` ; lecture publique via Server Components / client anon (RLS public read sur `gecko_opening_hours`).
- Vercel git-connected ; `npm run build` exécute vitest avant le build.

### Integration Points
- `src/app/layout.tsx` (suppression du JSON-LD et des constantes de domaine) ; `[locale]/layout.tsx` (generateMetadata + JSON-LD) ; nouveaux `src/app/sitemap.ts`, `src/app/robots.ts`.
- Domaine Vercel (`www` → apex) et DNS Vercel (TXT GSC).

</code_context>

<specifics>
## Specific Ideas

- Le middleware ne doit pas rediriger `/sitemap.xml`, `/robots.txt` vers une locale (vérifier le matcher).
- Vérifier avec le Rich Results Test (outil externe) une fois déployé ; consigner le résultat.

</specifics>

<deferred>
## Deferred Ideas

- `hasMenu`/`menu` du schema — phase 3 (page `/menu`).
- `aggregateRating` — phase 5 (avis réels affichés).
- Hreflang `de`/`sv` et pages DE/SV — phase 6.
- Redirection 301 de `gecko-cabane.com` — impossible (domaine non contrôlé) ; à rouvrir si l'utilisateur en acquiert la propriété.
- Fermetures exceptionnelles (`gecko_special_hours`) dans le schema, BreadcrumbList.

</deferred>

---

*Phase: 2-Fondations SEO techniques*
*Context gathered: 2026-10-16*
