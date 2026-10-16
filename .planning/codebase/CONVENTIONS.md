# Coding Conventions

**Analysis Date:** 2026-10-16

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` in `src/components/` (`AnnouncementBanner.tsx`, `ReservationForm.tsx`); UI primitives in `src/components/ui/` (`GcDivider.tsx`).
- Next.js route files use framework names: `page.tsx`, `layout.tsx`, `route.ts`, `actions.ts`, `error.tsx`, `not-found.tsx`.
- Utilities: lowercase `.ts` (`src/utils/validation.ts`, `src/utils/resend.ts`, `src/utils/sentry.ts`).
- Dynamic segments: `[locale]`, `[pageId]`, `[id]`.
- Tests: `tests/<topic>.test.ts` (kebab-case).

**Functions:**
- camelCase. Predicates prefixed `is` (`isE164Phone`, `isPartySizeValid`, `isOtpCode`); validators `validateXxx`; normalizers `normalizePhone`.
- React page/component default exports PascalCase (`AdminReservationsPage`, `AnnouncementBanner`).
- Route handlers are named exports of HTTP verbs: `GET`, `PUT`, `POST`, etc.
- Server Actions: `xxxAction` in `actions.ts` with `'use server'` (`logoutAction` in `src/app/admin/actions.ts`).

**Variables:**
- camelCase locally; SCREAMING_SNAKE_CASE for module constants (`STATUS_LABELS`, `OCCASIONS`, `BG_CLASSES`, `RESEND_FROM_EMAIL`).
- Database columns/body fields are snake_case (`customer_phone`, `reservation_date`, `is_active`, `bg_color`) and are used as-is in TS objects.
- Tables are prefixed `gecko_` (`gecko_announcement`, `gecko_reservations`).

**Types:**
- PascalCase, centralized in `src/types/database.ts` (`Reservation`, `ReservationStatus`, `RestaurantTable`, `Announcement`, `ApiResponse<T>`). Import with `import type { ... } from '@/types/database'`.

## Code Style

**Formatting:**
- No Prettier/Biome config. Style observed: 2-space indent, single quotes, no semicolons, trailing commas in multiline literals, aligned object values occasionally.
- Some files contain trailing whitespace on blank lines (e.g. `src/app/api/announcement/route.ts`); do not add more.

**Linting:**
- ESLint 9 flat config `eslint.config.mjs` extending `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Run `npm run lint`.
- TypeScript `strict: true` (`tsconfig.json`); `isolatedModules`, `moduleResolution: bundler`.
- React Compiler enabled via `babel-plugin-react-compiler`.

## Import Organization

**Order (observed):**
1. Framework/third-party (`next/server`, `react`, `next/link`)
2. Internal via alias (`@/utils/supabase/server`, `@/utils/validation`)
3. Type imports (`import type { ... } from '@/types/database'`)

**Path Aliases:**
- `@/*` -> `./src/*` (tsconfig). Tests use relative paths (`../src/utils/validation`).

## Error Handling

**API route handlers** (`src/app/api/**/route.ts`):
- Wrap body in `try { ... } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }`.
- Supabase errors: `return NextResponse.json({ error: error.message }, { status: 500 })`.
- Auth check on mutating routes: `const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.
- Success: `NextResponse.json({ data })`.
- Missing-table fallback codes `PGRST116` / `42P01` return default data (`src/app/api/announcement/route.ts`).
- Use `createAdminClient()` (service role) only in server code where RLS blocks public access, with a comment justifying it (`src/app/api/reservations/route.ts`).
- Validation uses pure helpers from `src/utils/validation.ts` that return `string | null` (error message) or boolean; user-facing validation messages are in French.

**Client components:**
- `try/catch` around `fetch`, state `message: { type: 'success' | 'error'; text: string } | null` for admin feedback; `loading` boolean state.

## Logging

**Framework:** Sentry helpers in `src/utils/sentry.ts` (`log.info/warn/error`, `metrics.count/gauge/distribution`, `measure`) with dotted event names (`reservation.created`) and flat context objects. Raw `console.*` is used in ~29 places in `src/`; prefer the Sentry helpers for new code.

## Comments

**When to Comment:**
- Section banners `// -----...` with a title in utility and test files.
- File-header block comments (`/** ... */`) describing purpose and usage (`src/utils/validation.ts`, `src/utils/sentry.ts`, tests).
- Inline comments explain security/RLS rationale and business rules. Comments are in English or French; admin UI strings and some inline comments are French.

**JSDoc:** One-line `/** ... */` above exported utility functions.

## Function Design

**Size:** Route handlers are long single functions per verb; pure logic is extracted to `src/utils/validation.ts` when testable.

**Parameters:** Route handlers take `Request`/`NextRequest`; dynamic routes take `{ params }`. Validators take `unknown`/`Record<string, unknown>` and narrow.

**Return Values:** Validators return `boolean` or `string | null`. API returns `{ data }` or `{ error }`.

## Module Design

**Exports:** Default export for pages/components; named exports for utilities, route verbs, and actions. Supabase clients are exported from `src/utils/supabase/server.ts` (`createClient`, `createAdminClient`), `client.ts`, with a barrel `src/utils/supabase/index.ts`.

**Barrel Files:** Only `src/utils/supabase/index.ts`.

## Project-Specific Rules (from `CLAUDE.md`)

- Public pages under `src/app/[locale]/` must use `useTranslations()` / `getTranslations()`; add keys to both `messages/fr.json` and `messages/en.json` (enforced by `tests/i18n.test.ts`). Admin pages (`src/app/admin/`) are fixed French, no i18n.
- Components using hooks/events start with `'use client'`; prefer Server Components for initial data fetches.
- Tailwind v4 syntax: `bg-(--gc-jungle)`, not `bg-[var(--gc-jungle)]`; theme vars in `src/app/globals.css`.
- Server Components/Route Handlers use `createClient` from `src/utils/supabase/server.ts`; client components use `src/utils/supabase/client.ts`. Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Validate all user input in API routes; never return stack traces.
- Type API responses with `ApiResponse<T>` (note: currently sparsely used).

---

*Convention analysis: 2026-10-16*
