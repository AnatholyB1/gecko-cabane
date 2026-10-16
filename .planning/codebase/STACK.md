# Technology Stack

**Analysis Date:** 2026-10-16

## Languages

**Primary:**
- TypeScript ^5 (strict) - all app code in `src/`, tests in `tests/`, config (`next.config.ts`, `vitest.config.ts`, `sentry.*.config.ts`)

**Secondary:**
- SQL (PostgreSQL) - migrations in `supabase/migrations/001_opening_hours.sql` ... `006_phone_verifications.sql`
- JSON - translations in `messages/fr.json`, `messages/en.json`
- CSS (Tailwind v4) - `src/app/globals.css`

## Runtime

**Environment:**
- Node.js (types `@types/node` ^20); no `.nvmrc` detected
- Target ES2017, `moduleResolution: bundler` (`tsconfig.json`)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.1.6 (App Router, Turbopack) - `next.config.ts`, `reactCompiler: true`
- React 19.2.3 / react-dom 19.2.3 with `babel-plugin-react-compiler` 1.0.0
- next-intl ^4.8.3 - i18n (`fr` default, `en`), config in `src/i18n/config.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`; plugin wired in `next.config.ts`
- Tailwind CSS ^4 via `@tailwindcss/postcss` (`postcss.config.mjs`)

**Testing:**
- Vitest ^4.1.0 - `vitest.config.ts` (node env, `tests/**/*.test.ts`)

**Build/Dev:**
- ESLint ^9 with `eslint-config-next` 16.1.6 - `eslint.config.mjs`
- `@sentry/nextjs` `withSentryConfig` wrapper (source map upload, tunnel route `/monitoring`)
- Fonts: `next/font/google` (Cinzel, Cinzel Decorative, Cormorant Garamond, Raleway) in `src/app/layout.tsx`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.98.0 and `@supabase/ssr` ^0.9.0 - DB, auth, storage (`src/utils/supabase/`)
- `twilio` ^5.13.0 - phone verification (Verify) in `src/app/api/verify/`
- `resend` ^6.28.1 - transactional email (`src/utils/resend`)
- `@sentry/nextjs` ^10.45.0, `@sentry/profiling-node` ^10.45.0 - error tracking
- `@modelcontextprotocol/sdk` ^1.27.1 - MCP server at `src/app/api/mcp/route.ts`
- `libphonenumber-js` ^1.12.40 - phone validation
- `zod` 4.3.6 - used in `src/app/api/mcp/route.ts` (installed transitively; not declared in `package.json`)

## Configuration

**Environment:**
- `.env.local` present (values not read); `.env.sentry-build-plugin` present (Sentry auth token for builds)
- Variable names: see INTEGRATIONS.md
- Path alias `@/*` -> `./src/*`

**Build:**
- `package.json` scripts: `dev` (`next dev`), `test` (`vitest run`), `build` (`vitest run && next build` - tests gate builds), `start`, `lint` (`eslint`)
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`
- Sentry init: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`

## Platform Requirements

**Development:**
- Node + npm, Supabase project credentials in `.env.local`; `npm run dev` on localhost:3000

**Production:**
- Vercel (`.vercel/project.json`), Supabase-hosted PostgreSQL

---

*Stack analysis: 2026-10-16*
