# Architecture Patterns

**Domain:** Admin back-office redesign (v1.1) on an existing Next.js 16 / Supabase app
**Researched:** 2026-10-31
**Confidence:** HIGH for the integration points and the tables removal (read from the code and migrations). MEDIUM for the shell/component recommendations (judgment, not library-verified).

## Findings from the code (verified)

- `src/app/admin/layout.tsx` is 11 lines: metadata (`noindex`) and `return children`. There is no shell. Each page builds its own header and its own "Retour au tableau de bord" link. `/admin/login` and `/admin/signup` live in the same segment, so a shell placed in this layout would wrap them too.
- Admin pages (about 4,000 lines in total) are `'use client'` and fetch `/api/*` in `useEffect`. Only login, signup and logout use server actions (`logoutAction` is used in `admin/page.tsx` only).
- The auth boundary has three layers: middleware (`gecko_is_admin` RPC), `requireAdmin()` in `src/utils/auth.ts` on every route handler, and RLS. The redesign should not touch any of this.
- **Booking and availability do not depend on tables.** `gecko_create_reservation` (migration 008) sums `party_size` of `pending` and `confirmed` reservations within `table_block_duration_minutes` and compares the sum to `max_covers`. It never reads `gecko_tables*` or `gecko_table_assignments`. `POST /api/reservations` has no assignment logic either: the grep shows nothing in that file. `reservation-rules.ts` only uses `table_block_duration_minutes`.
- The tables feature is isolated in these places:
  - UI: `src/app/admin/tables/page.tsx` (809 lines).
  - API: `src/app/api/tables/{route,[id],assignments,configurations,configurations/[id]}`.
  - Reservations page: `src/app/admin/reservations/page.tsx`, the assignment modal, `allTables`, `assignments`, `availableConfigs`, `getTableStatus` and the `/api/tables*` fetches (about lines 44-170 and 560-760).
  - Dashboard: two links to `/admin/tables` in `admin/page.tsx` (lines 83 and 150).
  - Settings: `admin/settings/page.tsx` has a "Gestion des tables" block (about line 104) and wording that says the block duration reserves "la table".
  - Types: `RestaurantTable`, `TableConfiguration`, `TableConfigurationFormData`, `TableAssignment*` and `ConfigAvailability` in `src/types/database.ts`.
  - Tests: `tests/admin-routes-guarded.test.ts` lists the 5 tables routes at lines 26-30 and has an assignments test at line 63. `tests/migrations.test.ts` lists 4 `gecko_table*` tables in `REQUIRED_TABLES`.
  - Out of scope for removal: migrations. The four SQL tables stay in the database (milestone constraint).

## Recommended Architecture

### Shell and navigation: route group, not the existing layout

Create a route group `src/app/admin/(app)/` and move every authenticated page into it with `git mv`. Route groups do not change URLs. Leave `login/` and `signup/` outside the group.

```
src/app/admin/
  layout.tsx            (kept: metadata noindex only, plus the font/token wrapper)
  login/ signup/        (no shell)
  actions.ts            (logoutAction, kept)
  (app)/
    layout.tsx          NEW: Server Component, renders <AdminShell>
    page.tsx            dashboard
    reservations/ menu/ hours/ announcement/ avis/ kpi/ settings/
```

`(app)/layout.tsx` is a Server Component. It calls `createClient()` and `auth.getUser()` to show the user's email in the shell (the middleware has already gated the request). It renders `<AdminShell>`, a Client Component that holds the open or closed state of the nav drawer.

Navigation by breakpoint, which matches the three users:

| Viewport | User | Navigation |
|----------|------|------------|
| Phone (below `md`) | Chef | Top bar with page title, a bottom tab bar with 4-5 primary entries, the rest under "Plus". Touch targets of 44px or more. |
| Tablet (`md`) | Waiters | Icon rail on the left, labelled on hover or focus. |
| Desktop (`lg` and above) | Developer | Fixed sidebar with labels. |

The nav items live in one typed array, `src/app/admin/_components/nav.ts`. The sidebar, the bottom bar and the dashboard cards all read from it. Today the nav is hard-coded twice in `admin/page.tsx`, and that is how the dead `/admin/tables` link ended up in two places.

Use `usePathname()` in the nav component for the active state and `aria-current="page"`. Add a skip link and a `<main id="main">` landmark in the shell.

### Component boundaries

Put the shared admin components in `src/components/admin/`. This is distinct from the public components, which use the `gc-` palette and the public fonts. If a public component is reused, import it, do not copy it. Admin has no i18n, so strings are French literals.

| Component | New or modified | Responsibility | Talks to |
|-----------|-----------------|----------------|----------|
| `(app)/layout.tsx` | NEW | Server shell wrapper and user lookup | `AdminShell`, `utils/supabase/server` |
| `AdminShell`, `NavSidebar`, `BottomTabBar` | NEW (client) | Responsive navigation, drawer state | `nav.ts`, `usePathname` |
| `nav.ts` | NEW | Single source of truth for entries | shell and dashboard |
| `PageHeader` (title, actions, back) | NEW | Replaces the 8 hand-made headers | pages |
| `Button`, `IconButton`, `Field` (label, hint, error), `Input`, `Select`, `Textarea`, `Switch` | NEW | Form primitives with focus and error states | pages |
| `Card`, `Badge` (status, source), `Tabs` | NEW | Dense layout and reservation statuses | pages |
| `Modal`/`Sheet` (native `<dialog>`) | NEW | Replaces ad-hoc modals and `confirm()` | pages |
| `ConfirmDialog` | NEW | Replaces `window.confirm` | pages |
| `Toast` or `InlineMessage` | NEW | Replaces the `message: {type, text}` state copied in each page | pages |
| `Skeleton`, `EmptyState`, `ErrorState` | NEW | Loading, empty and error states (an explicit milestone requirement) | pages |
| `DataTable` or `ListRow` | NEW | Table on desktop, card list on phone | reservations, avis |
| `src/lib/admin-fetch.ts` (`adminFetch`, `useAdminQuery`) | NEW | Wraps `fetch`, parses `ApiResponse<T>`, handles 401 and 403 by redirecting to login, returns `{data, error, loading, refetch}` | `/api/*` |
| `globals.css` admin tokens | MODIFIED | Add admin tokens (`--ad-*`: surface, border, density, focus ring, status colours). Use the `@theme inline` syntax. | all |
| `admin/page.tsx` | MODIFIED | Dashboard reads `nav.ts`, drops the tables card, becomes a Server Component with a counts summary if the audit keeps it | shell |
| Each admin page | MODIFIED | Rebuilt on the shared components, split into small files | components |

### Data fetching

Do not rewrite everything as Server Components. Recommended rule per page:

- **Read-mostly pages** (dashboard, kpi, avis): Server Component fetches with `createClient()` and passes data to small client islands. This removes a request waterfall and the "loading spinner then content" flash on the phone. The pages are authenticated, so there is no cache or SEO concern.
- **Interactive pages** (reservations, menu, hours, announcement, settings): keep the client fetching. Move it behind `useAdminQuery`, so every page gets the same loading, empty, error and refetch behaviour. Do not add SWR or TanStack Query. One 40-line hook is enough and avoids a new dependency during a tight milestone. Revisit only if optimistic updates become painful.
- Mutations keep calling the existing `PUT/POST/DELETE /api/*` routes. Do not convert them to server actions: the routes are already validated, guarded, tested (`admin-routes-guarded`) and used by the MCP and n8n flows. The only server actions stay login, signup and logout.
- Keep business logic out of the new components (project rule). The reservations page still contains inline logic. Extract pure helpers to `src/utils/` (for example a `reservation-view.ts` for grouping by day and status labels) so Vitest covers them in node.

### Form and state pattern

- One pattern: local `useState` for draft values, `Field` for label, hint and error, one `useAdminMutation` that sets `pending`, calls the route, and raises a toast. Validation messages come from the API (`ApiResponse.error` and `code`), as today.
- Disable the submit button while pending and keep the input values on error.
- Replace `confirm()` with `ConfirmDialog`. Destructive actions (delete reservation, delete menu item) need it. Verify keyboard focus return after closing.
- The React Compiler is on (`reactCompiler: true`). Do not add `useMemo` or `useCallback` by habit. Avoid mutating props and refs during render.

## Data flow changes

Reservations are unchanged in the public path. The admin change is only that `GET /api/reservations` is the single data source for the reservations page and the `/api/tables/assignments` request disappears. No new endpoint is needed for the shell. Reservations per day, status filter and manual reservation (`ManualReservationForm.tsx`, `manual-reservation.ts`) keep their routes.

## Safest sequence to remove the tables feature

Principle: remove callers before callees, keep the database, and keep tests green at every step. Each step is its own commit and must pass `npm run build` (which runs Vitest).

1. **Gate on the audit decision.** The owner confirms that placement is dropped (already in the milestone). Check production for rows in `gecko_table_assignments` only for information. No migration will touch them, so the check has no blocking effect.
2. **Lock the contract first.** Before deleting anything, add a test that `POST /api/reservations` and the availability check never reference `gecko_tables`, `gecko_table_assignments` or `table_configuration`. `tests/reservations-post.test.ts` and `reservation-rules.test.ts` already pin `max_covers` and `table_block_duration_minutes`. Keep those tests untouched. They are the regression net for "reservations and availability keep working".
3. **Remove the UI callers.**
   - Reservations page: delete the assignment modal, `allTables`, `assignments`, `availableConfigs`, `assignTable`, `unassignTable`, `getTableStatus`, and the table badge (about lines 44-170, 560-760).
   - Dashboard: delete the two `/admin/tables` links.
   - Delete `src/app/admin/tables/`.
   - Check that the app compiles and the reservations list renders without tables data.
   - If the reservations page is being rebuilt, do this removal before the rebuild, in the same step as extracting the dead code. It keeps the diff of the rebuild small.
4. **Remove the API.** Delete `src/app/api/tables/` entirely. In the same commit update `tests/admin-routes-guarded.test.ts` (remove the 5 paths and the assignments test). Anything that still calls the routes would now get a 404, so run `grep -rn "api/tables"` first and expect zero hits in `src/`.
5. **Remove the types.** Delete `RestaurantTable`, `TableConfiguration`, `TableConfigurationFormData`, `TableAssignment`, `TableAssignmentWithDetails`, `ConfigAvailability` from `src/types/database.ts`. `tsc` finds any leftover use. This must come after steps 3 and 4.
6. **Settings.** Keep `max_covers` and `table_block_duration_minutes` in `/api/settings` and in the database, because the RPC reads them. Change only the wording on the settings page: rename to "Durée d'occupation d'un créneau" and explain that it is used to count overlapping covers, not to hold a table. Remove the "Gestion des tables" block. Do not rename the setting key (it is read by `gecko_create_reservation`; renaming means a migration and an RPC change).
7. **Docs and tests of the schema.** Update `CLAUDE.md` and `.planning/codebase/*` (the data model lists four table tables and `/admin/tables`). In `tests/migrations.test.ts` leave `REQUIRED_TABLES` as is: the tables stay in the baseline and the test is about the migration files, not about use. Add a comment that they are kept on purpose and unused.
8. **Do not add a drop migration.** The milestone forbids destructive migrations without the owner's agreement. If the owner later agrees, a `019_drop_tables_feature.sql` drops the four tables in one transaction after a backup. Note that `gecko_table_assignments` has a unique key on `reservation_id`, so drop order is assignments, configuration_tables, configurations, tables.

Risk notes: the MCP route (`/api/mcp`) does not reference tables (checked by grep), so availability for AI assistants is unaffected. The n8n webhooks are outbound only. External callers of `/api/tables/*` are not expected, but the route list is admin-only (`requireAdmin`), so a 404 is safe.

## Suggested build order

Dependencies drive the order. The removal comes early because it shrinks the biggest page (reservations, 874 lines) before it is redesigned.

1. **Audit** (owner-validated) per page: keep, simplify, merge or delete. This decides what gets rebuilt and avoids redesigning pages that will be removed. No code.
2. **Tables removal, steps 2 to 7 above.** Independent of the design system, reduces the reservations page and the dashboard.
3. **Design foundation:** admin tokens in `globals.css`, primitives (`Button`, `Field`, `Input`, `Card`, `Badge`), `adminFetch`/`useAdminQuery`, and the state components (`Skeleton`, `EmptyState`, `ErrorState`, `Toast`). Add a small internal `/admin/_kit` page, or a Vitest-free visual checklist, to review them on the three viewports. Nothing user-facing changes yet.
4. **Shell:** route group move (`git mv`, no URL change), `(app)/layout.tsx`, `AdminShell`, `nav.ts`, `PageHeader`. Move the pages as they are first, so every page gets navigation immediately and the old per-page headers can be deleted gradually. Check that login and signup still render without shell and that the middleware matcher is unchanged. Check for tests or scripts that read `src/app/admin/...` paths.
5. **Dashboard** on `nav.ts` (small, validates the shell).
6. **Page rebuilds, by value and size:** reservations first (most used by waiters and the largest; also needs the tablet layout), then hours and announcement (small forms, validate the form pattern), menu (370 lines, two pages), avis, kpi, settings. Each page is one plan and is shippable alone.
7. **Accessibility and responsive pass** across all pages (focus order, labels, contrast, 44px targets, 360px width) and the docs update.

## Anti-Patterns to Avoid

- **Putting the shell in `admin/layout.tsx`.** It would wrap login and signup. Use the route group.
- **Converting all pages to Server Components in one go.** High regression risk for no user-visible gain on interactive pages.
- **Rebuilding reservations before removing placement.** You would redesign code that is about to be deleted.
- **Renaming `table_block_duration_minutes` or touching `gecko_create_reservation`.** The RPC is the atomic capacity guard. Only change labels.
- **Dropping the SQL tables** or editing the 007 baseline. Not allowed in this milestone, and the baseline test expects them.
- **Reusing public `gc-` styles for admin.** They are tuned for marketing pages and will fight the dense layout. Share tokens only where useful.
- **Adding a UI kit dependency** (shadcn, Radix, MUI) in the middle of the milestone. Native `<dialog>`, `<details>` and a few primitives cover the needs with no bundle cost. If a headless library is wanted, `@radix-ui` dialog is the only candidate worth considering, and only if `<dialog>` focus handling proves insufficient.

## Scalability Considerations

Not a concern here: one restaurant, three or four concurrent users. The only scaling item is the reservations list. `GET /api/reservations` has no pagination, so keep the date-range filters (`startDate`, `endDate`) as the default query (today and the next 7 days) rather than loading all reservations. `src/utils/paginate.ts` exists if needed.

## Gaps and flags

- Not verified: whether other files read `src/app/admin/**` paths (tests, scripts, Sentry config). Grep before the `git mv`.
- Not verified: whether the `kpi` and `avis` pages could be Server Components without changing their API usage. Decide during their rebuild.
- Not verified: production data in `gecko_table_assignments`. Informational only.
- Admin tokens: the existing `--primary`, `--jungle-dark`, etc. are public-site variables. Decide in the audit whether admin keeps the brand colours or a neutral palette (the milestone says "sobre et dense").

## Sources

- Code read: `src/app/admin/layout.tsx`, `src/app/api/reservations/route.ts`, `src/utils/auth.ts`, `supabase/migrations/008_reservation_booking.sql`, `src/app/admin/reservations/page.tsx`, `admin/page.tsx`, `admin/settings/page.tsx`, `src/types/database.ts`, `tests/admin-routes-guarded.test.ts`, `tests/migrations.test.ts`, `.planning/PROJECT.md` (HIGH).
- Route groups do not affect URL paths: Next.js App Router convention (training knowledge, MEDIUM; standard and stable).
