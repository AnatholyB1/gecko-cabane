# Milestone v1.2 - journal de run (orchestrate-milestone)
Branche d'intégration : `milestone/v1.2` (worktree `.claude/worktrees/integration-v1.2`), base `master` (pas de branche `main`). Jamais poussée ni déployée. Racine `.planning/` (pas de `--ws`).
Ports : orchestrateur 3100 · builders 3103-3108 · auditeurs 3110+. Gate : `npx vitest run`, `npx tsc --noEmit`, `npm run lint`, `npm run build` (puis tsc de nouveau).
Reprise : lire ce fichier puis le dernier commit de chaque branche.

## Plan approuvé 2026-11-09
| Vague | Contenu | État |
|---|---|---|
| 1 | B18 PERF-01..06 (phase/18-perf) ∥ B19a ONP-04..09 (phase/19a-pages) ∥ B20a SEC-01..04 (phase/20a-headers) ∥ audit base (Lighthouse, contrastes, cibles, aria) | à lancer |
| 2 | après B18 : B19b ONP-01,02,03,10 ∥ B20b SEC-05 CSP ∥ B20c A11Y-01..03 | |
| 3 | audits par phase, corrections, PERF-07 mesure locale | |

## Décisions du propriétaire (2026-11-09)
Plan approuvé ; middleware sans Supabase sur le public ; CSP appliquée + vérifiée ; H1 DE/SV en brouillon à relire.

## Fusions
| Étape | Branche | Commit | Gate | Remarques |
|---|---|---|---|---|
| B20a en-têtes SEC-01..04 | phase/20a-headers | c40fd64 | 140 fichiers / 2242 tests ; tsc, lint (0 erreur), build verts | CSP non faite (vague 2) ; règle wifi ne couvre pas de/sv (no-store par rendu dynamique seulement : à revoir après B18) |
| Audit de base | audit/v1.2-baseline | merge | docs seulement | Lighthouse local /fr 98, /en 96 (LCP ~1,2 s) : PERF-07 déjà atteint en local, l'écart avec 72 vient du réseau/TTFB en ligne ; a11y : 9 groupes contraste, 13 cibles < 48 px, 3 aria-label |
| B19a pages SEO ONP-04..09 | phase/19a-pages | merge | 144 fichiers / 2411 tests ; tsc, lint (0 erreur), build verts | de/sv noindex, hors sitemap/hreflang tant que non relus ; accord propriétaire à refaire pour la page FR vin/bière et les 12 phrases DE/SV modifiées ; « son mari Frédéric » (about.story1 etc.) non touché : décision propriétaire |
| B18 vitesse PERF-01..06 | phase/18-perf | merge | 145 fichiers / 2438 tests ; lint, build verts ; tsc vert après build (types .next périmés avant) | cause : layout racine `getLocale()` (headers) + home sans locale ; deux layouts racine (`[locale]`, `admin`) ; `/fr` etc. = SSG 1 h ; wifi/review/newsletter restent dynamiques ; Lighthouse local inchangé (~75 sous le throttling simulé de ce build, LCP H1) |
## Vague 2 lancée 2026-11-09 : B19b (3104) · B20b CSP + wifi 4 langues (3105) · B20c a11y (3106) · audits vague 1 revue/sécurité/vérification (3111-3113)
| Audit vérification vague 1 | audit/w1-verify | merge | docs seulement | PERF-04 FAILED (JS 948 Ko vs 925 Ko master) ; PERF-02/05 PARTIAL ; risque : `set-cookie: NEXT_LOCALE` sur pages cachées (CDN) ; ONP-04/05 de/sv noindex (attendu) ; à corriger dans le lot de corrections vague 1 |
| Audit revue vague 1 | audit/w1-review | merge | docs seulement | 1 HIGH (404 non localisées : not-found global sans lang/polices depuis la suppression de app/layout.tsx), 4 MED (JSON-LD Menu inLanguage faux, tests qui figent la source, wifi de/sv, privacy de/sv en repli EN), 7 LOW |
| Audit sécurité vague 1 | audit/w1-security | merge | docs seulement | 0 critique/haut, 1 MED (cookie NEXT_LOCALE sur pages cachées : `localeCookie:false`), wifi de/sv, `GET /api%2Fhours` 500 (bruit), garde admin intacte |
| B20b CSP SEC-05 + wifi 4 langues | phase/20b-csp | merge | 146 fichiers / 2444 tests ; lint, build, tsc verts | CSP appliquée (`src/utils/csp.ts`), `unsafe-inline` sur script-src (pas de nonce : cache public) ; 0 violation en navigateur local (Maps, Plausible, Sentry simulés) |
| B20c a11y A11Y-01..03 | phase/20c-a11y | merge | 146 fichiers / 2444 tests ; lint, build, tsc verts | Lighthouse a11y 94 -> 100 (local) ; jeton --gc-brass-ink ; min-h-12 (18 fichiers) ; écarts visuels mineurs (pages 20-190 px plus hautes, pied de page plus clair) ; débordement horizontal du header sous 390 px préexistant (ticket à part) |
| B19b H1 + metas ONP-01,02,03,10 | phase/19b-home-meta | merge | voir gate suivant | H1 dans le hero à la place du sous-titre (clé hero.h1) ; 1 H1 sur 89 URLs ; H1 DE/SV brouillons ; /menu /wifi /review H1 peu descriptifs (hors liste) |
| Corrections routage vague 1 | fix/w1-routing | merge | 148 fichiers / 2452 tests ; lint, build, tsc verts ; check:build-output OK | 404 localisées par réécriture middleware vers `[locale]/not-found-fallback` (catch-all impossible avec dynamicParams=false) ; `localeCookie:false` ; JSON-LD Menu sans inLanguage ; `/api%2Fhours` 500 laissé (non comparé à master) |
| PERF-04 JS | fix/w1-js | merge | tests verts ; lint, build, tsc verts | -11,6 % gzip /fr (scripts + HTML) : messages client filtrés (14 namespaces) + libphonenumber différé ; Sentry client (~74 Ko gzip) non touché (décision propriétaire) ; cible « ~60 Ko inutilisés » non atteinte |
| Audit sécurité vague 2 | audit/w2-security | merge | docs seulement | 0 critique/haut ; 1 MED : 404 réécrit en force-dynamic/no-store (coût serveur sous scan) -> cache court s-maxage=60 ; 5 LOW (img-src blob:, font-src data: inutiles ; CSP sur les assets ; 308 sans en-têtes) ; Maps réel et CDN non prouvés |
| Vérification finale | audit/final-verify | merge | docs seulement | 26 exigences : 14 VERIFIED, 8 PARTIAL (PERF-02/04/05, ONP-03/04/05/09, A11Y-02), 1 FAILED (PERF-07 : Lighthouse local médiane /fr 73, /en 75 ; master 75/74 dans les mêmes conditions ; LCP ≈ 4,8 s = logo Cinzel Decorative), 1 HUMAN GATE (ONP-11). Incohérence : l'audit de base avait mesuré 96-98 : mesures non comparables, dépendantes de la machine et des données |
| Audit revue vague 2 | audit/w2-review | merge | docs seulement | 1 HIGH (LanguageSwitcher : usePathname de next/navigation -> erreur d'hydratation #418 et sélecteur absent du HTML sur pages SEO fr/de/sv), 1 MED (CSP bloque l'aperçu des photos de plat admin : img-src sans Supabase), 4 LOW (promesse libphonenumber rejetée gardée, clés hero.tagline/subtitle orphelines, tests de config), débordement 390 px des sous-pages préexistant |
## Lot final de corrections lancé : fix-w2-core (3107) · fix-w2-lcp (3108)
| fix-w2-core | fix/w2-core | merge | gate vert côté agent (151 fichiers / 2462 tests ; lint, build, tsc, check:build-output) ; gate d'intégration différé : le verrou machine (19:31) est tenu par fix-w2-lcp qui mesure Lighthouse (un build lourd fausserait ses mesures) | LanguageSwitcher sans #418 ; CSP : Supabase + https: sous /admin seulement ; 404 en s-maxage=60 ; ONP-03 ; clé hero.tagline retirée |
| fix-w2-lcp PERF-07 | fix/w2-lcp | 9b5b834 | 151 fichiers / 2462 tests ; lint, build, tsc, check:build-output verts | cible 90 non atteinte en local : médiane 73-75 (simulation Lighthouse : le bundle JS local arrive avant l'instant LCP) ; seul gain conservé : image du gecko 49 -> 13,5 Ko ; hypothèse police réfutée ; /fr/menu +22 Ko = prefetch Link, non corrigé |
## Milestone v1.2 prêt pour la recette (2026-11-09). Reste : décisions et actions du propriétaire (voir DEPLOY-CHECKLIST-v1.2.md), déploiement uniquement sur son accord. Branche `milestone/v1.2` non poussée.
