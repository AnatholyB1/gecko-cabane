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
