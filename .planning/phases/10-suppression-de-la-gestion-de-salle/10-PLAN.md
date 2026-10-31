# Phase 10 - Plan (en ligne)

| Exigence | Preuve (test) | Changement |
|----------|---------------|-----------|
| TAB-01 | `tests/tables-removal.test.ts` > « TAB-01 booking and availability reference no table object » (source route, manual, rules, MCP, SQL 008) + « 40 covers fit, the 41st is refused » (`hasCapacity`) | `hasCapacity` dans `reservation-rules.ts`, utilisé par MCP |
| TAB-02 | « no source file links to or fetches /admin/tables or /api/tables » + « has no admin/tables page and no api/tables route » | page `admin/tables`, modal/état/fetchs de placement, 2 liens du tableau de bord |
| TAB-03 | `tests/admin-routes-guarded.test.ts` (liste sans tables) + « has no admin/tables page and no api/tables route » ; vérif réelle `/api/tables` = 404 | suppression `src/app/api/tables/**` + entrées de test, même commit |
| TAB-04 | `tsc --noEmit` + « database.ts has no table floor-plan types » | types RestaurantTable, TableConfiguration, TableAssignment..., ConfigAvailability retirés |
| TAB-05 | « capacity settings keep their keys and no longer say "table" » | libellés admin settings |
| TAB-06 | `tests/tables-removal.test.ts` bloc « TAB-06 » + « SQL gecko_table* tables are still in the baseline » | test négatif |

Commits atomiques : (1) suppression UI+API+types+tests de garde, (2) libellés réglages, (3) hasCapacity + tests de contrat/négatif, (4) repointage kpi-docs, (5) docs de phase.
