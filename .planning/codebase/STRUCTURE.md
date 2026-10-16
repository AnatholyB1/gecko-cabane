# Codebase Structure

**Analysis Date:** 2026-10-16

## Directory Layout

```
gecko-cabane/
├── src/
│   ├── app/
│   │   ├── [locale]/         # Public localized pages (layout, page, error, not-found)
│   │   ├── admin/            # Admin UI (French only): login, signup, hours, menu, announcement, reservations, tables, settings
│   │   ├── api/              # REST Route Handlers (+ mcp)
│   │   ├── auth/callback/    # Supabase OAuth/email callback
│   │   ├── sentry-example-page/
│   │   ├── layout.tsx, globals.css, manifest.ts, opengraph-image.tsx, global-error.tsx, not-found.tsx
│   ├── components/           # Shared components; ui/ for primitives (GcDivider)
│   ├── i18n/                 # config.ts, navigation.ts, request.ts
│   ├── types/database.ts     # All shared types
│   ├── utils/                # resend.ts, sentry.ts, validation.ts, supabase/{server,client,middleware,index}.ts
│   ├── middleware.ts
│   ├── instrumentation.ts / instrumentation-client.ts
├── messages/                 # fr.json, en.json
├── supabase/migrations/      # 001_opening_hours ... 006_phone_verifications (.sql)
├── tests/                    # Vitest: api-validation.test.ts, i18n.test.ts
├── public/                   # Images, botanical SVGs, brand/ sources, icons
├── docs/superpowers/         # Plans and specs (visual redesign)
├── sentry.server.config.ts, sentry.edge.config.ts
├── next.config.ts, vitest.config.ts, eslint.config.mjs, postcss.config.mjs, tsconfig.json
└── CLAUDE.md (claude.md)     # Project instructions
```

## Directory Purposes

**`src/app/api/`:**
- One folder per resource with `route.ts` exporting HTTP verb functions.
- Key: `reservations/`, `menu/{pages,categories,items,reorder,upload}/`, `tables/{[id],assignments,configurations/[id]}/`, `verify/{send,check}/`, `auth/{login,logout,signup}/`, `hours/`, `special-hours/`, `announcement/`, `settings/`, `mcp/`. `sentry-example-api/` is a demo route.

**`src/app/admin/`:**
- Each section is `<section>/page.tsx` (client component); auth uses colocated `actions.ts` server actions. Dynamic: `menu/[pageId]/page.tsx`.

**`src/components/`:**
- Public-site widgets: `AnnouncementBanner.tsx`, `HoursDisplay.tsx`, `LanguageSwitcher.tsx`, `MenuDisplay.tsx`, `ReservationForm.tsx`.

## Key File Locations

**Entry Points:** `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/middleware.ts`
**Configuration:** `next.config.ts`, `src/i18n/config.ts` (locales), `src/app/globals.css` (Tailwind v4 theme, `gc-*` tokens)
**Core Logic:** `src/app/api/**/route.ts`, `src/utils/*.ts`
**Testing:** `tests/*.test.ts` (included via `vitest.config.ts`)

## Naming Conventions

**Files:**
- Components: PascalCase `.tsx` (`ReservationForm.tsx`).
- Next special files lowercase (`page.tsx`, `route.ts`, `actions.ts`).
- Utilities: lowercase `.ts` (`validation.ts`).
- Migrations: `NNN_name.sql`, sequential.
- Tests: `kebab-case.test.ts` in `tests/`.

**Directories:** lowercase; dynamic segments `[param]`.

**Code:** DB tables `gecko_*` snake_case; types PascalCase interfaces; Tailwind custom tokens `gc-*` (e.g. `bg-gc-void`, `text-gc-gold`) with fonts `font-cormorant`, `font-cinzel`, `font-raleway`.

## Where to Add New Code

**New public section/feature:** UI in `src/components/`, compose in `src/app/[locale]/page.tsx`; add keys to both `messages/fr.json` and `messages/en.json`.
**New API endpoint:** `src/app/api/<resource>/route.ts`; validate input, return `{ error }` with status; add types to `src/types/database.ts`.
**New admin page:** `src/app/admin/<section>/page.tsx` (French strings, no i18n); link from `src/app/admin/page.tsx`. Admin paths are guarded by `src/middleware.ts` automatically.
**New table:** next `supabase/migrations/00N_*.sql` with `gecko_` prefix and RLS using `gecko_is_admin()`.
**Utilities:** `src/utils/`; Supabase access only through `src/utils/supabase/`.
**Tests:** `tests/<name>.test.ts`.
**MCP tool:** add `server.tool(...)` in `src/app/api/mcp/route.ts`.

## Special Directories

**`.next/`:** generated, not committed.
**`supabase/.temp/`:** CLI temp, untracked.
**`public/brand/`:** source brand images, committed.
**`.planning/`:** GSD planning docs.

---

*Structure analysis: 2026-10-16*
