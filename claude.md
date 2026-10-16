# Gecko Cabane — Claude Instructions

## Projet

Site web du restaurant **Gecko Cabane**, un restaurant Franco-Thaï gastronomique situé à Krabi, Thaïlande.  
Stack : **Next.js 16** (App Router) · **TypeScript** · **Tailwind CSS v4** · **Supabase** (PostgreSQL + Auth) · **next-intl** (i18n).

---

## Architecture

```
src/
  app/
    [locale]/          # Pages publiques (fr | en)
    admin/             # Interface d'administration (non localisée)
    api/               # Route Handlers Next.js (REST)
    auth/callback/     # Callback OAuth Supabase
  components/          # Composants réutilisables (client/server)
  i18n/                # Config next-intl
  types/database.ts    # Types TypeScript partagés
  utils/supabase/      # Clients Supabase (server, client, middleware)
  middleware.ts        # Auth Supabase + routing i18n
messages/
  fr.json              # Traductions françaises (locale par défaut)
  en.json              # Traductions anglaises
supabase/migrations/   # Migrations SQL (Supabase CLI)
```

## Commandes

```bash
npm run dev     # Serveur de développement (localhost:3000)
npm run build   # Build de production
npm run lint    # ESLint
```

---

## Règles de développement

### Internationalisation (i18n)
- La locale par défaut est **`fr`**. Les deux locales supportées sont `fr` et `en`.
- Toute chaîne de texte visible dans `src/app/[locale]/` **doit** passer par `useTranslations()` (client) ou `getTranslations()` (server).
- Ajouter systématiquement la clé dans **les deux** fichiers `messages/fr.json` et `messages/en.json`.
- Les pages admin (`src/app/admin/`) sont en français fixe, sans i18n.

### Supabase
- Utiliser `createServerClient` (depuis `src/utils/supabase/server.ts`) dans les Server Components et Route Handlers.
- Utiliser `createBrowserClient` (depuis `src/utils/supabase/client.ts`) dans les Client Components.
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client.
- Les variables d'environnement requises : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Les migrations SQL se trouvent dans `supabase/migrations/` (numérotées séquentiellement).

### Tailwind CSS v4
- Le projet utilise Tailwind v4. Les classes arbitraires avec variables CSS s'écrivent `bg-(--var-name)` ou `text-primary` (via `@theme inline` dans `globals.css`), **pas** `bg-[var(--var-name)]`.
- Les variables CSS du thème sont définies dans `src/app/globals.css` (`:root` + `@theme inline`).
- Variables disponibles : `--primary`, `--primary-dark`, `--accent`, `--accent-light`, `--warm-white`, `--warm-gray`, `--warm-gold`, `--jungle-dark`, `--bamboo`, `--tropical`, `--leaf-green`, `--moss`.

### Composants
- Les composants qui utilisent des hooks React (`useState`, `useEffect`, etc.) ou des événements doivent commencer par `'use client'`.
- Les Server Components sont privilégiés pour les fetches de données initiales.
- Ne pas ajouter de logique métier dans les composants UI — la garder dans les Route Handlers ou les utilitaires.

### API Routes
- Toutes les routes API sont dans `src/app/api/`.
- Valider systématiquement les entrées utilisateur (types, longueurs, formats) avant tout traitement.
- Retourner des erreurs structurées : `{ error: string }` avec le bon code HTTP.
- Ne jamais retourner de stack traces en production.

### Types
- Tous les types de base de données sont centralisés dans `src/types/database.ts`.
- Toujours typer les réponses API avec `ApiResponse<T>`.

---

## Modèle de données (Supabase / PostgreSQL)

| Table | Description |
|-------|-------------|
| `gecko_opening_hours` | Horaires par jour de la semaine (0=Dimanche) |
| `gecko_special_hours` | Horaires exceptionnels par date |
| `gecko_announcement` | Bannières d'annonce (avec plages de dates) |
| `gecko_menu_pages` | Pages de menu (ex: Déjeuner, Dîner) |
| `gecko_menu_categories` | Catégories au sein d'une page |
| `gecko_menu_items` | Plats avec prix, allergènes, drapeau végétarien/épicé |
| `gecko_reservations` | Réservations clients avec statut workflow |
| `gecko_restaurant_settings` | Réglages clé/valeur (max_covers, table_block_duration_minutes) |
| `gecko_tables` | Tables physiques du plan de salle |
| `gecko_table_configurations` | Combinaisons de tables (capacité min/max) |
| `gecko_table_configuration_tables` | Liaison configuration ↔ tables |
| `gecko_table_assignments` | Affectation réservation ↔ configuration (blocage horaire) |
| `gecko_admins` | Membres admin, vérifiés par `gecko_is_admin()` |
| `gecko_phone_verifications` | Legacy (vérification SMS), supprimée en phase 1 |

Projet Supabase partagé : toutes les tables sont préfixées `gecko_` ; baseline = `supabase/migrations/007_gecko_baseline.sql` ; `supabase/legacy/` ne doit jamais être appliqué.

Statuts de réservation : `pending` → `confirmed` → `completed` / `cancelled` / `no_show`.

---

## Contexte métier

- Restaurant à **Krabi Town**, Thaïlande (Maharat Road).
- **Chef Jariya** — cuisine Franco-Thaï gastronomique.
- **40 couverts maximum**. Fermé le mardi. Cuisine jusqu'à 22h.
- Tél : `+66 81 958 5945`.
- Droit applicable : lois thaïlandaises (DBD, PDPA B.E. 2562, Excise Act B.E. 2560).
- Créé par [selenium-studio.com](https://selenium-studio.com) & [anatholy-bricon.com](https://anatholy-bricon.com).

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Gecko Cabane — SEO, conversion et réputation**

Site web du restaurant **Gecko Cabane** (cuisine Franco-Thaï, 40 couverts, Maharat Road, Krabi Town), tenu par la cheffe Jariya et son mari. Stack Next.js 16 / TypeScript / Tailwind v4 / Supabase / next-intl, déployé sur Vercel. Ce projet transforme le site d'une page unique en machine à réservations pour les touristes européens, et ajoute le tunnel d'avis, la newsletter et le reporting hebdomadaire qui l'entourent.

**Core Value:** **geckocabanerestaurant.com doit devenir la première source de réservations des touristes européens de Krabi** : être trouvé (SEO FR/EN/DE) et réserver en moins de 60 secondes, même avec un numéro étranger.

### Constraints

- **Timeline**: P1 (T1–T6, C1, R1, N1, A1–A4) en ligne avant le **1er novembre 2026** — la haute saison commence en novembre ; aujourd'hui = 16 octobre
- **Tech stack**: Next.js 16 App Router, Tailwind v4, Supabase, next-intl — pas de migration ; `createServerClient`/`createBrowserClient` selon le contexte, jamais la service-role côté client
- **i18n**: toute chaîne visible dans `src/app/[locale]/` via next-intl, clés dans `messages/fr.json` et `en.json` (et `de.json` ensuite) ; l'admin reste en français fixe
- **Conformité**: PDPA thaïlandais B.E. 2562 et RGPD — consentement explicite, double opt-in, lien de désinscription, consentement horodaté avec source
- **Emails**: Resend pour le transactionnel (confirmations, email J+1) ; Brevo pour la newsletter (segments FR/EN/DE/SV, pays, résident/touriste, dernière visite) ; 1 email/mois maximum hors séquences
- **Actions externes**: tout ce qui est publié ou envoyé à un tiers exige l'accord du propriétaire avant exécution
- **Qualité du contenu**: textes DE/SV relus par un humain ; aucune affirmation non vérifiable dans le schema (notes, avis)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ^5 (strict) - all app code in `src/`, tests in `tests/`, config (`next.config.ts`, `vitest.config.ts`, `sentry.*.config.ts`)
- SQL (PostgreSQL) - migrations in `supabase/migrations/` (baseline 007; legacy 001-006 archived in `supabase/legacy/`)
- JSON - translations in `messages/fr.json`, `messages/en.json`
- CSS (Tailwind v4) - `src/app/globals.css`
## Runtime
- Node.js (types `@types/node` ^20); no `.nvmrc` detected
- Target ES2017, `moduleResolution: bundler` (`tsconfig.json`)
- npm
- Lockfile: present (`package-lock.json`)
## Frameworks
- Next.js 16.1.6 (App Router, Turbopack) - `next.config.ts`, `reactCompiler: true`
- React 19.2.3 / react-dom 19.2.3 with `babel-plugin-react-compiler` 1.0.0
- next-intl ^4.8.3 - i18n (`fr` default, `en`), config in `src/i18n/config.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`; plugin wired in `next.config.ts`
- Tailwind CSS ^4 via `@tailwindcss/postcss` (`postcss.config.mjs`)
- Vitest ^4.1.0 - `vitest.config.ts` (node env, `tests/**/*.test.ts`)
- ESLint ^9 with `eslint-config-next` 16.1.6 - `eslint.config.mjs`
- `@sentry/nextjs` `withSentryConfig` wrapper (source map upload, tunnel route `/monitoring`)
- Fonts: `next/font/google` (Cinzel, Cinzel Decorative, Cormorant Garamond, Raleway) in `src/app/layout.tsx`
## Key Dependencies
- `@supabase/supabase-js` ^2.98.0 and `@supabase/ssr` ^0.9.0 - DB, auth, storage (`src/utils/supabase/`)
- `resend` ^6.28.1 - transactional email (`src/utils/resend`)
- `@sentry/nextjs` ^10.45.0, `@sentry/profiling-node` ^10.45.0 - error tracking
- `@modelcontextprotocol/sdk` ^1.27.1 - MCP server at `src/app/api/mcp/route.ts`
- `libphonenumber-js` ^1.12.40 - phone validation
- `zod` 4.3.6 - used in `src/app/api/mcp/route.ts` (installed transitively; not declared in `package.json`)
## Configuration
- `.env.local` present (values not read); `.env.sentry-build-plugin` present (Sentry auth token for builds)
- Variable names: see INTEGRATIONS.md
- Path alias `@/*` -> `./src/*`
- `package.json` scripts: `dev` (`next dev`), `test` (`vitest run`), `build` (`vitest run && next build` - tests gate builds), `start`, `lint` (`eslint`)
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`
- Sentry init: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`
## Platform Requirements
- Node + npm, Supabase project credentials in `.env.local`; `npm run dev` on localhost:3000
- Vercel (`.vercel/project.json`), Supabase-hosted PostgreSQL
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase `.tsx` in `src/components/` (`AnnouncementBanner.tsx`, `ReservationForm.tsx`); UI primitives in `src/components/ui/` (`GcDivider.tsx`).
- Next.js route files use framework names: `page.tsx`, `layout.tsx`, `route.ts`, `actions.ts`, `error.tsx`, `not-found.tsx`.
- Utilities: lowercase `.ts` (`src/utils/validation.ts`, `src/utils/resend.ts`, `src/utils/sentry.ts`).
- Dynamic segments: `[locale]`, `[pageId]`, `[id]`.
- Tests: `tests/<topic>.test.ts` (kebab-case).
- camelCase. Predicates prefixed `is` (`isE164Phone`, `isPartySizeValid`, `isOtpCode`); validators `validateXxx`; normalizers `normalizePhone`.
- React page/component default exports PascalCase (`AdminReservationsPage`, `AnnouncementBanner`).
- Route handlers are named exports of HTTP verbs: `GET`, `PUT`, `POST`, etc.
- Server Actions: `xxxAction` in `actions.ts` with `'use server'` (`logoutAction` in `src/app/admin/actions.ts`).
- camelCase locally; SCREAMING_SNAKE_CASE for module constants (`STATUS_LABELS`, `OCCASIONS`, `BG_CLASSES`, `RESEND_FROM_EMAIL`).
- Database columns/body fields are snake_case (`customer_phone`, `reservation_date`, `is_active`, `bg_color`) and are used as-is in TS objects.
- Tables are prefixed `gecko_` (`gecko_announcement`, `gecko_reservations`).
- PascalCase, centralized in `src/types/database.ts` (`Reservation`, `ReservationStatus`, `RestaurantTable`, `Announcement`, `ApiResponse<T>`). Import with `import type { ... } from '@/types/database'`.
## Code Style
- No Prettier/Biome config. Style observed: 2-space indent, single quotes, no semicolons, trailing commas in multiline literals, aligned object values occasionally.
- Some files contain trailing whitespace on blank lines (e.g. `src/app/api/announcement/route.ts`); do not add more.
- ESLint 9 flat config `eslint.config.mjs` extending `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Run `npm run lint`.
- TypeScript `strict: true` (`tsconfig.json`); `isolatedModules`, `moduleResolution: bundler`.
- React Compiler enabled via `babel-plugin-react-compiler`.
## Import Organization
- `@/*` -> `./src/*` (tsconfig). Tests use relative paths (`../src/utils/validation`).
## Error Handling
- Wrap body in `try { ... } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }`.
- Supabase errors: `return NextResponse.json({ error: error.message }, { status: 500 })`.
- Auth check on mutating routes: `const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.
- Success: `NextResponse.json({ data })`.
- Missing-table fallback codes `PGRST116` / `42P01` return default data (`src/app/api/announcement/route.ts`).
- Use `createAdminClient()` (service role) only in server code where RLS blocks public access, with a comment justifying it (`src/app/api/reservations/route.ts`).
- Validation uses pure helpers from `src/utils/validation.ts` that return `string | null` (error message) or boolean; user-facing validation messages are in French.
- `try/catch` around `fetch`, state `message: { type: 'success' | 'error'; text: string } | null` for admin feedback; `loading` boolean state.
## Logging
## Comments
- Section banners `// -----...` with a title in utility and test files.
- File-header block comments (`/** ... */`) describing purpose and usage (`src/utils/validation.ts`, `src/utils/sentry.ts`, tests).
- Inline comments explain security/RLS rationale and business rules. Comments are in English or French; admin UI strings and some inline comments are French.
## Function Design
## Module Design
## Project-Specific Rules (from `CLAUDE.md`)
- Public pages under `src/app/[locale]/` must use `useTranslations()` / `getTranslations()`; add keys to both `messages/fr.json` and `messages/en.json` (enforced by `tests/i18n.test.ts`). Admin pages (`src/app/admin/`) are fixed French, no i18n.
- Components using hooks/events start with `'use client'`; prefer Server Components for initial data fetches.
- Tailwind v4 syntax: `bg-(--gc-jungle)`, not `bg-[var(--gc-jungle)]`; theme vars in `src/app/globals.css`.
- Server Components/Route Handlers use `createClient` from `src/utils/supabase/server.ts`; client components use `src/utils/supabase/client.ts`. Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Validate all user input in API routes; never return stack traces.
- Type API responses with `ApiResponse<T>` (note: currently sparsely used).
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
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
| MCP server | Stateless MCP tools (menu, hours, availability) | `src/app/api/mcp/route.ts` |
| Email templates | Resend client + templates | `src/utils/resend.ts` |
| Validation | Reservation/phone validators | `src/utils/validation.ts` |
| Shared types | All DB/API types, `ApiResponse<T>` | `src/types/database.ts` |
| i18n | Locales, navigation, message loading | `src/i18n/config.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts` |
## Pattern Overview
- Public pages are localized (`fr` default, `en`, prefix always); admin and API are not.
- Public client components (`HoursDisplay`, `AnnouncementBanner`, `MenuDisplay`) fetch `/api/*` in `useEffect`, not directly from Supabase.
- Admin pages are `'use client'` pages that call `/api/*`; only login/signup/logout use server actions (`src/app/admin/actions.ts`, `login/actions.ts`, `signup/actions.ts`).
- Authorization is layered: middleware guard + route-handler `auth.getUser()` + Postgres RLS via `gecko_is_admin()`.
- Supabase project is shared with another app, so all tables are prefixed `gecko_` (e.g. `gecko_reservations`) and admin membership is checked via `gecko_admins`.
## Layers
- Location: `src/app/[locale]/`, `src/app/admin/`, `src/components/`
- Depends on: `src/types/database.ts`, next-intl, `/api/*`
- Location: `src/middleware.ts`
- Depends on: `@supabase/ssr`, `next-intl/middleware`, `src/i18n/config.ts`
- Location: `src/app/api/`
- Contains: Route Handlers per resource (announcement, auth, hours, menu/*, reservations, settings, special-hours, tables/*, mcp)
- Depends on: `src/utils/supabase/server.ts`, `src/utils/validation.ts`, `src/utils/resend.ts`
- Location: `supabase/migrations/001..006_*.sql`
## Data Flow
### Primary Request Path (public reservation)
### Public content read
### Admin auth
## Key Abstractions
- `createClient()` (cookie-bound, RLS as user) and `createAdminClient()` (service role) in `src/utils/supabase/server.ts`.
## Entry Points
## Architectural Constraints
- **Threading:** Serverless (Vercel), stateless; MCP runs in stateless mode.
- **Global state:** `NEXT_PUBLIC_SUPABASE_*` read at module level in `src/utils/supabase/server.ts` (inlined at build; Turbopack cache issue noted in comments).
- **Middleware matcher** excludes `/monitoring` (Sentry tunnel), static assets, image extensions; middleware also bypasses i18n for `/admin`, `/api`, `/auth`.
- **Build:** `npm run build` runs `vitest run` before `next build`; `reactCompiler: true` in `next.config.ts`.
- **Duplicate helper:** `src/utils/supabase/middleware.ts` (`updateSession`) is unused by `src/middleware.ts`, which inlines its own logic.
## Anti-Patterns
### Admin page data fetching in client components
### Business logic in route handlers inline
## Error Handling
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
