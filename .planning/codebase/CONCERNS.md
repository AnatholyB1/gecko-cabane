# Codebase Concerns

**Analysis Date:** 2026-10-16

## Tech Debt

**Migrations out of sync with live schema:**
- Issue: `supabase/migrations/001`-`006` create unprefixed tables (`reservations`, `tables`, `phone_verifications`, ...). The code queries `gecko_`-prefixed tables (`gecko_reservations`, `gecko_phone_verifications`) and the RPC `gecko_is_admin()`. The `gecko_admins` table, `gecko_is_admin()` and the prefixed tables and RLS policies are not in the repo. `CLAUDE.md` still documents the unprefixed names.
- Files: `supabase/migrations/*.sql`, `src/app/api/reservations/route.ts`, `src/app/api/verify/check/route.ts`, `src/middleware.ts`, `src/utils/supabase/server.ts`, `claude.md`
- Impact: The schema and RLS cannot be reproduced from the repo. A fresh environment will not work. The security boundary (RLS and `gecko_admins`) is unreviewable.
- Fix approach: Add migrations (007+) that capture the prefixed tables, `gecko_admins`, `gecko_is_admin()` and all policies. Update `claude.md` and `src/types/database.ts`.

**Duplicated, untyped client-side data fetching in admin pages:**
- Issue: Large `'use client'` pages (`src/app/admin/tables/page.tsx` 809 lines, `src/app/admin/reservations/page.tsx` 790, `src/app/admin/menu/[pageId]/page.tsx` 735, `src/app/[locale]/page.tsx` 755, `src/components/ReservationForm.tsx` 550) mix UI, fetch and business logic. This contradicts the "no business logic in UI" rule in `claude.md`.
- Impact: Hard to test or change. Errors are only `console.error`'d (about 30 sites) and are not reported to the user or Sentry.
- Fix approach: Extract hooks and utilities and split the components. Route errors through `src/utils/sentry.ts`.

**Leftover Sentry demo code and temporary artifacts:**
- Files: `src/app/sentry-example-api/route.ts`, `src/app/sentry-example-page/page.tsx`, `.dev-server.log` and `supabase/.temp/` (untracked, not gitignored), `tsconfig.tsbuildinfo` (present in the working tree, but check that it is ignored).
- Impact: The example API route is public and throws on every call. It can be used to flood Sentry quota and is bypassed by middleware.
- Fix approach: Delete the example route and page, and the middleware exception for `/sentry-example-page`. Add `.dev-server.log` and `supabase/.temp/` to `.gitignore`.

**Resolved: outgoing reservation webhooks removed (phase 1, SEC-05):** no webhook URL or `RESA_*` / `NEXT_PUBLIC_RESA*` variable exists anymore. The previously exposed n8n URLs are unused; the owner should delete/disable them in n8n.

**Supabase env vars inlined at build time:**
- Files: `src/utils/supabase/server.ts`
- Impact: The recent git history (`fix(supabase): invalidate Turbopack build cache`) shows stale-cache incidents. Constants are captured at module load, so env changes need a clean rebuild.
- Fix approach: Read `process.env` inside `createClient()` and `createAdminClient()`.

## Known Bugs

**Phone normalization mismatch between send and check:**
- Symptoms: `src/app/api/verify/send/route.ts` normalizes the phone (`0812345678` becomes `+66812345678`). `src/app/api/verify/check/route.ts` only trims it. `src/app/api/reservations/route.ts` compares `verif.phone !== customer_phone` with no normalization.
- Impact: Verification or reservation can fail if the client sends a different format at each step. This depends on the client form always sending the normalized value.
- Fix approach: Call `normalizePhone` and `isE164Phone` in `verify/check` and in the reservation POST.

**Reservation capacity is not enforced:**
- Files: `src/app/api/reservations/route.ts`, `src/utils/validation.ts`
- Symptoms: Party size is validated at 1-50, while the restaurant has a maximum of 40 covers (`claude.md`). The MCP route has `MAX_COVERS = 40`, but the POST does not check it. There is no check against closed days (Tuesday) or `opening_hours` and `special_hours`.
- Fix approach: Validate against the capacity, the hours and the existing reservations for the slot.

## Security Considerations

**Unauthenticated reservation lookup by phone (PII disclosure):**
- Risk: `GET /api/reservations?phone=...` uses the service-role client and returns `select('*')` for any caller. This includes names, emails and phones for the latest 5 reservations. There is no proof of ownership, no rate limit, and the phone is not normalized.
- Files: `src/app/api/reservations/route.ts` (GET, lines ~28-41)
- Current mitigation: None beyond obscurity.
- Recommendations: Remove the endpoint, or require a verified OTP token. Return a reduced column set. Add rate limiting.

**No rate limiting on SMS/OTP and reservation endpoints:**
- Risk: `POST /api/verify/send` is public and triggers paid Twilio SMS to any number (SMS pumping and cost abuse). `verify/check` allows OTP guessing, with only Twilio's own limits. `POST /api/reservations` can be spammed.
- Files: `src/app/api/verify/send/route.ts`, `src/app/api/verify/check/route.ts`, `src/app/api/reservations/route.ts`
- Recommendations: Add per-IP and per-phone throttling (Upstash, Vercel Firewall rules or a Supabase table). Add a CAPTCHA. Restrict allowed country codes.

**API routes only check "logged in", not "gecko admin":**
- Risk: The Supabase project is shared with another app (see `src/utils/supabase/server.ts` `isGeckoAdmin`). Admin API routes check only `supabase.auth.getUser()`. Examples: `src/app/api/menu/*`, `src/app/api/hours/route.ts`, `src/app/api/tables/**`, `src/app/api/settings/route.ts`, `src/app/api/announcement/route.ts`, `src/app/api/menu/upload/route.ts`, and reservation PUT/GET. `isGeckoAdmin` is called only in `src/app/admin/login/actions.ts`. Middleware guards only `/admin` pages and passes `/api` through.
- Current mitigation: RLS via `gecko_is_admin()` (not visible in the repo). The storage upload to `gecko-menu-images` depends on bucket policies.
- Recommendations: Add a shared `requireAdmin()` helper that calls `isGeckoAdmin` in every mutating route.

**Open admin signup:**
- Risk: `src/app/api/auth/signup/route.ts` and `src/app/admin/signup/page.tsx` let anyone create an account in the shared auth pool. The password minimum is 6 characters and there is no rate limit. Without `gecko_admins` membership the account should be harmless, but it is attack surface and creates user pollution.
- Recommendations: Remove or disable signup. Provision admins manually in `gecko_admins`.

**Mass assignment in reservation update:**
- Files: `src/app/api/reservations/route.ts` (PUT, `const { id, ...updates } = body`)
- Risk: Arbitrary fields from the body go into `.update(updates)`, with no whitelist and no status-transition validation. Raw Supabase `error.message` is returned to clients in several routes (GET and PUT here).
- Recommendations: Whitelist the fields and validate the status enum and transitions. Return generic errors.

**HTML injection in transactional emails:**
- Files: `src/utils/resend.ts`
- Risk: `customer_name`, `occasion` and `customer_email` are interpolated into the HTML templates without escaping. Public input goes into the restaurant notification email.
- Recommendations: Add an `escapeHtml()` helper and apply it to every interpolated value.

**Open redirect and message injection via query params:**
- Files: `src/app/api/auth/login/route.ts`, `src/app/api/auth/signup/route.ts`, `src/middleware.ts` (the `redirect` and `error` params)
- Risk: Messages are passed in the URL and the `redirect` param is reflected. Verify that the redirect target is restricted to relative `/admin` paths.

**Upload filename and content trust:**
- Files: `src/app/api/menu/upload/route.ts`
- Risk: The extension is taken from the user-supplied `file.name`, and the MIME type is client-declared (no magic-byte check). The raw `error.message` is returned.

**Unauthenticated MCP endpoint:**
- Files: `src/app/api/mcp/route.ts`
- Risk: Public by design (menu, hours, availability). It has no rate limiting. Confirm that no tool returns reservation PII.

## Performance Bottlenecks

**Sequential awaited side effects in reservation POST:**
- Problem: Webhook `fetch` and Resend sends are awaited before the response is returned, with no timeout.
- Files: `src/app/api/reservations/route.ts`
- Improvement path: Use `after()` from `next/server` or a queue. Add `AbortSignal.timeout`.

**Client-side fetch waterfalls on public pages:**
- Files: `src/components/HoursDisplay.tsx`, `src/components/AnnouncementBanner.tsx`, `src/components/MenuDisplay.tsx`
- Cause: Data is fetched in `useEffect` from `/api/*`, although the claude.md guideline prefers Server Components for initial data. It causes layout shift and extra round trips.

## Fragile Areas

**Middleware calling Supabase on every request:**
- Files: `src/middleware.ts`
- Why fragile: `auth.getUser()` is a network call on every matched path, including public pages. For `/admin` pages it also makes an RPC call (`gecko_is_admin`). An outage turns into public-site latency. If the RPC fails, the user is signed out.
- Safe modification: Keep the "no logic between createServerClient and getUser" rule. Consider skipping `getUser()` for public routes.

**Reservation double-submit and token consumption order:**
- Files: `src/app/api/reservations/route.ts`
- Why fragile: The verification token is consumed before party size and date validation. A validation failure forces a new SMS verification. The consume step is not atomic (select then update), so concurrent requests can reuse a token.
- Safe modification: Validate first, then consume atomically (`update ... where verified_token = x returning`).

## Scaling Limits

**Phone verification table growth:**
- Files: `supabase/migrations/006_phone_verifications.sql`, `src/app/api/verify/check/route.ts`
- Limit: Rows are inserted on every verification and never purged.
- Scaling path: Add a cleanup job (cron) for expired rows.

## Dependencies at Risk

**Pre-release or fast-moving stack:**
- Risk: Next.js 16.1.6, React 19.2.3, `reactCompiler: true` (`next.config.ts`), Tailwind v4 and Vitest 4. `twilio` is a heavy server SDK that is instantiated per request. `@sentry/profiling-node` is a native dependency.
- Impact: Upgrade churn. The Sentry `org` and project are hard-coded in `next.config.ts`.

## Missing Critical Features

**Operational protections:**
- Problem: No rate limiting, no CAPTCHA, no reservation capacity logic and no reservation cancellation by the customer.
- Blocks: Safe public exposure of the reservation flow.

## Test Coverage Gaps

**API routes, auth and components untested:**
- What's not tested: Only `tests/api-validation.test.ts` (pure validation helpers) and `tests/i18n.test.ts` (message key parity) exist. No tests cover route handlers, middleware auth, the reservation and OTP flow, the Resend templates or the admin pages.
- Files: `src/app/api/**`, `src/middleware.ts`, `src/utils/resend.ts`
- Risk: Auth regressions and the PII endpoint above would go unnoticed. `npm run build` runs `vitest run` first, so any failing test blocks deploys.
- Priority: High (auth and reservations), Medium (email templates).

---

*Concerns audit: 2026-10-16*
