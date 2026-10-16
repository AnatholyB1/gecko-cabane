# External Integrations

**Analysis Date:** 2026-10-16

## APIs & External Services

**SMS / Phone verification:**
- Twilio Verify - phone verification for reservations
  - SDK/Client: `twilio` (routes `src/app/api/verify/send/`, `src/app/api/verify/check/`)
  - Auth: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
  - Persistence: `supabase/migrations/006_phone_verifications.sql`

**Email:**
- Resend - customer confirmation/status emails and restaurant notifications (best-effort, failures logged)
  - SDK/Client: `resend`, helper `getResendClient()` in `src/utils/resend`; used in `src/app/api/reservations/route.ts`
  - Auth: `RESEND_API_KEY`; addresses: `RESEND_FROM_EMAIL`, `RESTAURANT_NOTIFICATION_EMAIL`

**AI assistants:**
- MCP server exposed (inbound) at `POST /api/mcp` (`src/app/api/mcp/route.ts`), stateless Streamable HTTP, tools for menu/hours/announcements/availability; wrapped with `Sentry.wrapMcpServerWithSentry`

**Automation webhooks:** none (removed in phase 1; transactional email goes through Resend only).

**Fonts:**
- Google Fonts via `next/font/google` (`src/app/layout.tsx`)

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only); `.env.local` also holds `SUPABASE_JWT_SECRET` and `POSTGRES_*` vars (URL, PRISMA_URL, NON_POOLING, HOST, DATABASE, USER, PASSWORD) from the Vercel integration, unused in code
  - Client: `@supabase/ssr` / `supabase-js` via `src/utils/supabase/server.ts`, `client.ts`, `middleware.ts`
  - Migrations: `supabase/migrations/001`-`006` (hours, announcement, menu, reservations, tables, phone verifications); Supabase CLI temp dir `supabase/.temp/` (untracked)

**File Storage:**
- Supabase Storage bucket `gecko-menu-images` (public read, authenticated upload/delete; created in `supabase/migrations/003_menu.sql`; used in `src/app/api/menu/upload/route.ts`)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password for admins)
  - Implementation: session refresh and admin route guard in `src/middleware.ts` (`/admin` protected, `/admin/login` and `/admin/signup` public); API routes `src/app/api/auth/login|logout|signup/`; OAuth callback `src/app/auth/callback/`

## Monitoring & Observability

**Error Tracking:**
- Sentry (org `anatholy`, project `gecko-cabane`, EU ingest) - `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx`; tunnel `/monitoring` (excluded from middleware); logs enabled, `sendDefaultPii: true`, traces sample 0.2 in prod. Test route `src/app/api/sentry-example-api/route.ts` and `src/app/sentry-example-page/`
  - Build auth: `.env.sentry-build-plugin` (SENTRY_AUTH_TOKEN)

**Logs:**
- `console.error` in route handlers; Sentry structured logs

## CI/CD & Deployment

**Hosting:**
- Vercel (`.vercel/project.json`; `VERCEL_OIDC_TOKEN` in `.env.local`)

**CI Pipeline:**
- None detected (no workflow files); `npm run build` runs Vitest first

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESTAURANT_NOTIFICATION_EMAIL`
- Sentry build token (`.env.sentry-build-plugin`)

**Secrets location:**
- `.env.local` and `.env.sentry-build-plugin` locally (gitignored); Vercel project environment variables in production

## Webhooks & Callbacks

**Incoming:**
- `/auth/callback` (Supabase OAuth, `src/app/auth/callback/`)
- `/api/mcp` (MCP clients)

**Outgoing:**
- None

---

*Integration audit: 2026-10-16*
