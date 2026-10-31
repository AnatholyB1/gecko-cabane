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
| (aucune) | | | | |

## Décisions du propriétaire
- 2026-10-31 : plan approuvé en entier ; P10 démarre sans attendre la validation complète de P9 (suppression des tables déjà décidée).

## Ouvert
- Validation des maquettes (une fois par vague), verdicts d'audit, retours cheffe/serveurs (AUDIT-04).
