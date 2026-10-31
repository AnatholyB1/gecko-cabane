# Milestone v1.1 - journal de run (orchestrate-milestone)

Branche d'intégration : `milestone/v1.1` (worktree `.claude/worktrees/integration-v1.1`). Jamais poussée, jamais déployée. Workstream : racine `.planning/` (pas de `--ws`).
Direction design : « luxe discret » (ivoire, vert jungle, laiton rare, sans-serif à chiffres tabulaires, cibles 44 px). Jetons `--adm-*` partagés par les maquettes D1-D4.

## Ports
orchestrateur 3100 · builders 3103-3108 (P10 = 3103, spike = 3104) · auditeurs 3110+

## Plan de vagues (approuvé 2026-10-31)
| Vague | Contenu | État |
|---|---|---|
| 0 | Maquettes D1 (système + shell), D2 (Aujourd'hui + Réservations), D3 (Site public + Carte), D4 (Réputation + accès) ; P9 audit ; P10 suppression des tables ; spike Base UI | lancée |
| 1 | P11 fondation (après validation des maquettes + spike) | |
| 2 | P12 shell (après P10 + P11) | |
| 3 | P13, P14, P15, P16 en parallèle (fusion : 13, 14, 16, puis 15) | |
| 4 | P17 + QA finale | |

## Fusions
| Étape | Branche | Commit | Gate | Remarques |
|---|---|---|---|---|
| P9 audit (6 documents) | phase/09-audit | d1a8f50 | docs seulement | verdicts à valider par le propriétaire |
| P10 suppression des tables | phase/10-tables-removal | fe7fac5 | vitest 98 fichiers / 1375 passés / 1 ignoré ; tsc, lint (0 erreur), build verts | `/api/tables` = 404 sur `next start` ; `kpi-docs.test` repointé vers les archives v1.0 |
| Spike Base UI (DSN-01) | spike/11-base-ui | c6d602e | idem | verdict ADOPTER `@base-ui/react` 1.9.0 |
| Maquettes D1-D4 (sans PNG) | design/d1..d4 | 1eb2bd4 | n/a | PNG laissés dans les worktrees d'origine ; revue de cohérence + galerie en cours |

| Correctif signup | fix/p9-signup-api | merge | 99 fichiers / 1378 tests ; build vert | `POST /api/auth/signup` supprimé (404) |
| Revue maquettes + tokens réconciliés | design/review | merge | lint 0 erreur | tokens D1 = source unique |
| P11 fondation du design | phase/11-design-foundation | 6ff044f | 107 fichiers / 1449 passés / 1 ignoré ; tsc, lint, build verts | Base UI, tokens `--adm-*`, primitives, `useAdminQuery`, `/admin/kit` ; non prouvé derrière la vraie garde admin |

## Décisions du propriétaire (2026-10-31, galerie)
Direction « luxe discret » validée · 5 entrées de nav à 12 px · mobile : ligne compacte + Détails, toast en haut, « + Réservation » en en-tête, flèches · « Complet ce soir » = dîner seul, par date, réversible · « sur 40 » = pic simultané · colonne `allergies` + no_show « Non présenté » / bouton « Absent » / « Rétablir » (à vérifier contre PUT) · prix en ฿, « Gérer les pages » replié, `price_label` gardé · note moyenne masquée sans collecte, live côté serveur seulement, dialogue avant alerte note ≤ 3 · invitation par lien 7 jours, droits admin complets, mot de passe oublié en phase 17.

## En cours (vague 2)
- P12 shell (`phase/12-shell-nav`, 3107) ; P15a logique réservations/Aujourd'hui (`phase/15a-logic`, 3108).
## Ancien (vague 0)
- P11 fondation (`phase/11-design-foundation`, port 3105) ; correctif `POST /api/auth/signup` (`fix/p9-signup-api`, 3106) ; revue de cohérence + galerie (`design/review`).

## Décisions du propriétaire
- 2026-10-31 : plan approuvé en entier ; P10 démarre sans attendre la validation complète de P9 (suppression des tables déjà décidée).

## Ouvert
- Validation des maquettes (une fois par vague), verdicts d'audit, retours cheffe/serveurs (AUDIT-04).
