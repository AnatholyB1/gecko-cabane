# Domain Pitfalls

**Domain:** In-place redesign of a live restaurant admin back-office plus removal of the table-assignment feature (milestone v1.1)
**Researched:** 2026-10-31
**Overall confidence:** HIGH for codebase-specific findings (read from the repo), MEDIUM for generic UX/a11y/Tailwind/React Compiler guidance (training knowledge, not re-verified against current docs)

Codebase facts below were verified by grep or reading `C:\gecko-cabane` on 2026-10-31. Generic guidance is marked MEDIUM.

---

## Critical Pitfalls

### Pitfall 1: Deleting the tables code breaks the build through source-reading tests
**What goes wrong:** `npm run build` runs `vitest run` first. Several tests read source files as text and fail on missing files or changed strings:
- `tests/admin-routes-guarded.test.ts` lists `src/app/api/tables/route.ts`, `[id]`, `assignments`, `configurations` and `configurations/[id]` explicitly, and has a dedicated test for `GET /api/tables/assignments`. Deleting those routes makes `read()` throw, so the build fails.
- `tests/kpi-admin-wiring.test.ts` asserts `href="/admin/kpi"` appears exactly 2 times in `src/app/admin/page.tsx`, and requires the literal strings `Rapports TEST envoyés`, `Sources non disponibles`, `KPI hebdomadaires` and `Chargement` in the SSR-rendered KPI page. It also bans `bg-[var`, `next-intl` and `useTranslations`.
- `tests/menu-admin-wiring.test.ts` requires `is_gluten_free: itemForm.is_gluten_free` and `'Sans gluten (confirmé par la cheffe)'` in `src/app/admin/menu/[pageId]/page.tsx`.
- `tests/review-badges.test.ts` hard-codes class strings (`bg-gray-100 text-gray-600`, `bg-blue-100 text-blue-700`, `bg-amber-100`, `bg-green-100`). Moving to semantic design tokens breaks these.
- `tests/migrations.test.ts` requires the 007 baseline to create and enable RLS on `gecko_tables`, `gecko_table_configurations`, `gecko_table_configuration_tables` and `gecko_table_assignments`. That is consistent with the decision to leave the tables in the database. Do not "clean up" the baseline.

**Why it happens:** Wiring tests were written as cheap guards (v1.0 debt: "no real automated tests"). They assert implementation text, not behaviour.

**Consequences:** A red build blocks every deploy, so a hotfix cannot ship during high season. The usual bad reaction is to weaken or delete the tests, which also removes the security guards they carry (admin-only checks on PII routes).

**Prevention:**
1. Before touching code, run `grep -rln "tables\|admin/" tests/` and write a "test impact list": which tests to delete, which to update, which to keep untouched.
2. Delete the `/api/tables/*` entries from the `admin-routes-guarded` list in the same commit that deletes the routes. Keep the generic "every remaining admin route calls `requireAdmin()`" assertion. Preferably make that test enumerate `src/app/api/**/route.ts` dynamically, so a future deletion never needs a manual list edit.
3. Add a negative test: `src/app/api/tables` and `src/app/admin/tables` do not exist, and no source file references `/api/tables`. This pins the removal.
4. Update string-literal tests by changing the test to match behaviour. Where a test pins Tailwind colour classes (`review-badges`), either keep the badge function's output stable or move the assertion to a semantic key (variant name), then map to classes in the UI.
5. Keep the ~1365 test count honest. Record the before and after counts in the phase summary.

**Detection:** `npx vitest run` fails with ENOENT on a `read()`, or with `toContain` failures on admin page strings, right after the first deletion or reskin.

**Phase:** Tables removal phase (first). Re-check in every page-redesign phase, since each touches a source-reading test.

---

### Pitfall 2: Removing "tables" accidentally touches availability and capacity
**What goes wrong:** The vocabulary overlaps. `table_block_duration_minutes` is a live setting used by `src/utils/reservation-rules.ts` (`computeLastBookableMinutes`) and by the atomic capacity RPC in `supabase/migrations/008_reservation_booking.sql`. Its name contains "table" but it is not part of the table-management feature. A search-and-delete on "table" can remove or rename the setting key, the settings page entry or the `/api/settings` allow-list (`['table_block_duration_minutes', 'max_covers']`).

**Why it happens:** Naming debt. The setting really means "how long a booking holds its seats".

**Consequences:** The public form silently offers wrong last-bookable times, or the RPC falls back to a default and over- or under-books. This is the real core-value regression (reservation in under 60 seconds, no overbooking of 40 covers). There is no table-level check in the RPC to catch it.

**Prevention:**
1. Do not rename the DB key or the `/api/settings` allow-list. Change only the admin label (for example "Durée d'occupation d'un créneau") and the helper text.
2. Confirm by reading the 008 RPC that capacity depends only on `gecko_reservations` plus `gecko_restaurant_settings`, never on `gecko_table_assignments`. (Grep shows only `table_block_duration_minutes` matches in 008, so this holds. Re-verify in the phase.)
3. Keep `tests/reservation-rules.test.ts` ("honours table_block_duration_minutes") and `tests/reservations-post.test.ts` green and unmodified. These are the regression net for availability.
4. Run a manual smoke test on a preview deployment: book at the last slot, book to exactly 40 covers, then one more (must be refused).

**Detection:** Any diff touching `reservation-rules.ts`, `api/settings/route.ts` or migration 008 in the removal phase is a red flag.

**Phase:** Tables removal phase.

---

### Pitfall 3: Reservation status workflow regresses during the page rewrite
**What goes wrong:** `src/app/admin/reservations/page.tsx` (874 lines) mixes status actions, manual reservation creation, source editing, notes, review badges and the table-assignment modal and floor plan in one client component. Rewriting it can drop or change:
- `PUT /api/reservations` semantics: whitelisted fields (`status`, `admin_notes`, `source`), `confirmed_at` / `cancelled_at` stamping, and the Resend confirmation or cancellation email. Both are triggered only when the status becomes `confirmed` or `cancelled`.
- Status values (`pending → confirmed → completed / cancelled / no_show`). The review-invitation cron (`/api/cron/review-invitations`) selects with `.in('status', REVIEW_ELIGIBLE_STATUSES)` (`confirmed`, `completed`). `no_show` has its own branch. KPI collection counts `confirmed` and `completed` as covers.
- The review-state badges (invitation sent, clicked, reminder) and `review_*` columns.

A "simplification" that merges `confirmed` and `completed` into one button, auto-completes past reservations, or lets a double-click send a second confirmation email changes what customers receive and what the KPI report counts.

**Why it happens:** The status machine is implicit in the UI and the API. The UI redesign tempts a redesign of the workflow itself ("fewer buttons").

**Consequences:** Guests get no J+1 review email, or no-shows get one. Duplicate confirmation emails. KPI covers drift. All of it is invisible until a customer complains.

**Prevention:**
1. Treat the status workflow as frozen. Redesign only presentation. Any change to status semantics goes through the owner-validated audit (the milestone's first deliverable).
2. Extract a pure `reservation-status` helper (allowed transitions, labels, badge variants) with unit tests before rewriting the page. The page then consumes the helper.
3. Disable action buttons while a request is in flight (loading state), to prevent double-submit and double email. Use optimistic UI only with rollback on error.
4. Keep `API PUT` untouched in this milestone, except removing nothing. Add API-level tests for transitions if missing.
5. Reconcile every `status` string literal in the rewritten page against `RESERVATION_STATUSES` in `src/types/database.ts`.
6. Manual UAT checklist on preview: pending → confirmed (email received), confirmed → completed, confirmed → no_show, pending → cancelled (email received), edit a note, create a manual phone reservation.

**Detection:** `grep -rn "'completed'\|'no_show'" src` count drops, or the review cron dry run (`?dry=1`) lists a different set of recipients than before the change.

**Phase:** Reservations page redesign phase. Do the status helper extraction first.

---

### Pitfall 4: Orphaned DB objects and RLS exposure left behind by "leave the tables in place"
**What goes wrong:** The decision is to keep `gecko_tables*` in the database with no destructive migration. Consequences to manage:
- `gecko_table_assignments`, `gecko_table_configurations`, `gecko_table_configuration_tables` and `gecko_tables` keep `Public read ... for select using (true)` policies (baseline lines about 455 to 473). The baseline header already flags the assignment table as exposing reservation timing. With the app gone, nothing needs anonymous read, yet it stays open. This is a standing exposure, and `migrations.test.ts` only checks PII tables.
- `gecko_table_assignments.reservation_id` has `on delete cascade` from reservations. Harmless, but any future reservation delete or purge touches a dead table.
- Existing assignment rows are invisible to everyone, and the shared Supabase project holds another app, so someone may later assume the tables are in use.
- TypeScript types (`RestaurantTable`, `TableConfiguration`, `TableAssignment`, `ConfigAvailability`, and others in `src/types/database.ts`) will be left dangling or deleted inconsistently.

**Why it happens:** Non-destructive is the right call for a live system. The cost is forgotten loose ends.

**Prevention:**
1. Add a non-destructive migration (new numbered file, for example 019) that only revokes: `drop policy "Public read gecko_table_*"` on the four tables and keep the admin policy. That is reversible and needs no data loss. Because it changes production policy, get the owner's agreement and apply it through the normal migration flow. Alternatively, record it as explicit follow-up debt if not agreed.
2. Do not drop tables or columns in this milestone. Document in the migration comment and in `PROJECT.md` that the four tables are deprecated and to be dropped in a later milestone after a backup export.
3. Before the policy change, check that no public page or the MCP route queries these tables (grep shows `api/mcp/route.ts` has no table references, and `tests/mcp-route-tables.test.ts` only enforces the `gecko_` prefix).
4. Delete the unused types in `src/types/database.ts` in the same change as the code. `tsc` then proves nothing else imported them.
5. Update `CLAUDE.md` and the codebase docs (data-model table) so the next session does not rebuild the feature. Mark the four tables as deprecated.
6. Never run `supabase/legacy/` (already a rule). `legacy/005_tables.sql` is a trap: it is the original tables migration.

**Detection:** `grep -rn "gecko_table" src` should return nothing after removal. Supabase advisors flag the open `using (true)` policies.

**Phase:** Tables removal phase (code and types). The policy-revoke migration may be a separate owner-approved step.

---

### Pitfall 5: In-place redesign of a live site ships a half-migrated admin to production
**What goes wrong:** Vercel deploys on push, so each merged page goes straight to the real restaurant. A new design system applied page by page leaves a mixed UI: some pages with new tokens, some with old `bg-white rounded-2xl shadow-lg` cards, inconsistent navigation, and a dashboard (`admin/page.tsx`) still linking to a removed `/admin/tables` (it links in two places, around lines 83 and 150). That dead link returns a 404 to the chef.

**Why it happens:** No feature flag, no staging admin, and the redesign touches 8 pages (4000+ lines) plus the layout.

**Consequences:** Staff confusion on service days, with the chef on a phone. Worse, a broken reservations page at dinner service costs money.

**Prevention:**
1. Order the work: (a) remove tables and fix all links and dashboard cards first, (b) build tokens and shared components and the admin shell (`layout.tsx` is only 11 lines now, so there is a lot of room) with no page changed, (c) migrate pages from least critical to most critical (announcement, hours, settings, menu, avis, kpi), (d) reservations last, since it is the most critical and the most complex.
2. Use Vercel preview deployments for owner validation per page before merging to master. Merge reservations only outside service hours (Krabi time, UTC+7; open 12h to 22h).
3. Keep a rollback path: one PR per page, so `git revert` or Vercel instant rollback restores a page without touching others.
4. Add a link check test: every `href="/admin/..."` in `src/app/admin/**` and shell navigation resolves to an existing `page.tsx`.
5. Do not change the URL structure (`/admin/reservations`, etc.). The middleware admin gate, `middleware-matcher.test.ts` and bookmarks depend on it.

**Detection:** A 404 from any admin nav item; visual inconsistency between pages in the preview.

**Phase:** Foundation phase (shell and ordering) and every page phase.

---

## Moderate Pitfalls

### Pitfall 6: Touch targets, dense tables and sticky actions fail on phone and tablet
**What goes wrong:** The audience is the chef on a phone, waiters on a tablet, and a developer on desktop. A "sober and dense" style tends to produce 28 to 32 px controls, wide data tables that scroll horizontally, and hover-only affordances.
**Prevention (MEDIUM, standard guidance: WCAG 2.2 target size 24 px minimum, iOS and Android guidance 44 to 48 px):**
- Interactive controls at least 44 px tall on touch, even when the visual style is dense. Increase hit area with padding, not font size. Use `pointer: coarse` or a `touch:` custom variant to enlarge targets on touch devices only, so desktop stays dense.
- Do not render the reservations list as a wide table below `md`. Use stacked rows or cards with the key fields (time, name, party size, status) and one primary action. Keep a real `<table>` with `<th scope>` on desktop.
- Sticky action bars: use `position: sticky` or `fixed` bottom bars with `padding-bottom: env(safe-area-inset-bottom)` and `100dvh` instead of `100vh`, since iOS Safari's dynamic toolbar hides bottom bars. Add matching scroll padding so the last row is not hidden behind the bar.
- Destructive or status actions (cancel, no-show) must be separated from confirm by spacing and require confirmation, to prevent mis-taps. Replace `confirm()` browser dialogs (used in the current page) with an accessible dialog.
- No hover-only information (tooltips, `title`) for essential data, because touch has no hover. Review badges currently use `title` for the send time.
- Test on real widths: 360, 768, 1024 and 1440 px, plus landscape tablet.
**Phase:** Design-system phase (touch variant, spacing scale, table-to-cards pattern); verified in each page phase.

### Pitfall 7: Accessibility is promised but not enforced
**What goes wrong:** The current admin uses emoji as icons (🗺️, 🪑, ✕), colour-only status badges, `confirm()`, a hand-rolled modal, and `text-gray-*` on tinted backgrounds. Redesign claims "accessibility" but ships the same patterns in new clothes.
**Prevention (MEDIUM):**
- Status is never conveyed by colour alone: badge text plus icon, not just green or amber. Contrast at least 4.5:1 for text and 3:1 for UI components, checked for every token pair including disabled and badge variants.
- Modals: use native `<dialog>` or a tested primitive (focus trap, Escape to close, focus returned to trigger, `aria-modal`, `aria-labelledby`). Do not hand-roll again.
- Icon-only buttons need `aria-label` (the `✕` close button has none). Replace emoji icons with the Lucide icons already in the project.
- Form fields: real `<label for>` and `aria-describedby` for errors; do not rely on placeholders. Error and success messages announced with `role="status"` or `role="alert"` (the current `message` state is silent for screen readers).
- Visible focus ring (`focus-visible:`) on every control; do not strip outlines. Keyboard-complete flows for the developer on desktop.
- Loading, empty and error states are explicit for each list, and the skeleton or spinner has an accessible label.
- Automated check: add `eslint-plugin-jsx-a11y` rules (Next's config includes a subset) and consider axe checks in a manual pass. Automated tools catch only a fraction, so keep a short manual keyboard-and-zoom checklist.
- `lang="fr"` on admin root (it is outside `[locale]`; verify `src/app/layout.tsx` sets the language correctly, since the admin is French only).
**Phase:** Design-system phase builds accessible primitives once; page phases only compose them.

### Pitfall 8: Tailwind v4 gotchas when building a token system
**What goes wrong (MEDIUM; Tailwind v4 is CSS-first):**
- Using the v3 arbitrary syntax `bg-[var(--x)]` is banned by project rules and by `kpi-admin-wiring.test.ts` (regex `bg-\[var|border-\[var|text-\[var`). Use `bg-(--x)` or theme tokens.
- Tokens must be declared in `@theme` (or `@theme inline` when referencing other CSS vars) to generate utilities. A plain `:root` variable creates no `bg-foo` utility. Mixing the public site's tokens (`--primary`, `--jungle-dark`, `--warm-gold`) with a new admin token set in the same `globals.css` risks collisions and an admin that inherits the decorative public look.
- Dynamic class names built by string concatenation (`` `bg-${color}-100` ``) are not detected by the v4 scanner and get purged. The existing `BG_CLASSES` and badge maps must keep full literal class strings.
- v4 changed defaults versus v3 (default border colour is `currentColor`, ring width default is 1px, `outline-none` semantics became `outline-hidden`, important modifier moved to the end `class!`). Copying v3 snippets from the web yields subtle visual or focus-ring bugs.
- Dark-mode and `prefers-color-scheme`: decide explicitly (a work tool in a bright restaurant: probably light only). Do not half-implement.
- Scope the admin tokens: put them under an `[data-admin]` wrapper or a separate `admin.css` imported only by `src/app/admin/layout.tsx`, so public pages (SEO-critical, LCP already a debt) do not ship extra CSS and are never restyled.
**Prevention:** One token file, a short written palette and spacing and type scale, and a test or lint rule rejecting `-\[var\(` in admin sources.
**Phase:** Design-system phase.

### Pitfall 9: React Compiler (enabled) breaks patterns in rewritten client pages
**What goes wrong (MEDIUM):** `reactCompiler: true` auto-memoizes. In ported or new components:
- Mutating props, state or refs during render, or reading `ref.current` in render, makes the compiler skip the component or produce stale UI. Eslint (`eslint-config-next`, react-hooks v6 rules) now reports these as errors. `npm run lint` is not part of the build, so errors may only surface in CI or never.
- `useEffect` fetch-on-mount with unstable dependencies. The current admin pages fetch in effects, with `fetch(...).then(setState)` and no abort. Under the compiler plus Strict Mode, double effects produce duplicate requests and race conditions on filters.
- Calling `setState` synchronously inside an effect triggers the new `set-state-in-effect` lint error.
- Manual `useMemo` and `useCallback` are unnecessary and can mask issues. Do not add them "for performance".
- Compiler-incompatible third-party patterns (class instances in render, mutable module-level caches) can silently opt out.
**Prevention:** Run `npm run lint` in each page phase and treat react-hooks errors as blockers. Fetch with `AbortController` and ignore stale responses, or move initial reads to Server Components (project rule: prefer Server Components for initial fetches). Wrap one shared `useFetch` or `useApi` hook with loading, empty, error and abort handled, and reuse it for all pages. This also gives uniform states for free.
**Phase:** Design-system phase (shared data hook); lint gate in all page phases.

### Pitfall 10: Design-skill output drifts from the sober work-tool brief
**What goes wrong:** Design skills (impeccable and UX) tend toward distinctive, expressive output: large display type, gradients, glassmorphism, big rounded cards, decorative motion, brand fonts (Cinzel, Cormorant) and the public site's tropical palette. The admin is a dense work tool, used under time pressure, and the public brand look is not wanted there.
**Prevention:**
1. Write a one-page admin design brief before any skill call and paste it into every prompt: sans-serif system or single UI font (not the Cinzel family), max 2 to 3 type sizes in the body, neutral greys plus one accent plus semantic status colours, 4 to 8 px radii, no gradients, no shadows beyond one subtle elevation, no decorative animation (only `prefers-reduced-motion`-respecting state transitions), information first.
2. Reject drift at review: a checklist of "no hero headers, no emoji, no card-within-card, no animation on load, density at least current".
3. Anchor to the current page's information content. The redesign may remove chrome, not data the staff use (party size, occasion, notes, source, review state).
4. Get the owner to validate each page on a preview (audit before implementation is already a milestone rule). Skills propose; the audit's keep, merge or delete decisions are authoritative.
5. Shared components first: skills should be asked to build the 8 to 10 primitives (button, input, badge, dialog, table or list row, empty state, error state, skeleton, page header, toast) once, and pages must compose them, not re-invent styling.
**Detection:** Admin pages that import `next/font` display fonts, use `--warm-gold` or `--jungle-dark` decoratively, or gain animation libraries.
**Phase:** Design-system phase; checklist enforced in all page phases.

### Pitfall 11: Admin auth and security layering weakened by a refactor
**What goes wrong:** Authorization is layered: middleware (`gecko_is_admin` RPC), `requireAdmin()` in route handlers, RLS. A redesign that adds a shared shell layout, server actions or a new "me" endpoint can accidentally skip a layer, or log the service-role client into client code. `admin/layout.tsx` is a layout, so it does not replace per-route checks, and a nested layout can be bypassed by direct API calls.
**Prevention:** No new API route without `requireAdmin()`; keep the dynamic guard test (Pitfall 1). Never import `createAdminClient` into a `'use client'` file (`no-public-secrets.test.ts` exists, so keep it green). Keep `/admin/login` and `/signup` outside the shell. Check how `/admin/signup` is handled (it exists in the tree); the audit should decide whether to keep an open signup page in a production admin.
**Phase:** Foundation phase (shell) and tables removal.

---

## Minor Pitfalls

### Pitfall 12: Dead links and leftovers after removal
**What goes wrong:** Admin dashboard cards (`admin/page.tsx` lines about 83 and 150) point to `/admin/tables`; docs (`CLAUDE.md` data model, `.planning/codebase/`), `database.ts` types, and comments mention the floor plan.
**Prevention:** After deletion run `grep -rniE "tables|assign|plan de salle|floor" src tests CLAUDE.md` and resolve each hit (keep only `table_block_duration_minutes` and DB-level references).

### Pitfall 13: Duplicate `updateSession` helper left unused
**What goes wrong:** `src/utils/supabase/middleware.ts` is unused (documented). Touching admin auth in the shell may tempt wiring it in, producing two diverging implementations.
**Prevention:** Leave it alone or delete it as a separate, explicit cleanup. Do not wire it in this milestone.

### Pitfall 14: `confirm()` / `alert()` removal changes behaviour
**What goes wrong:** Replacing native dialogs with custom ones can lose the "are you sure" protection on destructive actions (cancel reservation, delete menu item, delete announcement).
**Prevention:** Inventory every `confirm(` in `src/app/admin` before the rewrite and require a one-to-one replacement via the shared dialog component.

### Pitfall 15: Menu cache and revalidation lost in menu page rewrite
**What goes wrong:** `menu-admin-wiring.test.ts` requires menu API routes to call `revalidateTag` with `MENU_TAG`. A rewrite that moves mutations (server actions, new endpoints) must keep that, or the public `/menu` page (SEO-critical) shows stale prices.
**Prevention:** Keep mutations on the existing API routes. Do not change the route layer in a UI milestone.

### Pitfall 16: Settings and KPI pages hold dangerous or stateful controls
**What goes wrong:** KPI page has the TEST vs live report mode guard (live not before 2026-11-16, and sending to third parties needs owner approval). A reskin that makes a send or mode button prominent, or one tap away on a phone, risks an accidental live send.
**Prevention:** Keep the existing confirmation and wording ("Rapports TEST envoyés"). Do not add one-tap send actions. Review with the owner in the audit.

### Pitfall 17: Timezone display of reservations
**What goes wrong:** The current page uses `toLocaleTimeString('fr-FR')` and `new Date(...)`, which depends on the viewer's device timezone. Krabi is UTC+7, and a developer elsewhere sees different times. A rewrite that formats dates differently can shift a reservation's displayed day or time. The project already has `krabiToday()` in the review cron.
**Prevention:** Reservation date and time are stored as local date and time strings; render them as strings (parse the parts), not via `new Date()` with timezone conversion. Reuse existing helpers and add a test with a non-Asia `TZ` setting.

---

## Phase-Specific Warnings

| Phase topic | Likely pitfall | Mitigation |
|-------------|---------------|------------|
| Audit of admin pages | Skills or dev decide keep, merge or delete without the owner; `admin/signup` and KPI controls overlooked | Owner validation gate before implementation; list each page, each control, and its usage |
| Tables removal | Build red from `admin-routes-guarded` (P1); touching `table_block_duration_minutes` (P2); orphaned policies (P4); dead dashboard links (P12) | Test impact list; remove the test entries with the routes; freeze reservation-rules; revoke-only migration with owner approval; link-check test |
| Design system (tokens, primitives, shell) | Wrong token scope in Tailwind v4 (P8); non-accessible modal (P7); style drift (P10); compiler lint errors (P9); touch sizes (P6) | Admin-scoped tokens, brief, shared `useApi` hook, accessible primitives built once |
| Reservations page redesign | Status workflow and email regressions (P3); double submit; timezone (P17); mobile list layout (P6) | Extract status helper with tests; freeze the PUT API; UAT checklist; do it last and outside service hours |
| Menu / hours / announcement / avis / settings / KPI pages | String-pinned tests (P1); cache revalidation (P15); KPI mode safety (P16); `confirm()` replacement (P14) | Read the relevant wiring test before editing; keep API routes unchanged |
| Final QA | Half-migrated UI, accessibility claims unverified | Keyboard and 200 percent zoom pass, 360 and 768 px pass, contrast check, full `npm run build` |

## Research Flags for Roadmap

- Tables removal phase: low research need (patterns are straightforward), but needs a concrete test impact list first.
- Reservations page redesign: needs a short phase-level design pass on the status workflow and mobile list layout; this is the highest-risk page.
- Revoking public SELECT policies on the four table tables: needs owner agreement and a check with Supabase advisors (the project is shared with another app, so confirm that nothing else reads `gecko_` tables).
- Accessibility primitives: decide between native `<dialog>` and a headless library (Radix or React Aria) in the design-system phase. This milestone's research did not verify current library versions; verify with Context7 before adding a dependency.

## Sources

- Repository inspection, 2026-10-31 (HIGH): `tests/admin-routes-guarded.test.ts`, `tests/kpi-admin-wiring.test.ts`, `tests/menu-admin-wiring.test.ts`, `tests/review-badges.test.ts`, `tests/migrations.test.ts`, `tests/reservation-rules.test.ts`, `src/app/api/reservations/route.ts`, `src/app/api/settings/route.ts`, `src/utils/reservation-rules.ts`, `src/app/admin/reservations/page.tsx`, `src/app/admin/page.tsx`, `supabase/migrations/007_gecko_baseline.sql`, `008_reservation_booking.sql`, `014_review_invitations.sql`, `.planning/PROJECT.md`, `CLAUDE.md`.
- Generic UX, accessibility, Tailwind v4 and React Compiler guidance (MEDIUM, from training knowledge, not re-verified in this session): WCAG 2.2 (target size, contrast, focus), Tailwind v4 upgrade notes, React Compiler and react-hooks lint rules. Verify specifics via Context7 or official docs before relying on exact rule names.
