# Phase 10 : Suppression de la gestion de salle - Contexte

**Milestone :** v1.1 · **Exigences :** TAB-01..TAB-06 · **Dépend de :** phase 9

## Périmètre

Retirer le plan de salle et le placement des réservations (admin + API + types), sans changer la prise de réservation, la capacité, la machine à statuts, les emails, le cron d'avis J+1 ni les KPI.

## Décisions

- **D-01** Le propriétaire a décidé que le plan de salle n'a aucun intérêt pour 40 couverts : la fonctionnalité est supprimée, pas masquée.
- **D-02** Les tables SQL `gecko_tables`, `gecko_table_configurations`, `gecko_table_configuration_tables`, `gecko_table_assignments` restent en base. Aucune migration, aucun accès base. La révocation de lecture publique relève de ACC-01 (accord du propriétaire).
- **D-03** La disponibilité repose uniquement sur `gecko_create_reservation` (migration 008) : somme des couverts `pending`+`confirmed` dans la fenêtre `table_block_duration_minutes`, refus si `max_covers` (40 par défaut) dépassé. Cette logique n'est pas modifiée.
- **D-04** Les clés `max_covers` et `table_block_duration_minutes` ne changent pas ; seuls les libellés admin changent (« Durée d'occupation d'un créneau », sans le mot « table »).
- **D-05** Édition de `src/app/admin/reservations/page.tsx` MINIMALE et localisée (retrait état, fetchs, bouton « Placer », puces d'affectation, modal). La phase 15 réécrira cette page.
- **D-06** Une fonction pure `hasCapacity(booked, party, max)` (dans `src/utils/reservation-rules.ts`) porte la règle « 40 passent, le 41e est refusé » côté TypeScript (outil MCP `check_availability`), et rend la règle testable sans base.
- **D-07** Les tests de garde (`admin-routes-guarded`) perdent les 5 routes tables et le test des affectations dans le même commit que la suppression des routes. `mcp-route-tables.test.ts` contrôle le préfixe `gecko_` des requêtes MCP (pas la fonctionnalité) : inchangé.
- **D-08** `tests/kpi-docs.test.ts` lisait `.planning/REQUIREMENTS.md` et `ROADMAP.md` v1.0, remplacés par ceux du milestone v1.1 : il est repointé vers `.planning/milestones/v1.0-*.md` (déviation, nécessaire pour que Vitest, donc le build, soit vert).

## Canonique

- `.planning/ROADMAP.md` (phase 10), `.planning/REQUIREMENTS.md` (TAB-01..06), `.planning/STATE.md`
- `.planning/research/ARCHITECTURE.md` (liste des appelants des tables)
- `supabase/migrations/007_gecko_baseline.sql`, `008_reservation_booking.sql`

## Différé

- Réécriture de la page réservations : phase 15. Déplacement des pages admin : phase 12. Navigation partagée : phase 12.
- Révocation de lecture publique `gecko_table*` : ACC-01. Suppression des tables SQL : hors périmètre.
- Docs historiques (`.planning/phases/01-*`, `.planning/codebase/*`, `.planning/research/*`) citant `/admin/tables` : laissés en l'état (archives).
