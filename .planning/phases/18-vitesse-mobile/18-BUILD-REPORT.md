# Phase 18 : build report (B18, PERF-01 à PERF-06)

Branche `phase/18-perf`, issue de `milestone/v1.2`, fusionnée avec le milestone avant le gate.

## Cause réelle du `private, no-cache, no-store` (PERF-01, D-02)

Avant : `next build` marquait TOUTES les routes `/[locale]/*` comme `ƒ` (dynamique) et `next start` répondait
`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` sur /fr /en /de /sv.

Causes, par ordre d'importance :
1. `src/app/layout.tsx` (layout racine) appelait `getLocale()` de next-intl : cela lit `headers()`, donc tout l'arbre devient dynamique. Le layout racine s'exécute avant `[locale]/layout.tsx`, donc `setRequestLocale` ne pouvait pas l'en sauver.
2. `src/app/[locale]/page.tsx` appelait `getTranslations()` sans locale (même lecture des en-têtes).
3. Le middleware appelait `supabase.auth.getUser()` sur chaque page publique (latence réseau, pas la cause du no-store mais contraire à D-01).

Corrections :
- `src/app/layout.tsx` supprimé. Deux layouts racine : `src/app/[locale]/layout.tsx` (`<html lang={locale}>`, `setRequestLocale(locale)`, `getMessages({ locale })`) et `src/app/admin/layout.tsx` (`<html lang="fr">`). Polices et métadonnées communes dans `src/app/fonts.ts` (mêmes 4 polices, mêmes options, aucune double charge).
- `setRequestLocale(locale)` + `getTranslations({ locale })` dans la home, menu, privacy et les 5 pages guides.
- `src/middleware.ts` : décision de routage pure dans `src/utils/middleware-routing.ts` (`classifyPath`). Les pages publiques retournent `intlMiddleware(request)` sans créer de client Supabase ; la session reste pour `/admin`, `/api`, `/auth` (garde admin inchangé). Les alias (review/avis/bewertung/newsletter/wifi) et `/monitoring` restent en passe-plat.
- `/[locale]/wifi` : `private, no-store` conservé (`force-dynamic` + en-tête `next.config.ts`). `/[locale]/newsletter*` et `/[locale]/review` restent dynamiques (searchParams / headers).

## Preuve locale (build + `next start -p 3103`, curl -sI)

| Route | Avant | Après |
|---|---|---|
| /fr /en /de /sv | `private, no-cache, no-store, max-age=0, must-revalidate` | `s-maxage=3600, stale-while-revalidate=31532400` (`x-nextjs-cache: HIT`) |
| /fr/menu | idem no-store | `s-maxage=3600, stale-while-revalidate=31532400` |
| /fr/privacy | idem no-store | `s-maxage=31536000` |
| /fr/wifi | `private, no-store` | `private, no-store` (inchangé, voulu) |
| /fr/review | no-store | no-store (dynamique, voulu) |

Sortie `next build` : `/[locale]`, menu, privacy et les 5 pages guides passent de `ƒ` à `●` (SSG, revalidate 1 h via les `unstable_cache` existants).
Le HTML contient `<html lang="en">` etc. (lang correct sans en-têtes).

## Lighthouse mobile local (3 passes, médiane, throttling mobile par défaut, Chromium Playwright, `next start`)

| | Score | LCP | TBT | FCP | CLS | unsized-images |
|---|---|---|---|---|---|---|
| /fr avant | 75 | 5,04 s | ~330 ms | 1,06 s | 0 | 2 |
| /fr après | 74 | 5,18 s | 310 ms | 1,07 s | 0 | 0 |
| /en avant | 74 | 5,01 s | 340 ms | 1,06 s | 0 | 2 |
| /en après | 74 | 5,16 s | 318 ms | 1,06 s | 0 | 0 |

Lecture honnête : le lab local ne bouge pas en score (bruit de ±3 points entre séries ; une série intermédiaire donnait 79 / TBT 195, non reproduite). Le gain visé (HTML servi par le CDN, plus de rendu serveur ni d'aller-retour Supabase par visite) ne se mesure pas avec `next start` en local : il faut la prod.
LCP = le H1 (Cinzel Decorative), 91 % de « render delay » en simulation Lantern. Mesure réelle (Playwright, CPU x4 + réseau 1,6 Mb/s/150 ms) : LCP H1 à 2,17 s, un seul candidat. Le 5 s de Lighthouse est une estimation simulée, pas un LCP observé.

## Autres points

- PERF-02 polices : déjà `next/font/google`, subset latin, `display: swap`, preload auto (4 woff2 `.p.`), aucun chargement externe ; un seul chargement (pas de doublon trouvé). Inchangé, déplacé dans `src/app/fonts.ts`.
- PERF-03 JS : `NewsletterPopup` chargé via `next/dynamic` (`NewsletterPopupLazy.tsx`, ssr false : il ne rend rien avant déclenchement). Composants publics restés serveur sauf ceux qui ont des hooks. Les 14 Ko « legacy JS » (Lighthouse) sont le module de polyfills de Next (Array.prototype.at/flat/flatMap, Object.fromEntries/hasOwn, trimStart/End) dans le chunk principal ; un `browserslist` moderne dans `package.json` ne les retire PAS (testé, build vérifié, revert). Non résolu.
- PERF-04 Plausible : `PlausibleScript` en `lazyOnload` (le stub `plausible.q` reste défini avant, aucun événement perdu) ; en-tête `Cache-Control: public, max-age=604800, stale-while-revalidate=86400` sur `/gcm/js/script.js` (ajout localisé dans `next.config.ts`, fusionné proprement avec les en-têtes de sécurité de B20a). Non vérifié par curl : le rewrite n'existe que si `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` est défini (absent localement) ; couvert par un test de contrat sur la source.
- PERF-05 images : `width`/`height` sur les 3 `<img>` bruts de la home (gecko-mark 503x800 avec `width: auto`, lotus 300x320) ; le gecko du footer est `loading="lazy"`. Les `next/image` avaient déjà leurs dimensions ou `fill`. Lighthouse `unsized-images` : 2 -> 0.
- Comparaison visuelle (Playwright, iPhone 14 et 1440, reduced motion, captures hors git) : /en identique au pixel près (0 pixel de différence) sur mobile et desktop. /fr : hauteur différente (+176 px mobile, +48 px desktop) car la base de comparaison est le milestone avant fusion de la phase 19a, qui a ajouté ~105 lignes à `messages/fr.json` ; le diff de `page.tsx` entre base et final ne contient que mes changements.

## Gate (après `git merge milestone/v1.2`)

`npx vitest run` : 145 fichiers, 2438 tests passés (1 skipped) ; `npx tsc --noEmit` : 0 erreur ; `npm run lint` : 0 erreur, 2 warnings préexistants (`generate-review-print.mjs`, `<img>` lotus) ; `npm run build` : OK ; `tsc` de nouveau : 0 erreur.
Nouveaux tests : `tests/middleware-routing.test.ts` (classification des routes, middleware sans Supabase sur le public, garde admin conservé, contrat « pas de app/layout.tsx / pas de getLocale », wifi no-store, cache Plausible). `middleware-matcher`, `analytics-wiring`, `seo-pages` adaptés.

## NON prouvé

- `x-vercel-cache: HIT` (seulement en ligne : DEPLOY-CHECKLIST-v1.2). Local : `x-nextjs-cache: HIT` et `s-maxage`.
- Un gain de score/LCP/TBT Lighthouse local : aucun mesuré (dans le bruit).
- Le cache de `/gcm/js/script.js` par curl (pas de variable d'environnement Plausible en local).
- Retrait des 14 Ko de polyfills (non résolu).
- Comparaison visuelle /fr contre une base strictement équivalente en contenu.
- Le middleware ne rafraîchit plus la session sur les pages publiques (décision D-01) : un admin connecté qui ne visite que le site public ne voit plus son jeton rafraîchi tant qu'il n'ouvre pas /admin ou /api.

## Incident de coordination

Au tout début, un `rmdir` de nettoyage a supprimé `.planning/.machine-lock` alors que je n'avais pas pris le verrou (`mkdir` avait échoué). Le verrou d'un autre builder a donc été retiré brièvement ; je n'ai ensuite lancé build/gate que sous mon propre verrou.
