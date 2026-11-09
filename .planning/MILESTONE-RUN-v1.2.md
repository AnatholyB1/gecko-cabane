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
