<!-- refreshed: 2026-10-16 -->
# Architecture

**Analysis Date:** 2026-10-16

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  Browser (Next.js App Router)                │
├──────────────────┬──────────────────┬───────────────────────┤
│  Public site     │  Admin UI        │  External AI clients  │
│ `src/app/[locale]`│ `src/app/admin` │  (MCP over HTTP)      │
│ + client widgets │  (client pages,  │ `src/app/api/mcp`     │
│ `src/components` │  French only)    │                       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │ fetch('/api/..') │ fetch + server     │
         ▼                  ▼ actions            ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware `src/middleware.ts`                              │
│  Supabase session refresh -> admin guard -> next-intl routing│
├─────────────────────────────────────────────────────────────┤
│  Route Handlers `src/app/api/**/route.ts`                    │
│  validation (`src/utils/validation.ts`), email, SMS, Sentry  │
└────────┬────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Postgres + Auth + Storage (RLS, `gecko_*` tables)  │
│  `supabase/migrations/*.sql`                                 │
│  Also: Resend (email), Twilio Verify (SMS OTP), Sentry       │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Middleware | Session refresh, admin gate (`gecko_is_admin` RPC), locale routing | `src/middleware.ts` |
| Server Supabase utils | Cookie client, service-role client, `isGeckoAdmin` | `src/utils/supabase/server.ts` |
| Browser Supabase client | Client Component access | `src/utils/supabase/client.ts` |
| Landing page | Single-page composition of all sections | `src/app/[locale]/page.tsx` |
| Public widgets | Hours, menu, announcement, reservation form, language switch | `src/components/*.tsx` |
| Reservation API | Create/list/update reservations, send emails | `src/app/api/reservations/route.ts` |
| Phone verification | Twilio Verify OTP send/check | `src/app/api/verify/send/route.ts`, `src/app/api/verify/check/route.ts` |
| MCP server | Stateless MCP tools (menu, hours, availability) | `src/app/api/mcp/route.ts` |
| Email templates | Resend client + templates | `src/utils/resend.ts` |
| Validation | Reservation/phone validators | `src/utils/validation.ts` |
| Shared types | All DB/API types, `ApiResponse<T>` | `src/types/database.ts` |
| i18n | Locales, navigation, message loading | `src/i18n/config.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts` |

## Pattern Overview

**Overall:** Next.js App Router monolith with thin REST Route Handlers over Supabase (BaaS); client components fetch from own API.

**Key Characteristics:**
- Public pages are localized (`fr` default, `en`, prefix always); admin and API are not.
- Public client components (`HoursDisplay`, `AnnouncementBanner`, `MenuDisplay`) fetch `/api/*` in `useEffect`, not directly from Supabase.
- Admin pages are `'use client'` pages that call `/api/*`; only login/signup/logout use server actions (`src/app/admin/actions.ts`, `login/actions.ts`, `signup/actions.ts`).
- Authorization is layered: middleware guard + route-handler `auth.getUser()` + Postgres RLS via `gecko_is_admin()`.
- Supabase project is shared with another app, so all tables are prefixed `gecko_` (e.g. `gecko_reservations`) and admin membership is checked via `gecko_admins`.

## Layers

**Presentation:**
- Location: `src/app/[locale]/`, `src/app/admin/`, `src/components/`
- Depends on: `src/types/database.ts`, next-intl, `/api/*`

**Edge/Request:**
- Location: `src/middleware.ts`
- Depends on: `@supabase/ssr`, `next-intl/middleware`, `src/i18n/config.ts`

**API:**
- Location: `src/app/api/`
- Contains: Route Handlers per resource (announcement, auth, hours, menu/*, reservations, settings, special-hours, tables/*, verify/*, mcp)
- Depends on: `src/utils/supabase/server.ts`, `src/utils/validation.ts`, `src/utils/resend.ts`

**Data:**
- Location: `supabase/migrations/001..006_*.sql`

## Data Flow

### Primary Request Path (public reservation)

1. User fills `src/components/ReservationForm.tsx`; phone OTP via `POST /api/verify/send` then `/api/verify/check` (Twilio Verify).
2. `POST /api/reservations` validates (`validateReservationFields`, `isPartySizeValid`, `isReservationDateValid`) in `src/app/api/reservations/route.ts`.
3. Row inserted into `gecko_reservations` (service-role client where RLS blocks public access), then Resend emails to customer and restaurant.
4. Admin updates status in `src/app/admin/reservations/page.tsx` via PUT/PATCH on the same route; customer gets status email (`customerStatusEmail`).

### Public content read

1. Request hits middleware, locale redirect/rewrite to `/fr` or `/en`.
2. `src/app/[locale]/page.tsx` (server) renders translated shell with `getTranslations()`.
3. Client widgets fetch `/api/hours`, `/api/special-hours`, `/api/announcement`, `/api/menu/*` and render.

### Admin auth

1. Unauthenticated `/admin/*` -> redirect `/admin/login?redirect=...` (middleware).
2. Authenticated non-admin -> `signOut` and redirect with error message.

**State Management:** Local React `useState`/`useEffect` per component; no global store. Server state lives in Supabase.

## Key Abstractions

**Supabase client factories:**
- `createClient()` (cookie-bound, RLS as user) and `createAdminClient()` (service role) in `src/utils/supabase/server.ts`.

**Typed entities:** `OpeningHours`, `MenuPage/Category/Item`, `Reservation`, `RestaurantTable`, `TableConfiguration` in `src/types/database.ts`.

## Entry Points

**Root layout:** `src/app/layout.tsx`; locale layout `src/app/[locale]/layout.tsx`.
**Middleware:** `src/middleware.ts`.
**Instrumentation:** `src/instrumentation.ts` (loads `sentry.server.config.ts` / `sentry.edge.config.ts`), `src/instrumentation-client.ts`.
**MCP endpoint:** `POST /api/mcp` (`src/app/api/mcp/route.ts`).
**Auth callback:** `src/app/auth/callback/route.ts`.
**Metadata routes:** `src/app/manifest.ts`, `src/app/opengraph-image.tsx`.

## Architectural Constraints

- **Threading:** Serverless (Vercel), stateless; MCP runs in stateless mode.
- **Global state:** `NEXT_PUBLIC_SUPABASE_*` read at module level in `src/utils/supabase/server.ts` (inlined at build; Turbopack cache issue noted in comments).
- **Middleware matcher** excludes `/monitoring` (Sentry tunnel), static assets, image extensions; middleware also bypasses i18n for `/admin`, `/api`, `/auth`.
- **Build:** `npm run build` runs `vitest run` before `next build`; `reactCompiler: true` in `next.config.ts`.
- **Duplicate helper:** `src/utils/supabase/middleware.ts` (`updateSession`) is unused by `src/middleware.ts`, which inlines its own logic.

## Anti-Patterns

### Admin page data fetching in client components
**What happens:** Admin pages (`src/app/admin/hours/page.tsx`) are full client components with fetch + local state.
**Do this instead:** Follow existing pattern for consistency, but prefer Server Components for initial reads in new pages (per `CLAUDE.md`).

### Business logic in route handlers inline
**What happens:** `src/app/api/reservations/route.ts` mixes querying, availability, and email dispatch.
**Do this instead:** Extract reusable logic into `src/utils/` (as done with `validation.ts`, `resend.ts`).

## Error Handling

**Strategy:** Route handlers return `NextResponse.json({ error }, { status })`; try/catch with `console.error('[route]')` for external services; Sentry via `src/utils/sentry.ts`, `src/app/global-error.tsx`, `src/app/[locale]/error.tsx`, `onRequestError`.

## Cross-Cutting Concerns

**Logging:** `console.error` plus Sentry.
**Validation:** Manual validators in `src/utils/validation.ts`; zod only in the MCP route.
**Authentication:** Supabase Auth cookies; admin membership via `gecko_is_admin()` RPC.

---

*Architecture analysis: 2026-10-16*
