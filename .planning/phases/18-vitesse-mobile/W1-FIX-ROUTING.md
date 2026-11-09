# W1-FIX-ROUTING : corrections routage et cache (branche fix/w1-routing)

Preuves obtenues sur `next build` + `next start -p 3107` (build de production).

## 1. [HIGH] 404 traduits : CORRIGE
Cause : sans `app/layout.tsx`, Next rend tout 404 SSR via `app/not-found.tsx` (arbre racine) ; un
`notFound()` levé dans une page `[locale]` ne rend jamais `[locale]/not-found.tsx` (testé : catch-all
`[locale]/[...rest]` => coquille `<html id="__next_error__">` vide + `NoFallbackError`, car le
`dynamicParams=false` du layout ferme aussi le catch-all ; `global-not-found` est expérimental, écarté ;
un `not-found` racine dynamique donne un `<html>` imbriqué, invalide).
Correction : `src/middleware.ts` réécrit (`NextResponse.rewrite`, statut 404) tout chemin inconnu sous
une locale valide vers `src/app/[locale]/not-found-fallback/page.tsx` (rend le `not-found` traduit dans le
layout, `force-dynamic`, noindex). Liste des chemins connus : `src/utils/middleware-routing.ts`
(`unknownLocalePathLocale`, PAGES + slugs traduits + wifi/review/newsletter*/opengraph-image).
Test `tests/not-found-routing.test.ts` : tout dossier de `src/app/[locale]` doit être enregistré (sinon 404).
`dynamicParams=false` conservé. Lien du 404 localisé (`@/i18n/navigation`).
curl : /fr/nope 404 `<html lang="fr">` "Page introuvable" ; /en/nope 404 lang=en "Page not found" ;
/de/nope 404 lang=de "Seite nicht gefunden" ; /sv/nope 404 lang=sv "Sidan hittades inte" ;
/en/menu/x 404 lang=en ; /foo => 307 /fr/foo => 404 lang=fr (fr par défaut) ; /nothing.png 404 (racine
statique fr, inchangé, hors matcher). /fr/restaurant-francais-krabi reste 200. Pas d'erreur serveur
liée (une `NoFallbackError` loguée vient du cas /api%2Fhours ci-dessous).

## 2. [MED] set-cookie NEXT_LOCALE : CORRIGE
`localeCookie: false` dans `src/i18n/routing.ts` (next-intl v4 : `boolean | CookieAttributes`).
curl -sI : /fr /en /de /sv /fr/menu /fr/opengraph-image => 0 `set-cookie`
(Cache-Control pages : `s-maxage=3600, stale-while-revalidate=31532400`). `/` => 308 `/fr` (aussi avec
`Accept-Language: de`). Le sélecteur de langue change la locale par l'URL (/fr, /en, /de, /sv servent chacun
sa langue ; la détection par cookie était déjà désactivée : `localeDetection: false`). Non testé au clic navigateur.

## 3. [MED] JSON-LD Menu `inLanguage` : CORRIGE
`inLanguage` retiré de `src/utils/menu-jsonld.ts` (données en une seule colonne, française). Test
`tests/seo-menu-jsonld.test.ts` : `not.toHaveProperty('inLanguage')`.

## 4. [MED] Contrat sur la sortie du build : CORRIGE
`scripts/check-build-output.mjs`, `npm run check:build-output` (à lancer APRÈS `next build`). Lit
`.next/prerender-manifest.json` et `.next/routes-manifest.json` : exige /[locale], menu, privacy et les 5
guides prérendus pour les 4 locales ; wifi, review, newsletter, newsletter/confirm, newsletter/unsubscribe
et not-found-fallback dynamiques, jamais prérendus. Saute (exit 0, message) si `.next` est absent. Hors
`vitest run` volontairement (vitest tourne avant le build et lirait un `.next` périmé).
Preuve : `check-build-output: OK (4 locales, 8 static + 6 dynamic routes checked)`.

## 5. [LOW] GET /api%2Fhours => 500 : NON CORRIGE, non comparé à master
Reproduit : 500 (`Attempted to handle request too many times`). `/admin%2Fx`, `/foo%2Fbar`, `/fr%2Fmenu`
=> 307, `/monitoring%2Fx` => 404 : seul le préfixe `/api` est concerné. La branche middleware `/api`
(passe-plat session) est identique avant B18 (commit 3373122^), donc pas de régression de B18 démontrée ;
le build master n'a pas été exécuté pour la comparaison. Non touché.

## Non traité (consigne)
privacy de/sv (repli EN, noindex : décision propriétaire), H1 menu/wifi/review, débordement header, PERF-04.
