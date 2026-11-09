# W1-REVIEW : revue de code vague 1 (B18, B19a, B20a)

Base : `milestone/v1.2` (dernier commit « docs(v1.2): fusion B18, lancement vague 2 »). Branche `audit/w1-review`. Aucune source modifiée.
Vérifié réellement : `npm run build` (vitest 145 fichiers / 2438 tests OK, next build OK), `next start -p 3111`, curl sur 36 URLs.

## Claims du rapport de build revérifiés

| Claim | Résultat |
|---|---|
| /fr /en /de /sv /menu : `s-maxage=3600, swr=31532400`, `x-nextjs-cache: HIT` | CONFIRMÉ |
| /privacy : `s-maxage=31536000` | CONFIRMÉ (aussi /de/privacy, /sv/privacy) |
| /fr/wifi `private, no-store`, /fr/review dynamique | CONFIRMÉ. /de/wifi et /sv/wifi : no-store seulement via le rendu dynamique |
| `<html lang>` correct par locale | CONFIRMÉ (fr, de, admin = fr) |
| Aliases /wifi /review : 307 `private, no-store` vers /en/... | CONFIRMÉ |
| /admin, /admin/zzz : garde session (307 login) | CONFIRMÉ |
| 4 en-têtes de sécurité sur toutes les routes testées | CONFIRMÉ |
| sitemap : 4 nouvelles URLs fr+en, 0 de/sv pour les 2 pages | CONFIRMÉ ; hreflang fr/en/x-default=fr, canonical auto-référent, og/twitter images présents ; de/sv `noindex, follow` |
| Menu JSON-LD parsable, THB, aucune note | CONFIRMÉ (forme) ; voir M2 sur `inLanguage` |
| Lighthouse (score, unsized-images 2 -> 0, polyfills 14 Ko) | NON REVÉRIFIÉ (hors périmètre de cette passe) |
| `x-vercel-cache`, cache Plausible par curl | NON PROUVABLE en local |

## Findings

| SEV | fichier:ligne | problème | correction |
|---|---|---|---|
| HIGH | `src/app/not-found.tsx:1-8`, `src/app/[locale]/not-found.tsx` (tout le fichier) | Régression 404 liée à la suppression de `app/layout.tsx`. Sur `/en/nope`, `/de/nope`, `/fr/nope`, `/foo.png` (toutes HTTP 404), c'est le `not-found.tsx` GLOBAL qui est rendu : texte français « Page introuvable » codé en dur pour tous les visiteurs, `<html>` SANS attribut `lang` (constaté dans le HTML), une seule feuille de style, sans les polices du site. `[locale]/not-found.tsx` (traduit via `errors.notFound`) n'est plus jamais atteint pour une URL inconnue : code mort, et les clés `errors.notFound.*` ne servent plus. Avec `dynamicParams=false` + `[locale]` sans layout racine commun, Next n'a pas de contexte locale pour une URL non appariée | Soit activer `experimental.globalNotFound` + `src/app/global-not-found.tsx` (avec `<html lang>` et imports CSS/polices), soit ajouter un segment catch-all `[locale]/[...rest]/page.tsx` qui appelle `notFound()` (rend alors `[locale]/not-found.tsx` dans le layout, localisé). Ajouter `lang` à `app/not-found.tsx` au minimum. Ajouter un test sur `/en/nope` (le seul test actuel est une lecture de source) |
| MED | `src/utils/menu-jsonld.ts:81`, `src/app/[locale]/menu/page.tsx:60` | `inLanguage: locale` annonce `en`/`de`/`sv`, mais les noms de sections et de plats viennent d'une seule colonne en base (français : « Bœuf bourguignon », « La Carte », « Vins & bières belges »). Sur `/en/menu` le JSON-LD affirme `inLanguage: "en"` avec des textes français : affirmation fausse, contraire à la règle « aucune affirmation non vérifiable dans le schema » | Retirer `inLanguage` (ou le fixer à la langue réelle des données), ou n'émettre le Menu que sur la locale dont les données sont dans cette langue. Test à ajouter : pas d'`inLanguage` divergent du contenu |
| MED | `tests/middleware-routing.test.ts:41-66`, `tests/middleware-matcher.test.ts`, `tests/seo-og-twitter.test.ts:53-61`, `tests/locale-param-guard.test.ts` | Tests qui figent la source au lieu de vérifier le comportement : `readFileSync` + `toContain('return intlMiddleware(request)')`, `toContain('<html lang={locale}>')`, présence du mot `localizedPageMetadata(` dans chaque page. Ils passent alors que la régression 404 ci-dessus existe, et ne détecteraient pas une page redevenue dynamique (`ƒ`). Le « contrat statique » n'est pas testé sur le build | Ajouter un test de build/intégration (ou script post-build) qui lit `.next/server/app-paths-manifest` / la sortie `next build` et exige `●` pour `/[locale]`, menu, privacy, 5 guides et `ƒ` pour wifi, review, newsletter* ; et un test qui appelle `middleware` avec une URL publique en mockant `@supabase/ssr` pour prouver qu'il n'est pas invoqué |
| MED | `next.config.ts:24` (règle wifi) | `source: '/:locale(fr|en)/wifi'` : `/de/wifi` et `/sv/wifi` n'ont pas le `Cache-Control: private, no-store` explicite (vérifié : ils ont `private, no-cache, no-store, max-age=0, must-revalidate` uniquement parce que la page est `force-dynamic`). Les identifiants wifi dépendent donc d'une seule garde implicite ; le test (`middleware-routing.test.ts`) ne couvre que fr|en | Passer à `/:locale(fr|en|de|sv)/wifi` (ou `/:locale/wifi`) et étendre le test |
| MED | `src/app/[locale]/privacy/page.tsx` + `src/utils/seo.ts` (PAGES privacy `contentLocales: ['fr','en']`) | `/de/privacy` et `/sv/privacy` sont prérendus en 200 (`s-maxage=31536000`) avec un texte allemand/suédois non relu (repli EN fusionné) ; `noindex` OK mais la page juridique (PDPA/RGPD) est servie, mise en cache un an par le CDN, alors que `contentLocales` dit qu'elle n'existe pas. Les pages guides font `hasContent() -> notFound()`, pas la privacy | Ajouter la garde `hasContent`/`notFound()` à la privacy (cohérence avec les guides), ou assumer et documenter |
| LOW | `src/middleware.ts:17-21` (+ `middleware-routing.ts` ALIASES) | Pas de blocage mais fragile : tout chemin inconnu hors matcher (`.png`, `.pdf`...) arrive jusqu'à `[locale]` ; `/apple-touch-icon-precomposed.png` n'est protégé que parce qu'un fichier existe dans `public/` (le test le teste). Les URLs inconnues non-image sont redirigées 307 `/foo` -> `/fr/foo` -> 404 : deux sauts pour un 404 | Acceptable. Optionnel : 404 direct sans passer par `/fr` |
| LOW | `src/app/[locale]/not-found.tsx:9,41` | (code mort si HIGH non corrigé) utilise `font-(family-name:--font-playfair)` et `--font-lora` qui n'existent plus (polices du site : cinzel/cormorant/raleway) ; liens `next/link` `href="/"` et `/#menu` non localisés (308 vers /fr même pour un visiteur EN) | Utiliser `Link` de `@/i18n/navigation`, polices existantes |
| LOW | `src/app/api/hours/route.ts:60` etc. | `revalidateTag(TAG, 'max')` = stale-while-revalidate : après une modification admin (horaires, carte), le premier visiteur reçoit encore l'ancienne page, la mise à jour n'arrive qu'à la visite suivante. Conséquence directe du passage en ISR, non signalée dans le rapport 18 | Documenter, ou `revalidateTag(TAG, { expire: 0 })` si l'admin attend un effet immédiat |
| LOW | `src/utils/seo.ts:41`, `PUBLISHED_PATHS` | Export presque mort (utilisé seulement par tests) | Supprimer ou garder seulement en test |
| LOW | `src/utils/supabase/middleware.ts` | Helper `updateSession` toujours inutilisé (préexistant, noté dans le CLAUDE.md) | Supprimer |
| LOW | `.planning/.../19a-BUILD-REPORT.md:25`, `messages/*.json` (about.story1, couple*) | Phrases « son mari français, Frédéric » + clés `couplePhotoAlt`/`coupleCaption` encore publiées (déjà signalé par 19a, hors périmètre) | Décision propriétaire |
| LOW | `src/app/[locale]/layout.tsx:56-59` (client) | `PlausibleScript`/`AttributionCapture`/`FloatingContact`/`NewsletterPopup` dans le layout statique : OK, aucune fuite de contenu utilisateur détectée. `src/app/[locale]/layout.tsx` n'importe aucun `cookies()`/`headers()` ; seuls `review` et `newsletter/unsubscribe` lisent la requête et restent `ƒ` | Aucune (vérifié : pas de fuite par cache public) |

## Points vérifiés sans défaut

- Aucune clé i18n manquante (fr/en/de/sv : 0 manquant, 0 en trop ; aucune valeur de gettingHere/wineBeer identique à l'EN).
- Plus de « couple franco-thaï » dans les 4 langues (restent les clés/identifiants et « son mari »).
- Slugs traduits : `/fr/venir-depuis-ao-nang`, `/de/anreise-von-ao-nang`, `/sv/vin-belgisk-ol-krabi`, `/fr/vins-bieres-belges-krabi` en 200 ; slug EN interne `/fr/getting-here-from-ao-nang` redirige 307 vers le slug traduit.
- `/` -> 308 `/fr` ; `/xx`, `/nope` -> 307 `/fr/...`.
- /api, /auth/callback, /admin gardent la session (middleware) ; review/newsletter/wifi aliases sans session ; aucune route ne dépend du `layout.tsx` supprimé.
- Pas de fuite de contenu personnalisé dans une page publique mise en cache.

## NON prouvé dans cette passe

Lighthouse, polyfills 14 Ko, cache `/gcm/js/script.js` (pas de variable Plausible), `x-vercel-cache`, rendu Rich Results du Menu.
