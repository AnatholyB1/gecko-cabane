# Phase 5: Conversion et mesure - Pattern Map

**Mapped:** 2026-10-17
**Files analyzed:** 33 (new + modified, source and test files)
**Analogs found:** 31 / 33 (2 have only a partial analog, see "No Analog Found")

All paths are relative to `C:\gecko-cabane-conv`. Line numbers refer to the files as read on 2026-10-17.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `supabase/migrations/015_reservation_source.sql` | migration | CRUD (additive columns) | `supabase/migrations/014_review_invitations.sql` | exact |
| `supabase/migrations/016_review_stats.sql` | migration | batch/counter upsert via RPC | `supabase/migrations/009_rate_limits.sql` | exact |
| `src/utils/analytics.ts` | utility | event-driven (browser) | `src/utils/whatsapp.ts` (pure client-safe util) | role-match |
| `src/utils/attribution.ts` | utility | transform + sessionStorage | `src/utils/review-links.ts` (pure sanitizers) | role-match |
| `src/utils/line.ts` | utility | transform | `src/utils/whatsapp.ts` (`getWhatsAppNumber`) | role-match |
| `src/utils/social-proof.ts` | config | static config | `src/utils/seo.ts` constants (`GEO`, `SAME_AS`) | role-match |
| `src/utils/review-links.ts` (modify: extend `REVIEW_SOURCES`, add `normalizeSource`) | utility | transform | itself | exact |
| `src/utils/review-stats.ts` | service (server only) | CRUD (RPC write) | `src/utils/review-tracking.ts` | exact |
| `src/utils/review-feedback.ts` (zod schema + email builder) | utility | request-response | `src/utils/reservation-schema.ts` + `reviewInvitationEmail` in `src/utils/resend.ts` | role-match |
| `src/utils/review-whatsapp.ts` | utility | transform | `src/utils/whatsapp.ts` | role-match |
| `src/utils/rate-limit.ts` (modify: add `feedback` kind) | utility | request-response | itself | exact |
| `src/utils/seo.ts` (modify: `aggregateRating`) | utility | transform | itself (`buildRestaurantJsonLd`) | exact |
| `src/types/database.ts` (modify: `ReservationSource`, utm fields) | model | n/a | itself (`Reservation`, 014 columns) | exact |
| `src/app/api/reservations/route.ts` (modify POST follow-up UPDATE, PUT whitelist) | controller | request-response | itself | exact |
| `src/app/api/review/go/route.ts` | controller | request-response (counted 302) | `src/app/api/cron/review-invitations/route.ts` (route + `NextResponse`) and `review-tracking.ts` | role-match |
| `src/app/api/review/feedback/route.ts` | controller | request-response + after() email | `src/app/api/reservations/route.ts` POST | exact |
| `src/app/api/review/stats/route.ts` | controller | CRUD (admin GET/PUT) | `src/app/api/reservations/route.ts` GET/PUT | exact |
| `src/app/[locale]/review/page.tsx` (modify) | component (server page) | request-response | itself | exact |
| `src/components/ReviewFeedbackForm.tsx` | component (client) | request-response | `src/components/ReservationForm.tsx` | role-match |
| `src/components/PlausibleScript.tsx` | component (server) | n/a | `src/components/RestaurantJsonLd.tsx` (server component gated on data) | partial |
| `src/components/FloatingContact.tsx` (replaces `WhatsAppButton` mount) | component (client) | event-driven | `src/components/WhatsAppButton.tsx` | exact |
| `src/components/SocialProof.tsx` | component (server) | static render | `src/app/[locale]/page.tsx` sections + `getTranslations` usage | role-match |
| `src/components/MapEmbed.tsx` | component (client) | event-driven (click-to-load) | `src/components/WhatsAppButton.tsx` (client, i18n, hooks) | partial |
| `src/components/RestaurantJsonLd.tsx` (verify only) | component | transform | itself | exact |
| `src/app/[locale]/layout.tsx` (modify: mount Plausible, FloatingContact) | layout | n/a | itself | exact |
| `src/app/[locale]/page.tsx` (modify: hero `next/image`, `#about`, `#contact`, SocialProof, payment line) | component (server page) | request-response | itself | exact |
| `src/app/[locale]/menu/page.tsx` (modify: payment line) | component (server page) | request-response | itself | exact |
| `src/components/ReservationForm.tsx` (modify: attribution, `track`) | component (client) | request-response | itself | exact |
| `src/app/admin/avis/page.tsx` | component (admin client page) | CRUD | `src/app/admin/reservations/page.tsx` | role-match |
| `src/app/admin/reservations/page.tsx` (modify: source select) | component (admin client page) | CRUD | itself (status `<select>` + `PUT`) | exact |
| `src/app/admin/page.tsx` (modify: "Avis" tile) | component | n/a | itself (card grid) | exact |
| `src/middleware.ts` + `tests/middleware-matcher.test.ts` (modify: exclude `/gcm`) | middleware/test | request-response | `/monitoring` exclusion in same files | exact |
| `next.config.ts` (modify: `rewrites`, `images`) | config | n/a | itself (`redirects()`, `tunnelRoute`) | role-match |
| `src/app/globals.css` (modify: `--gc-line` tokens) | config | n/a | `--gc-whatsapp` lines 17-18, 55-56 | exact |
| `messages/fr.json`, `messages/en.json` | config | n/a | existing `whatsapp`, `review` namespaces | exact |
| New tests in `tests/*.test.ts` | test | source-scan + pure unit | `tests/review-click-wiring.test.ts`, `tests/review-page-wiring.test.ts`, `tests/middleware-matcher.test.ts`, `tests/migrations.test.ts` | exact |

## Pattern Assignments

### `supabase/migrations/015_reservation_source.sql` (migration, additive columns)

**Analog:** `supabase/migrations/014_review_invitations.sql`

**Core pattern** (lines 13-24): header comment with phase and "apply BEFORE deploy" note, then `add column if not exists`, idempotent indexes.
```sql
alter table public.gecko_reservations
  add column if not exists review_token uuid not null default gen_random_uuid(),
  add column if not exists review_email_sent_at timestamptz,
  add column if not exists review_clicked_at timestamptz;

create unique index if not exists idx_gecko_reservations_review_token
  on public.gecko_reservations (review_token);
```
Apply to 015: `add column if not exists source text not null default 'site'`, nullable `utm_source`, `utm_medium`, `ref` with length checks. Check constraints are not idempotent via `add column if not exists ... check`; the column-level `check (source in (...))` inside the `add column if not exists` clause is skipped when the column exists, so it is safe. Keep the "No new policy: default grants revoked in 010" comment style. `gecko_create_reservation` stays untouched; `source` takes the column default (RESEARCH Pattern 3).

---

### `supabase/migrations/016_review_stats.sql` (migration, counter + service-role RPC)

**Analog:** `supabase/migrations/009_rate_limits.sql`

**Table + RLS + idempotent index** (lines 9-21):
```sql
create table if not exists public.gecko_rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table public.gecko_rate_limits enable row level security;
```
**Upsert RPC, service role only** (lines 25-59):
```sql
create or replace function public.gecko_rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
  ...
  insert into public.gecko_rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  ...
$$;

revoke all on function public.gecko_rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.gecko_rate_limit_hit(text, int, int) to service_role;
```
Apply to 016: `gecko_review_clicks (month, source, kind, hits)` with PK `(month, source, kind)` and CHECK allowlists; `gecko_review_click_hit(p_source, p_kind)` same `security definer` + revoke/grant shape; `gecko_review_monthly_totals` for manual Google/TA totals. Unlike 009 (no policy), add admin policies `for select to authenticated using (public.gecko_is_admin())` preceded by `drop policy if exists` (idempotency, as in 008) and explicit `revoke all ... from anon, authenticated` then targeted `grant`. `tests/migrations.test.ts` requires `gecko_` names and a strictly increasing 3-digit sequence (015, 016).

---

### `src/utils/review-stats.ts` (server-only service, RPC write, swallow errors)

**Analog:** `src/utils/review-tracking.ts`

**Header + imports** (lines 1-16):
```typescript
/**
 * Server only: never import from a 'use client' file (enforced by
 * tests/review-click-wiring.test.ts; the 'server-only' package is not a dependency).
 * Service role is required because ...
 */
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
```
**Core pattern** (lines 37-49): try/catch, Sentry, never throws.
```typescript
export async function markReviewClicked(token: string): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from('gecko_reservations')
      .update({ review_clicked_at: new Date().toISOString() })
      .eq('review_token', token)
      .is('review_clicked_at', null)
    if (error) Sentry.captureException(new Error('review click mark failed'))
  } catch (err) {
    Sentry.captureException(err)
  }
}
```
Replace the `.from().update()` with `.rpc('gecko_review_click_hit', { p_source, p_kind })`. Keep the "service role" justification comment (the existing test asserts `src.toLowerCase()).toContain('service role')`). Extend `tests/review-click-wiring.test.ts` with an identical "not imported from any 'use client' file" check for `review-stats` (the walk helper is at lines 11-18 of that test).

---

### `src/utils/review-links.ts` (modify: source allowlist)

**Analog:** itself, lines 12-21. A `REVIEW_SOURCES` / `sanitizeReviewSource` already exist with `['email','qr','wa']`. Extend this (add `'site'`, and a `normalizeSource(src, hasValidRid)` returning `'email'` when `isReviewToken(rid)`, else allowlisted `src`, else `'unknown'`) rather than creating a competing `review-sources.ts` as RESEARCH suggests. Keep the module pure (no server imports), since `review-links` is client-safe.
```typescript
export const REVIEW_SOURCES = ['email', 'qr', 'wa'] as const
export type ReviewSource = (typeof REVIEW_SOURCES)[number]

export function sanitizeReviewSource(v: string | null | undefined): ReviewSource | null {
  return (REVIEW_SOURCES as readonly string[]).includes(v ?? '') ? (v as ReviewSource) : null
}
```
Check existing callers/tests (`tests/review-links.test.ts`, `review-alias.ts`) before widening the tuple.

---

### `src/app/[locale]/review/page.tsx` (modify: visit count, counted links, feedback form)

**Analog:** itself.

**Existing server-side tracking hook** (lines 41-48):
```typescript
export default async function ReviewPage({ params, searchParams }: Props) {
  const { locale: raw } = await params
  const sp = await searchParams
  const rid = typeof sp.rid === 'string' ? sp.rid : null
  if (isReviewToken(rid)) await markReviewClicked(rid)
```
Add `import { after } from 'next/server'` (pattern from `src/app/api/reservations/route.ts` line 1) and `after(() => recordReviewHit(normalizeSource(...), 'visit'))` right after this line. The Google/TA anchors (lines 69, 78) change `href` from `googleReviewUrl()` / `tripAdvisorReviewUrl()` to `/api/review/go?t=google&src=<normalized>`; keep `target="_blank" rel="noopener noreferrer"` and the sr-only `newTab` span. Mount `<ReviewFeedbackForm src={...} rid={...} />` below `</div>` of buttons (line 88), above the `note` paragraph or after it, per UI-SPEC section 6. Keep `robots: { index: false, follow: false }` (lines 26-29).

**Test coupling to update** (`tests/review-page-wiring.test.ts` lines 24-30): it asserts `googleReviewUrl()` precedes `tripAdvisorReviewUrl()` in the page source. After the change those helpers move to the route handler; rewrite this assertion deliberately and assert order in `src/app/api/review/go/route.ts` instead.

---

### `src/app/api/review/go/route.ts` (controller, counted redirect)

**Analog (shape):** `src/app/api/cron/review-invitations/route.ts` lines 1-3, 21-40 for imports, `NextRequest`, `ApiResponse`, `Sentry`; helper behaviour from `review-tracking.ts`.

**Pattern to write:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { googleReviewUrl, tripAdvisorReviewUrl } from '@/utils/seo'
import { recordReviewHit } from '@/utils/review-stats'
import { sanitizeReviewSource } from '@/utils/review-links'

const TARGETS = { google: googleReviewUrl, tripadvisor: tripAdvisorReviewUrl } as const // fixed map, never user URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const t = searchParams.get('t')
  if (t !== 'google' && t !== 'tripadvisor') return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
  await recordReviewHit(sanitizeReviewSource(searchParams.get('src')) ?? 'unknown', t) // swallows errors
  return NextResponse.redirect(TARGETS[t](), 302)
}
```
`/api` already bypasses i18n in `src/middleware.ts`. Error shape `{ error }` with HTTP code per CLAUDE.md.

---

### `src/app/api/review/feedback/route.ts` (controller, public POST, honeypot + rate limit + after() email)

**Analog:** `src/app/api/reservations/route.ts` POST (lines 58-232). Copy structure step by step.

**Imports** (lines 1-23, trimmed):
```typescript
import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/types/database'
import { isHoneypotFilled } from '@/utils/anti-bot'
import { getClientIp } from '@/utils/rate-limit'
import { getResendClient, RESEND_FROM_EMAIL, RESTAURANT_NOTIFICATION_EMAIL } from '@/utils/resend'
```
**Body parse + honeypot fake success** (lines 60-79):
```typescript
const fail = (error: string, code: ReservationErrorCode, status: number) =>
  NextResponse.json<ApiResponse<never>>({ error, code }, { status })
let body: unknown
try { body = await request.json() } catch { return fail('Requête invalide', 'invalid_body', 400) }
const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
if (isHoneypotFilled(input.company_url)) {
  return NextResponse.json<ApiResponse<...>>({ data: ... }, { status: 201 })   // fake success, no DB/email/after()
}
```
**Validate then rate limit (invalid input never consumes quota)** (lines 86-92, 134-152): `schema.safeParse(body)` then a rate-limit call that returns 429 with `{ error, code: 'rate_limited' }`. Service role comment: "Service role: ... executable by service_role only" (lines 94-96).

**Email after the response** (lines 188-221): `after(async () => { try { const resend = getResendClient(); if (resend && RESTAURANT_NOTIFICATION_EMAIL) { await resend.emails.send({ from: RESEND_FROM_EMAIL, to: RESTAURANT_NOTIFICATION_EMAIL, subject, html }) } } catch (e) { Sentry.captureException(e) } })`. Use `escapeHtml` for the body and `stripLineBreaks` for the subject (see `src/utils/resend.ts` line 2 import and lines 225, 332 usage); set `replyTo` only after email validation. Catch-all: `catch (error) { Sentry.captureException(error); return fail('Erreur serveur', 'server_error', 500) }` (lines 228-231). No DB write besides the rate-limit counter.

**Rate limit:** extend `src/utils/rate-limit.ts`, which only has `RATE_LIMITS.ip/email/phone` and `hashKey(kind: 'ip'|'email'|'phone', ...)` (lines 15-34). Add a `feedback` kind (e.g. `{ limit: 3, windowSeconds: 3600 }`) and a small `checkFeedbackRateLimit(admin, ip)` mirroring the loop body at lines 52-68, including the fail-open `RATE_LIMIT_SECRET` guard (lines 40-44). A separate key prefix keeps the feedback bucket independent from reservation `ip:` keys.

**Schema:** zod conventions from `src/utils/reservation-schema.ts` lines 7, 31-40, e.g. `z.string().trim().toLowerCase().pipe(z.email().max(254))`, `company_url: z.string().max(200).optional()`. For optional email, preprocess empty string to `undefined`. Validate `rid` with `isReviewToken` and `src` with `sanitizeReviewSource`.

---

### `src/app/api/review/stats/route.ts` (controller, admin GET + PUT)

**Analog:** `src/app/api/reservations/route.ts` GET (lines 26-56) and PUT (lines 243-324).

**Admin guard** (lines 26-29):
```typescript
const auth = await requireAdmin()
if (!auth.ok) return auth.response
const { supabase } = auth
```
**GET:** read via the cookie client `supabase` (RLS `gecko_is_admin()` on `gecko_review_clicks`), `Sentry.captureException(error)` and return `{ error: 'Erreur serveur', code: 'server_error' }` 500 (lines 50-53); success `NextResponse.json<ApiResponse<T>>({ data })`.
**PUT (manual totals):** validation helper style `const bad = (error: string) => NextResponse.json<ApiResponse<never>>({ error, code: 'invalid_fields' }, { status: 400 })` (lines 248-249); validate `month` regex `YYYY-MM`, `platform` in `['google','tripadvisor']`, integer 0..100000, then `upsert`.
**Guard test:** add `'src/app/api/review/stats/route.ts'` to `GUARDED_ROUTE_FILES` in `tests/admin-routes-guarded.test.ts` (lines 14-30).

---

### `src/app/api/reservations/route.ts` (modify: source/UTM)

**Analog:** itself.

- **POST:** after the RPC row check (line 175 `const id: number = row.reservation_id`), do a best-effort follow-up `admin.from('gecko_reservations').update({ utm_source, utm_medium, ref }).eq('id', id)`; on error `Sentry.captureException`, never fail the booking. Do NOT add `source` to the zod schema or the RPC args (the column default `'site'` is the forgery guard). Keep zod object stripping unknown keys, and add a source-scan test in `tests/reservations-post.test.ts` that the route never reads `body.source` / `input.source`.
- **PUT whitelist** (lines 259-275): add next to `admin_notes`:
```typescript
if (body.source !== undefined) {
  if (!RESERVATION_SOURCES.includes(body.source)) return bad('Source invalide')
  updates.source = body.source
}
```
Define `RESERVATION_SOURCES` beside `RESERVATION_STATUSES` (lines 234-240). `updates` is `Record<string, string | null>`, which fits.
- **Types:** `src/types/database.ts` `Reservation` (lines 145-166): append `source: ReservationSource`, `utm_source/utm_medium/ref: string | null` with a "Added by migration 015" comment, mirroring the 014 comment at line 161.

---

### `src/components/FloatingContact.tsx` (client, event-driven floating stack)

**Analog:** `src/components/WhatsAppButton.tsx` (exact; this file is refactored).

**Hide-on-submit logic to move to the container** (lines 11-33): the `matchMedia('(max-width: 639px)')` + `IntersectionObserver` on `#reservation-submit` effect, unchanged.

**Button classes to replicate for LINE** (line 43):
```
group fixed z-40 bottom-4 right-4 sm:bottom-8 sm:right-8 w-14 h-14 rounded-full bg-gc-whatsapp hover:bg-gc-whatsapp-dark focus-visible:bg-gc-whatsapp-dark shadow-lg flex items-center justify-center transition-[opacity,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-gc-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gc-void
```
Move `fixed z-40 bottom-4 right-4 sm:bottom-8 sm:right-8` to a wrapper `flex flex-col gap-3 items-end`; each link keeps the rest (without `fixed`/offsets). Hidden state `' opacity-0 pointer-events-none'` (lines 44), plus `tabIndex={-1}` and `aria-hidden` while hidden per UI-SPEC. Tooltip span (lines 57-59) is copied verbatim for LINE. Add `onClick={() => track(EVENTS.whatsappClick, { locale })}`; never `preventDefault`.

**Env gating:** LINE rendered only when `getLineUrl()` (new `src/utils/line.ts`) is non-null. `NEXT_PUBLIC_*` is inlined at build, so a client component reading `process.env.NEXT_PUBLIC_LINE_URL` is fine. `src/app/[locale]/layout.tsx` line 6 import `WhatsAppButton` and line 49 `<WhatsAppButton />` change to `FloatingContact`; check `grep WhatsAppButton tests/` before moving.

**i18n:** `useTranslations('whatsapp')` namespace keys `ariaLabel`, `label`, `prefill` already exist; add a `line` namespace (`ariaLabel`, `label`) to both `messages/fr.json` and `messages/en.json`.

---

### `src/app/globals.css` (modify: LINE tokens)

**Analog:** itself. `:root` lines 17-18 and `@theme inline` lines 55-56:
```css
--gc-whatsapp: #128C7E;
--gc-whatsapp-dark: #0B6B5F;
...
--color-gc-whatsapp: var(--gc-whatsapp);
--color-gc-whatsapp-dark: var(--gc-whatsapp-dark);
```
Add `--gc-line: #06A94D; --gc-line-dark: #058A3E;` and `--color-gc-line`, `--color-gc-line-dark` (UI-SPEC values, darker than brand for contrast).

---

### `src/components/PlausibleScript.tsx` + `next.config.ts` rewrites (inert-when-unset)

**Analog for config:** `next.config.ts` lines 7-15 (`async redirects()` returning an array) and line 32 (`tunnelRoute: "/monitoring"` with comment "excluded from the Next.js middleware matcher"). Add `async rewrites()` next to `redirects()`, keyed on `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` (see RESEARCH Pattern 1 for the exact code) and `images: { formats: ['image/avif','image/webp'], qualities: [60, 75], ... }`. Style: this file uses semicolons and double quotes in places, but follow the surrounding lines.

**Analog for component:** `src/components/RestaurantJsonLd.tsx` (server component, no hooks). Use `next/script`; return `null` when the env var is missing (RESEARCH Pattern 1 code). Mount in `src/app/[locale]/layout.tsx` inside `NextIntlClientProvider` next to `{children}`.

**Middleware exclusion** (Pitfall 3): modify the `matcher` string at `src/middleware.ts` line ~121-134 to add `gcm` next to `monitoring` in the negative lookahead, and append `'/gcm/js/script.js'`, `'/gcm/api/event'` to the `does not match` `it.each` list in `tests/middleware-matcher.test.ts` (lines 33-40). That test parses the matcher string from source via `matcherRegex()` (lines 17-22), so no other test change is required.

---

### `src/utils/analytics.ts` (client-safe event helper)

**Analog:** `src/utils/whatsapp.ts` (pure, client-importable util with a sibling test `tests/whatsapp.test.ts`). Use the `EVENTS` const + `track()` from RESEARCH Pattern 2; it must be a no-op without `window.plausible` and never throw. Tests are node-env pure-function tests (no jsdom): stub `globalThis.window` in `tests/analytics.test.ts`.

---

### `src/utils/attribution.ts` (sanitize + sessionStorage)

**Analog:** `src/utils/review-links.ts` lines 6-21 (pure regex guards and allowlist sanitizers). Split into a pure `sanitizeUtm(value): string | null` (regex allowlist, max 100 chars) and a thin browser wrapper (`captureAttribution()`, `readAttribution()`) guarded by `typeof window`. Capture host: a null-rendering client component mounted in the locale layout (or inside `FloatingContact`), because GBP visitors land on the home page before `ReservationForm` mounts.

**Consumption:** `src/components/ReservationForm.tsx` `handleSubmit`, lines 205-216 build the POST body:
```typescript
body: JSON.stringify({
  ...form,
  customer_phone: fullPhone,
  phone_country: selectedCountryCode,
  locale,
  marketing_consent: marketingConsent,
  company_url: companyUrl,
  form_started_at: startedAt.current ?? 0
})
```
Spread `...readAttribution()` here, and call `track(EVENTS.reservationSent, { locale })` inside `if (response.ok) {` (line 219). The zod schema in `reservation-schema.ts` must accept optional `utm_source`, `utm_medium`, `ref` (strings, max 100) so they survive stripping; `source` must NOT be added.

---

### `src/utils/social-proof.ts` + `src/components/SocialProof.tsx`

**Analog for config:** `src/utils/seo.ts` constants (lines 98-116: `GEO`, `SAME_AS`, `GOOGLE_PLACE_ID` as `as const` typed exports with comments). Export `SOCIAL_PROOF = { rating: 4.7, reviewCount: 1062, travellersChoiceYear: null, showAggregateRating: ..., reviews: [] as readonly Review[] }`. Reviews: `{ name, country, lang, source: 'google'|'tripadvisor', url, text }`. `reviews: []` is a supported state (Pitfall 9).

**Analog for component:** server components in the app that use `getTranslations` (see `src/components/RestaurantJsonLd.tsx` line 16 `await getTranslations({ locale, namespace: 'meta' })` and `src/app/[locale]/review/page.tsx` line 48). Section markup follows the existing `page.tsx` rhythm: `<section ... className="py-24 px-6 bg-gc-parchment">`, header block with Raleway eyebrow (`font-raleway font-light text-[11px] tracking-[0.3em] uppercase`) + Cinzel `h2` with `style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}` + `<GcDivider />` (see page.tsx lines 598-608 for the reservation header and `import GcDivider from '@/components/ui/GcDivider'`). Mount immediately before `<section id="reservation"` at `page.tsx` line 591. Link "Laisser un avis" uses the `Link` from `@/i18n/navigation` with `href="/review?src=site"` (check that `Link` accepts a query string, else use `<a>` with locale-prefixed path; the `review/page.tsx` line 91 uses `<Link href="/">`). Format numbers with `Intl.NumberFormat(locale)`.

**JSON-LD** (`src/utils/seo.ts` lines 173-205): replace the comment "No rating block (D-07: unverifiable)" and add, before `...(hours.length > 0 ...)` (line 203):
```typescript
...(SOCIAL_PROOF.showAggregateRating ? {
  aggregateRating: { '@type': 'AggregateRating', ratingValue: SOCIAL_PROOF.rating, reviewCount: SOCIAL_PROOF.reviewCount, bestRating: 5, worstRating: 1 },
} : {}),
```
`tests/seo-jsonld.test.ts` currently asserts no rating block and will fail by design; update it. `RestaurantJsonLd.tsx` needs no change (it calls `buildRestaurantJsonLd`).

---

### `src/components/MapEmbed.tsx` (client, click-to-load)

**Analog:** `src/components/WhatsAppButton.tsx` for file conventions (`'use client'` first line, `useTranslations`, single-quote/no-semicolon style, inline SVG). Core pattern from RESEARCH Pattern 6 (state toggle, iframe mounted only when `on`). `GEO` and `GOOGLE_PLACE_ID` come from `src/utils/seo.ts` (lines 98, 111). Preview image via `next/image` of `/exterior-sign.jpg`. Test (source scan, like `tests/review-click-wiring.test.ts` style): no `<iframe` outside the conditional. No existing component with click-to-load behaviour exists, so only conventions are reused.

---

### `src/components/ReviewFeedbackForm.tsx` (client form)

**Analog:** `src/components/ReservationForm.tsx`.

- Submit/handler, error and state handling: lines 198-246 (`e.preventDefault()`, `if (loading) return`, `setLoading(true)`, `fetch(... { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })`, branch on `response.ok` / `status === 429` / JSON `code`, `catch { setErrorKind('networkError') } finally { setLoading(false) }`).
- Error block (lines 282-300): `role="alert"` container; the 429 branch shows a WhatsApp link built from `buildWhatsAppUrl(getWhatsAppNumber(), tw('prefill'))`. Reuse for the rate-limited message.
- Honeypot: look at how `companyUrl` is rendered in the form (state `companyUrl`, field `company_url`) and reuse the same off-screen wrapper and field name `company_url` so the server's `isHoneypotFilled(input.company_url)` works.
- Colors: the review page is on parchment inside a card (`bg-gc-parchment border border-gc-aged`, `review/page.tsx` line 52), not on dark; reuse `labelClass` / `inputClass` conventions from `ReservationForm` and the page `buttonBase` classes (page lines 13-16) and adjust UI-SPEC dark-theme colors to the actual parchment card.

Copy keys under `review.feedback*` in both message files.

---

### `src/app/admin/avis/page.tsx` (admin client page)

**Analog:** `src/app/admin/reservations/page.tsx`.

- `'use client'` + `useState`/`useEffect`/`useCallback` (line 3); `message` state `{ type: 'success' | 'error'; text: string } | null` (line 28); loading spinner pattern (`animate-spin rounded-full h-8 w-8 border-b-2 border-(--primary)`).
- Fetch + feedback pattern (lines 171-186): `fetch('/api/reservations', { method: 'PUT', headers, body: JSON.stringify({...}) })`, then `setMessage({ type: 'success', text: '...' })` / `{ type: 'error', text: data.error }`, `catch { setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' }) }`.
- Message banner (lines 264-268): `className={\`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`}`.
- Month `<select>` styling (line 342-344): `className="px-3 py-2 border rounded-lg"`.
- Admin French fixed text, no i18n. Clipboard copy and wa.me links use `buildWhatsAppUrl` from `src/utils/whatsapp.ts`. Message templates in `src/utils/review-whatsapp.ts`, tested by `tests/review-whatsapp.test.ts` (each language includes `https://geckocabanerestaurant.com/review?src=wa`; DE flagged "à relire").

### `src/app/admin/page.tsx` (modify: tile)

Copy a card from the grid (lines 55-61 pattern):
```tsx
<Link prefetch={false} href="/admin/reservations" className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-(--tropical) hover:shadow-xl transition-shadow">
  <div className="text-4xl mb-4">📅</div>
  <h3 className="text-lg font-bold text-(--primary-dark) mb-2">Réservations</h3>
  <p className="text-(--warm-gray) text-sm mb-4">Gérer les réservations du restaurant</p>
  <span className="text-sm text-(--tropical) font-medium">Gérer →</span>
</Link>
```
Also add to the lower "Actions rapides" list (RESEARCH says lines ~55-145 has both).

### `src/app/admin/reservations/page.tsx` (modify: source selector)

Add a `<select>` modeled on the status filter (lines 342-355) inside each reservation card; `onChange` sends `PUT /api/reservations` with `{ id, source }` following `updateStatus` (lines 171-186). Reuse the `message` state for "Enregistré" / "Impossible de modifier la source". Source labels map: a French constant (e.g. `SOURCE_LABELS`) alongside `STATUS_LABELS` (SCREAMING_SNAKE_CASE convention).

---

### `src/app/[locale]/page.tsx` (modify)

**Hero** (lines 110-118): replace
```tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/hero-bg.jpg" alt="" aria-hidden="true"
  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
  style={{ opacity: 0.28 }} />
```
with `next/image` (`fill`, `preload`, `sizes="100vw"`, `quality={60}`), parent is already `relative`. First downscale `public/hero-bg.jpg` (6 MB) with sharp keeping the filename (referenced in `seo.ts` line 185 and `tests/middleware-matcher.test.ts`). Chef portrait (lines 245-251) switches to `next/image` keeping `style={{ aspectRatio: '3/4', filter: 'sepia(0.3) contrast(1.05)', objectPosition: 'center top' }}`; the same applies to gallery (~417) and contact images (~636, 680). Decorative SVG `<img>` stay.

**Section insertion points:** `<SocialProof />` before line 591; payment line below `<ReservationForm />` (line 613) with `mt-6` inside `max-w-[600px]`; `#about` (line 195) block between `description2` and the EN link; `#contact` (line 618) trajets + `MapEmbed`.

### `src/app/[locale]/menu/page.tsx` (modify)

Imports `GcDivider` (line 10) and ends `</main>` at line 89. Add the shared `payment.note` paragraph after the last menu section, before `</main>`, via the same `getTranslations` instance the page already uses.

---

## Shared Patterns

### Service-role writes with justification
**Source:** `src/utils/review-tracking.ts` lines 1-13 and `src/app/api/reservations/route.ts` lines 94-96
**Apply to:** `review-stats.ts`, `review/feedback/route.ts` (rate-limit RPC), POST follow-up UPDATE.
Always `createAdminClient()` with a comment containing "Service role" explaining why RLS blocks the public path; server-only module never imported by a `'use client'` file.

### Admin API guard
**Source:** `src/utils/auth.ts` (`requireAdmin`), used at `src/app/api/reservations/route.ts` lines 27-29, 244-246
**Apply to:** `src/app/api/review/stats/route.ts`, any admin manual-reservation route.
```typescript
const auth = await requireAdmin()
if (!auth.ok) return auth.response
const { supabase } = auth
```

### Error shape and Sentry
**Source:** `src/app/api/reservations/route.ts` lines 50-53, 228-231, 60-61
**Apply to:** all new route handlers.
```typescript
Sentry.captureException(error)
return NextResponse.json<ApiResponse<never>>({ error: 'Erreur serveur', code: 'server_error' }, { status: 500 })
```
Never return stack traces; validation errors `{ error, code: 'invalid_fields' }` 400.

### Honeypot + rate limit + after() email
**Source:** `src/utils/anti-bot.ts` (`isHoneypotFilled`, lines 10-12), `src/utils/rate-limit.ts` (`getClientIp` lines 22-29, `hashKey` 31-34, fail-open loop 40-68), `src/app/api/reservations/route.ts` lines 74-79, 188-221.
**Apply to:** `review/feedback/route.ts`.

### HTML escaping in email
**Source:** `src/utils/html.ts` (`escapeHtml` line 14, `stripLineBreaks` line 20), used in `src/utils/resend.ts` lines 204, 225, 332.
**Apply to:** the feedback email body (escape), subject (strip line breaks). Add the builder to `resend.ts` or `review-feedback.ts` and extend `tests/resend-escape.test.ts` style tests.

### Source-scan tests (vitest, node env)
**Source:** `tests/review-click-wiring.test.ts` lines 1-50 (`readFileSync(join(root, p))`, `walk()` for client-import checks), `tests/middleware-matcher.test.ts`, `tests/migrations.test.ts` (migration sequence/gecko_ prefix), `tests/admin-routes-guarded.test.ts` lines 14-30 (`GUARDED_ROUTE_FILES`).
**Apply to:** every new `tests/*.test.ts` listed in RESEARCH "Wave 0 Gaps". Header comment style: `/** <Topic> tests (REQ-ID, D-xx) - source scan. */`. Remember `npm run build` runs `vitest run` first.

### i18n
**Source:** `messages/fr.json` / `messages/en.json` existing `whatsapp` and `review` namespaces; parity enforced by `tests/i18n.test.ts`, hardcoded text by `tests/i18n-hardcoded.test.ts`.
**Apply to:** `SocialProof`, `#about`/`#contact` additions, `MapEmbed`, `payment.note`, `line.*`, `review.feedback*`. Admin pages: French literals, no i18n.

### Code style
2-space indent, single quotes, no semicolons, trailing commas, no new trailing whitespace; `@/` alias imports; Tailwind v4 `bg-(--var)` / `gc-*` tokens; `'use client'` only when hooks or events are needed.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/MapEmbed.tsx` | component | click-to-load | No lazy/deferred iframe or click-to-activate component exists; reuse client component conventions only, follow RESEARCH Pattern 6 |
| `src/components/PlausibleScript.tsx` | component | script injection | No `next/script` usage exists in the repo (grep before writing); follow RESEARCH Pattern 1. Sentry tunnel in `next.config.ts` is the nearest proxy/config analog |
| Admin "Ajouter une réservation" (optional, RESEARCH Open Question 2) | route + page | CRUD create | Admin has only PUT/DELETE today; closest shape is `POST` in `src/app/api/tables/route.ts` (admin-guarded create), not read here. Planner must first verify `customer_email` nullability in `007_gecko_baseline.sql` (the `Reservation` type says `string | null`) |

## Key Findings For The Planner

1. `REVIEW_SOURCES` already exists in `src/utils/review-links.ts` (`email|qr|wa`); extend it (add `site`, plus `unknown` handling in `normalizeSource`) instead of creating `review-sources.ts`. Check `tests/review-links.test.ts` and `src/utils/review-alias.ts` for coupling before widening the tuple.
2. `WhatsAppButton` is mounted only in `src/app/[locale]/layout.tsx` (line 6, 49); its fixed positioning moves to the `FloatingContact` wrapper.
3. `RATE_LIMITS`/`hashKey` types are closed unions (`'ip'|'email'|'phone'`); the feedback limiter needs a new kind and its own helper.
4. `tests/review-page-wiring.test.ts` (Google-before-TA in page source), `tests/seo-jsonld*.test.ts` (no rating block), `tests/middleware-matcher.test.ts`, `tests/review-click-wiring.test.ts`, `tests/admin-routes-guarded.test.ts` and `tests/reservations-post.test.ts`/`reservations-admin.test.ts` need deliberate edits in the plans that change their targets.
5. `tests/i18n-hardcoded.test.ts` will flag hardcoded visible strings in new `[locale]` files; all copy goes through next-intl.

## Metadata

**Analog search scope:** `src/utils`, `src/components`, `src/app/api`, `src/app/admin`, `src/app/[locale]`, `supabase/migrations`, `tests`, `next.config.ts`, `src/middleware.ts`, `src/app/globals.css`
**Files scanned:** about 45 (read in full or by range: 16)
**Pattern extraction date:** 2026-10-17
