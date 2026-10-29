# Phase 5: Conversion et mesure - Research

**Researched:** 2026-10-17
**Domain:** Next.js 16 App Router conversion layer (analytics proxy, image perf, trust blocks, source tracking, review counting, Resend contact form) on an existing Supabase/next-intl codebase
**Confidence:** MEDIUM-HIGH (code patterns HIGH, read from repo; Plausible/Next docs HIGH; a few Maps/LINE URL details ASSUMED)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Analytics et événements (KPI-01, RESA-06)**
- **D-01:** Plausible (pas GA4) : sans cookies, donc pas de bandeau de consentement requis, script léger (compatible PageSpeed ≥ 85).
- **D-02:** Plausible Cloud (~9 €/mois). Création du compte et paiement = action du propriétaire ; domaine suivi `geckocabanerestaurant.com`. Script servi via un rewrite Vercel/Next (proxy). Le code doit rester inerte (aucune erreur) tant que le domaine n'est pas configuré.
- **D-03:** Événements personnalisés : « réservation envoyée » (formulaire) et « clic WhatsApp » (bouton flottant), plus un événement « clic LINE » ; la propriété `src`/locale jointe quand disponible. Noms d'événements stables, centralisés dans un utilitaire.

**Champ « source » (RESA-06)**
- **D-04:** Colonne `source` sur `gecko_reservations` (migration 015, idempotente comme 007/008/014). Valeurs : `site`, `whatsapp`, `telephone`, `sans_reservation`. Le formulaire pose `site` automatiquement (le POST public ne peut écrire que `site`).
- **D-05:** `utm_source`/`ref` à l'arrivée mémorisés en session et joints à la réservation (ex. `google/gbp`). Colonne(s) dédiée(s), nullable.
- **D-06:** Saisie admin : sélecteur de source dans l'admin réservations. Changement via `PUT` avec liste blanche de champs.

**Comptage /review et tableau mensuel (REV-06)**
- **D-07:** Chaque visite de `/review` comptée par source (`email` via `rid`, `qr`, `wa`, `site`, inconnue) dans une table dédiée `gecko_review_clicks` (migration, RLS admin via `gecko_is_admin()`, écriture service-role côté serveur avec commentaire justificatif, comme `markReviewClicked`).
- **D-08:** Clics sortants vers Google/TripAdvisor aussi comptés, par source, via une route de redirection comptée (la page `/review` reste `noindex`, sans donnée personnelle ; cf. D-13/D-14 phase 4).
- **D-09:** Page admin « Avis » (français fixe) : tableau mensuel visites/clics par source + saisie manuelle des totaux Google et TripAdvisor du mois. Aucun appel API Google/TripAdvisor.
- **D-10:** Modèle de message WhatsApp (REV-05) sur cette page « Avis » : texte pré-rempli FR/EN/DE avec le lien `https://geckocabanerestaurant.com/review?src=wa`, boutons « Copier » et « Ouvrir WhatsApp » (`wa.me`). Texte DE marqué « à relire ». Pas de bouton sur la carte de réservation.

**Preuve sociale (CONV-01)**
- **D-11:** Claude prépare des candidats copiés fidèlement de vrais avis (accord pour toute consultation externe) ; le propriétaire choisit et valide 3-4 avis. Jamais d'avis inventé ni réécrit ; prénom + pays exacts.
- **D-12:** Fichier de configuration (`src/utils/social-proof.ts` ou équivalent) : note 4,7, 1 062 avis, badge Travellers' Choice (année à vérifier), avis (texte, prénom, pays, source, lien). Pas de table ni d'API Places.
- **D-13:** Avis affichés dans leur langue d'origine (pas de traduction), avec indication de la langue ; libellés d'interface via next-intl (fr/en).
- **D-14:** `aggregateRating` (4,7 / 1 062) réintroduit dans le JSON-LD Restaurant. Valeurs identiques à celles affichées.
- **D-15:** Section dédiée juste avant `#reservation`, pas dans le hero. Badge note + Travellers' Choice, 3-4 avis, lien « Laisser un avis » vers `/review?src=site`.

**Qui sommes-nous (CONV-02)**
- **D-16:** Enrichir la section `#about` existante (portrait de Jariya) avec le propriétaire, la photo du couple et l'origine du lieu : pas de nouvelle section ni d'ancre.
- **D-17:** Photo du couple fournie plus tard ; la section sort avec le portrait de Jariya seul et un emplacement prêt (aucun faux visuel).
- **D-18:** Texte propriétaire/origine tiré de l'existant vérifiable ; le reste signalé « à compléter », rien d'inventé. FR/EN maintenant, DE en phase 6.

**Comment venir (CONV-03)**
- **D-19:** Bloc intégré à la section `#contact` existante : liste des trajets (Ao Nang 20 min en taxi, songthaew 50 bahts, 3 min du Walking Street, 15 min de Chao Fah Pier), carte et bouton d'itinéraire Google Maps toujours visible.
- **D-20:** Carte iframe chargée au clic : aperçu statique + bouton « Afficher la carte » ; iframe montée seulement après interaction.

**Paiement, LINE, « Un souci ? » (MENU-03, RESA-05, REV-07)**
- **D-21:** Ligne sobre « Espèces, cartes, PromptPay — frais de 5 % pour les paiements par carte » sur `/menu` et sous le formulaire de réservation, via une clé i18n partagée.
- **D-22:** Bouton LINE : `NEXT_PUBLIC_LINE_URL`. Bouton vert LINE empilé au-dessus du bouton WhatsApp flottant, même masquage mobile. Tant que la variable n'est pas définie, le bouton n'apparaît pas.
- **D-23:** « Un souci ? » sur `/review` : message (≈ 1 000 caractères max) + email facultatif, affiché en même temps que les boutons d'avis, sans filtrage. `POST` dédié avec validation, honeypot + limite par IP (rate limits migration 009), email Resend au propriétaire mentionnant la source (`src`/`rid`). Rien stocké en base.

### Claude's Discretion
- SEO-08 / performance : conversion hero et images en WebP/AVIF via `next/image`, `loading="lazy"` hors écran, polices, chargement différé du script Plausible ; cible PageSpeed mobile ≥ 85 et LCP < 2,5 s en 4G, mesurée avant/après.
- Schéma exact des tables (`gecko_review_clicks`, colonnes source/UTM), route de redirection comptée, noms d'événements, anti-bot et rate limits précis, structure des composants (carrousel vs liste), design du bloc LINE/WhatsApp empilé.
- Mise en page FR/EN des nouvelles sections avec les tokens `gc-*`.

### Deferred Ideas (OUT OF SCOPE)
- Historique des messages « Un souci ? » dans l'admin.
- Avis gérés depuis l'admin ou via l'API Google Places.
- Bouton « Envoyer par WhatsApp » sur chaque réservation (invitation d'avis).
- Traduction des avis.
- Texte DE de « Qui sommes-nous » et des nouveaux blocs (phase 6).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-08 | Hero WebP/AVIF, lazy hors écran, LCP < 2,5 s, PSI ≥ 85 | `next/image` (Next 16.1.6) with `formats: ['image/avif','image/webp']`, `qualities`, `preload`; hero source is 6 MB (see Pitfall 1) |
| MENU-03 | Mention paiement sur carte et réservation | shared i18n key `payment.note`, rendered in `menu/page.tsx` and under `ReservationForm` |
| RESA-05 | Bouton LINE | `NEXT_PUBLIC_LINE_URL` + refactor of `WhatsAppButton` into a floating stack |
| RESA-06 | Champ source + événements | migration 015, `gecko_create_reservation` untouched + follow-up UPDATE, `src/utils/analytics.ts`, Plausible proxy |
| CONV-01 | Preuve sociale | `src/utils/social-proof.ts`, new `SocialProof` server component, `aggregateRating` in `buildRestaurantJsonLd` (see Pitfall 2 policy risk) |
| CONV-02 | Qui sommes-nous | enrich `#about` in `[locale]/page.tsx`, i18n keys fr/en only |
| CONV-03 | Comment venir | `#contact` block + `MapEmbed` client component (click-to-load iframe) |
| REV-05 | Modèle WhatsApp admin | admin "Avis" page, pure util building message + `buildWhatsAppUrl` |
| REV-06 | Comptage /review par source + tableau mensuel | migration 016 (`gecko_review_clicks` counter + RPC + `gecko_review_monthly_totals`), counted redirect route handler |
| REV-07 | « Un souci ? » | `POST /api/review/feedback`, Resend from public route using `after()`, honeypot + `gecko_rate_limit_hit` |
| KPI-01 | Analytics installé | Plausible Cloud via Next rewrites, `PlausibleScript` component, inert without env |
</phase_requirements>

## Summary

The codebase already contains every pattern this phase needs: idempotent migrations with service-role-only RPCs (009), a fixed-window rate limiter keyed by HMAC (`rate-limit.ts`), honeypot and fill-time checks (`anti-bot.ts`), `after()`-based Resend sends with `escapeHtml`/`stripLineBreaks` (`resend.ts`, `html.ts`), a service-role "mark and swallow errors" tracker (`review-tracking.ts`), `requireAdmin()` for admin routes, and source-scan vitest tests. The plan should extend these rather than invent new mechanisms. The biggest technical risks are: (1) the hero image is a 6 MB JPEG at opacity 0.28 rendered with a plain `<img>`, (2) the Plausible proxy path must be excluded from the middleware matcher or next-intl will redirect it to `/fr/...`, (3) `aggregateRating` on a self-owned Restaurant entity is not eligible for Google review stars per Google's policy (locked decision D-14 still implementable, risk documented), and (4) the admin cannot create reservations today, so D-06's "phone / WhatsApp / sans réservation" sources have nothing to attach to.

Plausible's current snippet is the per-site `pa-XXXXX.js` script plus a tiny inline stub defining `window.plausible` and `plausible.init({ endpoint })`; the older `script.tagged-events.js` name from the brief is the legacy variant. The `pa-` ID is only obtainable from the owner's Plausible dashboard, which fits D-02 (code inert until `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` exists). Rewrites in `next.config.ts` are baked at build time on Vercel, so the owner must set the env var and redeploy.

**Primary recommendation:** Build everything behind env/config gates (Plausible ID, LINE URL, review list, couple photo), reuse existing util patterns, add migration 015 (reservation source/UTM) and 016 (review counters), fix the hero first and measure PageSpeed before/after on a Vercel preview.

## Project Constraints (from CLAUDE.md)

- Visible strings in `src/app/[locale]/` via `useTranslations`/`getTranslations`; keys in BOTH `messages/fr.json` and `messages/en.json` (parity enforced by `tests/i18n.test.ts`; `tests/i18n-hardcoded.test.ts` guards hardcoded text). Admin = fixed French, no i18n.
- Tailwind v4 syntax (`bg-(--var)`, `gc-*` tokens), no `bg-[var(--x)]`.
- `'use client'` only when hooks/events needed; Server Components preferred.
- Supabase: `createClient` (server) in Server Components/Route Handlers; `createAdminClient` only with a justifying comment; never expose service role client-side.
- API routes: validate all input, `{ error }` + HTTP code, no stack traces, `ApiResponse<T>` typing, Sentry for errors.
- Types in `src/types/database.ts`. Migrations numbered sequentially, idempotent, tables `gecko_` prefixed (tested by `tests/migrations.test.ts`).
- Style: 2 spaces, single quotes, no semicolons, trailing commas; no new trailing whitespace.
- `npm run build` runs `vitest run` first; tests in `tests/*.test.ts` (node env, no jsdom, so tests are pure-function or source-scan).
- Anything published/sent to a third party needs owner approval (Plausible account, LINE ID, real review texts, owner text).
- GSD workflow enforcement: edits only via GSD commands.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Plausible script proxy | CDN/Next rewrites (`next.config.ts`) | Browser (script + stub) | First-party path evades blockers; no code in app tier |
| Custom event emission | Browser | — | Events fired from click/submit handlers via `window.plausible` |
| Hero image optimisation | Frontend server (`/_next/image`) | CDN cache | Resizing/AVIF at the image optimizer, cached by Vercel |
| Social proof + `aggregateRating` | Frontend server (SSR) | — | Config file rendered server-side; JSON-LD must match visible values |
| Click-to-load map | Browser | — | iframe mounted after click; static placeholder SSR |
| Reservation source/UTM | Browser (capture sessionStorage) | API (writes `site` + UTM) | Server forces `source='site'`; client only supplies UTM strings |
| Admin source selector | API (`PUT` whitelist) | Browser admin page | Same route and whitelist pattern as status/notes |
| /review visit counting | Frontend server (page render, `after()`) | Database (RPC upsert) | Server-side, no PII, service role |
| Outbound click counting | API route handler (302) | Database | Count then redirect |
| « Un souci ? » | API route handler | Resend, DB (rate limit RPC only) | Public POST: validation, honeypot, rate limit, email; nothing stored |
| Monthly review table | Admin page (client) → API | Database (RLS admin) | Matches existing admin pattern |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 (installed) | rewrites, `next/image`, `after()`, `next/script` | Already the stack [VERIFIED: node_modules/next/package.json] |
| next-intl | ^4.8.3 (installed) | i18n for new sections | Project rule |
| @supabase/supabase-js | ^2.98.0 (installed) | RPC + admin client | Project rule |
| resend | ^6.28.1 (installed) | « Un souci ? » email | Already used |
| zod | 4.3.6 (installed, transitive) | validate feedback body | Already used in `reservation-schema.ts` |
| sharp | 0.34.5 (installed via next) | one-off resize of source hero | [VERIFIED: npm ls sharp] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| none new | | | **No new npm package is needed.** Plausible is loaded by `<Script>` + inline stub; do NOT add `next-plausible` (4.0.0) or `@plausible-analytics/tracker` (0.4.6) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written `next.config` rewrites + `<Script>` | `next-plausible` | Adds a dependency (its proxy only works with `next start`; Vercel works but needs wrapper); the 6-line rewrite is simpler and matches Plausible's own Vercel guide [CITED: plausible.io/docs/proxy/guides/vercel] |
| Counter table (month/source/kind, upsert RPC) | One row per click | Row-per-click is unbounded and nothing in D-09 needs per-click detail; counter is smaller and PII-free |

**Installation:** none. No package audit needed. (slopcheck installed best-effort; no packages recommended, so nothing to check.)

## Package Legitimacy Audit

No external packages are recommended for installation in this phase. `next-plausible` and `@plausible-analytics/tracker` were evaluated and rejected (both exist on npm: 4.0.0 and 0.4.6, repo github.com/plausible/analytics for the tracker), but not used.

**Packages removed due to slopcheck [SLOP]:** none
**Packages flagged [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Visitor (mobile, FR/EN/DE-speaking tourist)
  |
  v
Vercel edge ---- /gcm/js/script.js  --rewrite--> plausible.io/js/pa-<ID>.js
  |         ---- /gcm/api/event     --rewrite--> plausible.io/api/event
  |        (matcher excludes /gcm, like /monitoring: no Supabase/intl middleware)
  v
middleware (Supabase session + next-intl)  --> [locale]/page.tsx (SSR)
  |                                              |- Hero <Image preload>  --> /_next/image (AVIF/WebP)
  |                                              |- #about (enriched)
  |                                              |- SocialProof (reads social-proof.ts) -> "Laisser un avis" -> /review?src=site
  |                                              |- #reservation: ReservationForm
  |                                              |       |- sessionStorage utm/ref (captured on landing)
  |                                              |       '- POST /api/reservations {..., utm_source, utm_medium, ref}
  |                                              |             -> schema (strip unknown) -> rate limit -> RPC gecko_create_reservation
  |                                              |             -> UPDATE source='site', utm_* (service role, by id) -> after(): emails
  |                                              |       '- on 2xx: track('Reservation Sent', {locale, src})
  |                                              |- #contact: Comment venir + MapEmbed (iframe on click) + Directions link
  |                                              '- Floating stack: LINE (if env) over WhatsApp  -> track('LINE Click'|'WhatsApp Click')
  |
  '--> /[locale]/review?src=..&rid=..  (noindex)
          |- server: after(() => count visit(source))   -> RPC gecko_review_click_hit(source,'visit')
          |- Google/TA buttons -> /api/review/go?t=google|tripadvisor&src=..  -> count -> 302 external
          '- "Un souci ?" form -> POST /api/review/feedback -> honeypot -> zod -> rate limit(ip) -> after(): Resend -> owner

Admin (RLS gecko_is_admin)
  |- /admin/reservations: source <select> -> PUT /api/reservations {id, source}
  '- /admin/avis: GET monthly counters + manual Google/TA totals (upsert) + WhatsApp template (copy / wa.me)
```

### Recommended Project Structure
```
src/
  utils/
    analytics.ts            # EVENTS constants + track() guard (client-safe, pure)
    attribution.ts          # parse/store/read utm+ref in sessionStorage, sanitize (pure + tiny browser wrapper)
    line.ts                 # getLineUrl(): validated NEXT_PUBLIC_LINE_URL or null
    social-proof.ts         # rating, count, badge, reviews[] (config)
    review-sources.ts       # REVIEW_SOURCES allowlist + normalizeSource(searchParam, hasValidRid)
    review-stats.ts         # server: recordReviewHit(source, kind) via RPC, swallow errors (mirrors review-tracking.ts)
    review-feedback.ts      # zod schema + feedbackEmail() builder (or add to resend.ts)
    review-whatsapp.ts      # message templates FR/EN/DE + build link
    payment.ts              # (optional) none; use i18n key
  components/
    PlausibleScript.tsx     # server component, null if env missing
    FloatingContact.tsx     # replaces WhatsAppButton mount: LINE + WhatsApp stack, shared hide logic
    SocialProof.tsx         # server
    MapEmbed.tsx            # 'use client', click-to-load
    ReviewFeedbackForm.tsx  # 'use client'
  app/
    api/review/go/route.ts          # counted redirect
    api/review/feedback/route.ts    # POST
    api/review/stats/route.ts       # GET admin (+ PUT manual totals)
    admin/avis/page.tsx
supabase/migrations/015_reservation_source.sql
supabase/migrations/016_review_stats.sql
```

### Pattern 1: Plausible proxy + inert-when-unset
**What:** Rewrites and component both keyed on `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` (e.g. `pa-AbC123`).
**Source:** Plausible's Vercel proxy guide [CITED: plausible.io/docs/proxy/guides/vercel] adapted to `next.config.ts`.
```ts
// next.config.ts (inside nextConfig)
async rewrites() {
  const id = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID
  if (!id || !/^pa-[A-Za-z0-9_-]+$/.test(id)) return []
  return [
    { source: '/gcm/js/script.js', destination: `https://plausible.io/js/${id}.js` },
    { source: '/gcm/api/event', destination: 'https://plausible.io/api/event' },
  ]
},
```
```tsx
// src/components/PlausibleScript.tsx (server component, mounted in [locale]/layout.tsx)
import Script from 'next/script'
export default function PlausibleScript() {
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID) return null
  return (
    <>
      <Script src="/gcm/js/script.js" strategy="afterInteractive" />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init({endpoint:"/gcm/api/event"})`}
      </Script>
    </>
  )
}
```
Notes: path word choice avoids "analytics/stats/plausible" (blocklisted) [CITED: Plausible Vercel guide]. Pageview is automatic, including SPA navigation. Plausible requires the real client IP in `X-Forwarded-For`; Vercel rewrites normally set it, otherwise the bot filter silently drops events with HTTP 202 [CITED: plausible.io/docs/proxy/introduction]. The brief's `script.tagged-events` is the legacy script family; with the `pa-` script, custom events are sent with `plausible('Name', { props })` and the CSS-class method (`plausible-event-name=...`) [CITED: plausible.io/docs/custom-event-goals]. Use the JS call (needs the props).

### Pattern 2: Safe event helper
```ts
// src/utils/analytics.ts
export const EVENTS = {
  reservationSent: 'Reservation Sent',
  whatsappClick: 'WhatsApp Click',
  lineClick: 'LINE Click',
} as const
type PlausibleFn = (name: string, opts?: { props?: Record<string, string> }) => void
export function track(name: string, props?: Record<string, string>): void {
  try {
    const p = (window as unknown as { plausible?: PlausibleFn }).plausible
    p?.(name, props ? { props } : undefined)
  } catch { /* analytics never breaks the UI */ }
}
```
Goals must be created by the owner in the Plausible dashboard (Settings → Goals → Custom event) with names matching exactly; custom props need to be registered too to appear in breakdowns [CITED: plausible.io/docs/custom-event-goals]. Include this in the owner checklist.

### Pattern 3: Reservation source without touching the RPC
`gecko_create_reservation(...)` has a fixed 10-arg signature. Adding args creates an overload; avoid. Instead:
1. Migration 015: `add column if not exists source text not null default 'site'`, check constraint in (`site`,`whatsapp`,`telephone`,`sans_reservation`), `utm_source text`, `utm_medium text`, `utm_campaign text`, `referrer text`? (keep minimal: `utm_source`, `utm_medium`, `ref`), all nullable, length-checked (`char_length <= 100`).
2. In `POST` after the RPC succeeds: `admin.from('gecko_reservations').update({ utm_source, utm_medium, ref }).eq('id', id)` best-effort (Sentry on error, never fails the booking). `source` stays at the column default `'site'`, so the public path cannot forge it (zod strips unknown keys, so a client `source` field is ignored: add a test).
3. UTM sanitization: `^[A-Za-z0-9._~\-/ ]{1,100}$`-style allowlist, else null.
4. `PUT` whitelist: add `source` validated against the 4-value list (`updates` is typed `Record<string, string | null>`, fits).
5. Types: extend `Reservation` in `src/types/database.ts` with `source: ReservationSource` and utm fields; add `ReservationSource` type and a French label map (admin) in one util.

Client side: `attribution.ts` captures `utm_source`, `utm_medium`, `ref` from `window.location.search` once per session into `sessionStorage` (key `gc_attr`), read in `ReservationForm.handleSubmit`. Capture runs in a tiny client effect mounted in the layout (or inside `ReservationForm` mount, but users landing from GBP hit the home page first, so mount at layout level via the existing client tree; `FloatingContact` is a convenient host or a dedicated `AttributionCapture` null-render component).

### Pattern 4: Review counters (migration 016)
Mirror 009's RPC style:
```sql
create table if not exists public.gecko_review_clicks (
  month date not null,                              -- first day of month, Asia/Bangkok
  source text not null check (source in ('email','qr','wa','site','unknown')),
  kind text not null check (kind in ('visit','google','tripadvisor')),
  hits integer not null default 0,
  primary key (month, source, kind)
);
alter table public.gecko_review_clicks enable row level security;
create policy "gecko admins read review clicks" on public.gecko_review_clicks
  for select to authenticated using (public.gecko_is_admin());
revoke all on public.gecko_review_clicks from anon, authenticated;
grant select on public.gecko_review_clicks to authenticated;

create or replace function public.gecko_review_click_hit(p_source text, p_kind text) returns void
language plpgsql security definer set search_path = public as $$ ... insert ... on conflict (month, source, kind) do update set hits = r.hits + 1; $$;
revoke all on function ... from public, anon, authenticated; grant execute ... to service_role;

create table if not exists public.gecko_review_monthly_totals (
  month date not null, platform text not null check (platform in ('google','tripadvisor')),
  total_reviews integer not null check (total_reviews >= 0), updated_at timestamptz not null default now(),
  primary key (month, platform));
-- RLS: admin select/insert/update via gecko_is_admin(); grant select, insert, update to authenticated
```
Notes: policies need `drop policy if exists` before `create policy` for idempotency (pattern in 008). Migration 010 revoked default grants for PII tables only; new tables inherit Supabase default grants, so explicitly `revoke all ... from anon, authenticated` then grant only what is needed (grants are required in addition to RLS policies for the authenticated admin reads). `tests/migrations.test.ts` requires `gecko_` names and strictly increasing 3-digit sequence; adding a policy `using (true)` is forbidden on PII tables only.

Source normalisation (`review-sources.ts`): `rid` valid token → `email` (ignore `src` for rid visits? use `email` when `isReviewToken(rid)`); else `src` in {`qr`,`wa`,`site`} → itself; anything else → `unknown`. Allowlist so arbitrary query values can never create rows or cardinality.

Visit counting: in `review/page.tsx` use `after(() => recordReviewHit(source, 'visit'))` from `next/server` (already used in the reservations route) so rendering is not delayed; wrap in try/catch like `markReviewClicked`. Bots/prefetch inflate counts: accept and document (same accepted limitation as phase 4).

Counted redirect: `GET /api/review/go?t=google|tripadvisor&src=...` → `recordReviewHit` (awaited, swallow errors) → `NextResponse.redirect(googleReviewUrl() | tripAdvisorReviewUrl(), 302)`. Target chosen from a fixed map, never from user input (no open redirect). `/api` bypasses i18n in middleware. The review page buttons keep `target="_blank" rel="noopener noreferrer"`; `tests/review-page-wiring.test.ts` currently asserts `googleReviewUrl()` appears before `tripAdvisorReviewUrl()` in page source: update that test deliberately (buttons now point to `/api/review/go`), keep a test that the route handler maps to those helpers in order. Pass `src` through (page forwards the normalized source, `email` when rid valid).

### Pattern 5: « Un souci ? » public POST (Resend)
Copy the reservation route structure: parse JSON → honeypot (`isHoneypotFilled(input.company_url)` returns fake 200) → `checkFillTime`? (optional: reuse with `form_started_at`) → zod (`message` trim 5..1000, `email` optional empty→undefined then `z.email().max(254)`, `src` allowlist, `rid` via `isReviewToken`) → rate limit via `gecko_rate_limit_hit` with a NEW kind (e.g. `feedback`, limit 3 / 3600 s per IP) → `after()` send to `RESTAURANT_NOTIFICATION_EMAIL` via `getResendClient()`. Reuse `escapeHtml` and `stripLineBreaks` (subject), set `replyTo` only when email valid, message in `<pre style="white-space:pre-wrap">`-style escaped block. Body mentions source and rid presence (rid = the review token, a random UUID; including it lets the owner correlate, but it is not stored). Return `{ data: { ok: true } }` 200; always `{ error, code }` on failures. No DB write besides the rate-limit counter (hashed IP). Extend `hashKey`/`RATE_LIMITS` types rather than reusing `ip:` prefix so reservation and feedback counters do not share a bucket. If Resend is not configured (`getResendClient()` null) still return success but Sentry `captureMessage` (mirrors existing "fail soft" approach); the UI must never claim delivery falsely: success text should say "Merci, message transmis".

### Pattern 6: Click-to-load map
```tsx
'use client'
export default function MapEmbed({ src, title, showLabel, placeholder }: ...) {
  const [on, setOn] = useState(false)
  return on
    ? <iframe src={src} title={title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="w-full h-72 border-0" />
    : <button type="button" onClick={() => setOn(true)} className="...h-72 w-full">{showLabel}</button>
}
```
Static preview: no keyless Static Maps image exists, so use an existing photo (`/exterior-sign.jpg` via `next/image`, lazy) or a CSS pattern behind the button; do NOT hotlink Google tiles. Keyless iframe URL: `https://www.google.com/maps?q=8.06147,98.91566&z=16&output=embed` [ASSUMED: widely used legacy keyless form; the owner can replace it with the `pb=` URL from Google Maps → Share → Embed a map, which is the officially supported keyless embed]. Directions link: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` [ASSUMED, Google Maps URLs scheme]; reuse `GEO` and `GOOGLE_PLACE_ID` from `seo.ts`. No CSP headers exist in the repo (grep found none), so no `frame-src` change is needed; if a CSP is added later it needs `frame-src https://www.google.com`.

### Pattern 7: Floating stack
Refactor `WhatsAppButton` into a wrapper that owns the existing IntersectionObserver hide logic (target `#reservation-submit`, `max-width: 639px`) and renders `[LINE?][WhatsApp]` in one `fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex flex-col gap-3 z-40` container (pointer-events handling: `hidden` toggles opacity + `pointer-events-none` on the container). Keep `WhatsAppButton`'s file/export or update `layout.tsx` import and any test that greps it (`tests/whatsapp.test.ts` is utils-only; verify with grep before moving). `getLineUrl()` in `src/utils/line.ts`: returns `process.env.NEXT_PUBLIC_LINE_URL` only if it parses as `https:` with host in {`line.me`, `lin.ee`, `page.line.me`}; otherwise null (never a dead button). LINE brand green `#06C755` [ASSUMED]; add `--gc-line` token to `globals.css` `:root` + `@theme inline` mirroring `--gc-whatsapp`. Click handlers call `track(EVENTS.whatsappClick, {...})` / `lineClick`; also add `aria-label` i18n keys under a `line` namespace.

### Pattern 8: Hero with next/image (Next 16 specifics)
Next 16 changes: `priority` is deprecated → use `preload`; `qualities` defaults to `[75]` and a `quality` outside the list is coerced to the closest allowed; default `formats` is only `['image/webp']` [CITED: nextjs.org/docs/app/api-reference/components/image].
```ts
// next.config.ts
images: { formats: ['image/avif', 'image/webp'], qualities: [60, 75], minimumCacheTTL: 2678400 },
```
```tsx
import Image from 'next/image'
<Image src="/hero-bg.jpg" alt="" aria-hidden="true" fill preload sizes="100vw" quality={60}
  className="object-cover pointer-events-none select-none" style={{ opacity: 0.28 }} />
```
Parent already `relative`. Below-the-fold images in `page.tsx` (`chef-jariya.jpg` 467 KB at line 246, gallery items ~line 419, contact images ~637/681, `food-*.jpg`) should switch to `next/image` with `sizes` (default lazy). The `eslint-disable @next/next/no-img-element` comment goes away. The `/hero-bg.jpg` filename must stay: `seo.ts` JSON-LD references it and `tests/middleware-matcher.test.ts` lists it. Decorative SVG `<img>`s stay as they are.

### Anti-Patterns to Avoid
- **Adding `source` to the zod schema or RPC args:** lets the public POST forge sources; keep the column default and strip unknown keys.
- **Reading `Accept-Language` or storing raw IPs:** rate-limit keys stay HMAC hashed.
- **`next-plausible` or cookies:** adds dependency / contradicts D-01.
- **`dangerouslySetInnerHTML` for review text:** reviews are plain strings rendered as React text.
- **Row-per-click table:** unbounded growth, no requirement for it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image resize/AVIF | Pre-generated multi-format files or `<picture>` | `next/image` + `formats` | Handles srcset, caching, Accept negotiation |
| Rate limiting | New limiter or in-memory Map | `gecko_rate_limit_hit` RPC + `hashKey` | Serverless = no shared memory; already atomic |
| Bot protection | Captcha | `isHoneypotFilled`, `checkFillTime` | Decided in phase 1 (D-09) |
| HTML email escaping | String concat of user text | `escapeHtml`, `stripLineBreaks` from `html.ts` | Prevent injection / header injection |
| Admin auth in routes | Custom cookie checks | `requireAdmin()` | Shared admin pool means login alone is not enough |
| Analytics script/proxy | Custom tracking endpoint or storing events in Supabase | Plausible Cloud + rewrites | Decided D-01/D-02 |
| Phone/wa.me links | New builders | `buildWhatsAppUrl` | Exists and tested |
| JSON-LD serialization | `JSON.stringify` in script tags | `serializeJsonLd` | Escapes `<` |

**Key insight:** every sub-feature has a near-identical precedent in the repo; deviations create test and security surface.

## Runtime State Inventory

Not a rename/refactor phase, but it adds production state. Omitting the full rename table; the relevant "external state" is in the Environment Availability section (Plausible account, goals, env vars, migrations 015/016 applied in Supabase **before** deploy, like 014).

## Common Pitfalls

### Pitfall 1: The 6 MB hero
**What goes wrong:** `public/hero-bg.jpg` is 6,080,622 bytes. Even via `/_next/image` the first optimisation of a huge source is slow, uses Vercel source-size/transform quota, and the LCP element is likely this image (opacity 0.28 does not disqualify it).
**How to avoid:** One-off downscale the source to ~2400 px wide JPEG q~75 (target < 500 KB) with sharp (already installed), keeping the filename; then `next/image` with `preload`, `sizes="100vw"`, AVIF/WebP. Also compress `chef-jariya.jpg` (467 KB). Measure PSI mobile on a Vercel preview before and after (`https://pagespeed.web.dev` or the PSI API; read-only, no owner approval needed for own preview URL).
**Warning signs:** LCP > 2.5 s in PSI; `/_next/image` 400 for source too large; image served as JPEG (formats not applied).

### Pitfall 2: aggregateRating policy (D-14)
**What goes wrong:** Google's review-snippet guidelines say a LocalBusiness/Organization that controls reviews about itself is ineligible for star results, ratings must come directly from users on that site, and one must not aggregate ratings from other websites [CITED: developers.google.com/search/docs/appearance/structured-data/review-snippet]. D-14 (locked) reuses Google/TripAdvisor numbers in the Restaurant node. Result: likely no stars, small risk of a structured-data spam action if flagged as misleading. The phase-2 caveat (unverifiable) is solved by visible reviews, but the eligibility problem remains.
**How to avoid:** Implement D-14 as decided (values exactly equal to `social-proof.ts` and visible text; required fields `ratingValue`, `reviewCount`, `bestRating: 5`, `worstRating: 1`, nested in the Restaurant node), but gate it behind a single exported constant/flag and surface the risk to the owner (Open Question 1). Do not add `review` objects (copied third-party reviews as Review markup would be worse).
**Warning signs:** Search Console "Review snippet" warnings or manual action notice.

### Pitfall 3: Middleware intercepts the Plausible proxy
**What goes wrong:** Rewrites run after middleware. `/gcm/js/script.js` and `/gcm/api/event` would go through Supabase `getUser()` and next-intl (redirect to `/fr/gcm/...`), breaking the script and adding latency to every event.
**How to avoid:** Add `gcm` to the matcher negative lookahead next to `monitoring` in `src/middleware.ts`, and add `/gcm/js/script.js`, `/gcm/api/event` to the `does not match` list in `tests/middleware-matcher.test.ts`.

### Pitfall 4: Rewrites are build-time on Vercel
**What goes wrong:** Setting `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` in the Vercel dashboard does not change an existing deployment; script 404s until redeploy. `NEXT_PUBLIC_*` is also inlined at build for client components (`NEXT_PUBLIC_LINE_URL`).
**How to avoid:** Owner checklist: set env, redeploy, verify in Plausible "Verify installation". Never conditionally render the script without the rewrite (both keyed on the same var).

### Pitfall 5: Admin cannot create reservations (D-06 gap)
**What goes wrong:** Admin page only does `PUT`/`DELETE`; all reservations in the table come from the public form, so `whatsapp`, `telephone`, `sans_reservation` rows cannot exist and the selector only reclassifies rows. RESA-06 ("chaque réservation porte un champ source, site/WhatsApp/téléphone/sans réservation") is only meaningful if the admin can add one.
**How to avoid:** Surface to the planner (Open Question 2). Minimal fix: admin-only `POST /api/reservations/manual` (`requireAdmin`, cookie client under RLS insert policy or service role with comment) taking name, phone, date, time, party size, source, status `confirmed`, no email/rate limit, no customer email send. Verify first that `customer_email` is nullable in the DB (type says `string | null`; 007 baseline must be checked by the planner).

### Pitfall 6: Existing test coupling
`tests/review-page-wiring.test.ts` (Google before TripAdvisor in page source, `target=_blank` count), `tests/review-click-wiring.test.ts` (server-only import rule: client files must not import `review-tracking`; apply the same to `review-stats.ts`), `tests/landing-page.test.ts`, `tests/home-page.test.ts`, `tests/seo-jsonld*.test.ts` (asserts no rating block, per D-07: will fail by design, update to expect `aggregateRating`), `tests/i18n-hardcoded.test.ts`. Run the full suite after each wave; plan test edits explicitly.

### Pitfall 7: Cumulative layout / mobile floating stack
Two 56 px buttons stacked reduce usable space and can overlap the form submit on mobile. Keep the existing hide-on-`#reservation-submit` logic for the whole container; bottom padding (`pb-24`) already exists on the form card.

### Pitfall 8: Privacy policy drift
The site now loads Plausible (cookieless but processes request data) and receives free-text messages. Update `messages/*.json` privacy copy (FR/EN) to mention Plausible Cloud (EU-hosted, no cookies) and the « Un souci ? » message handling; PDPA/GDPR constraint in PROJECT.md. Plausible Cloud hosting location EU [ASSUMED, from training; verify before writing the sentence]. Bump the `lastUpdated` text.

### Pitfall 9: Review content authenticity
Never ship placeholder reviews. If the owner has not validated reviews, `SocialProof` must render only the rating badge (or nothing) and `aggregateRating` stays off, because the schema requires the rating be visible. Make `reviews: []` a supported state, and gate JSON-LD on `reviews.length > 0 && ownerValidated`.

## Code Examples

### aggregateRating addition (buildRestaurantJsonLd)
```ts
// seo.ts: values come from social-proof.ts, single source of truth
...(SOCIAL_PROOF.showAggregateRating ? {
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: SOCIAL_PROOF.rating,        // 4.7
    reviewCount: SOCIAL_PROOF.reviewCount,   // 1062
    bestRating: 5,
    worstRating: 1,
  },
} : {}),
```
Plus update the comment "No rating block (D-07)" and the test. A test must assert `ratingValue`/`reviewCount` equal the config values that `SocialProof.tsx` renders.

### Counted counter hit (service-role, swallow errors)
```ts
export async function recordReviewHit(source: ReviewSource, kind: 'visit' | 'google' | 'tripadvisor') {
  try {
    // Service role: gecko_review_clicks is written only through this security-definer RPC.
    const { error } = await createAdminClient().rpc('gecko_review_click_hit', { p_source: source, p_kind: kind })
    if (error) Sentry.captureException(new Error('review click count failed'))
  } catch (err) { Sentry.captureException(err) }
}
```

### Admin monthly table
Admin page `'use client'`, `fetch('/api/review/stats?months=12')` (admin GET via `requireAdmin` + cookie client RLS read), groups by month × source; manual totals via `PUT /api/review/stats` `{ month: 'YYYY-MM', platform, total }` validated (regex, integer 0..100000). French fixed text. Add a tile on `src/app/admin/page.tsx` (both the card grid and the lower link list, lines ~55-145) and rely on the admin layout/middleware guard (`/admin` prefix already gated; `tests/admin-routes-guarded.test.ts` should cover new API routes: mirror it for `/api/review/stats`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Plausible `script.js` + `data-domain` | Per-site `pa-<ID>.js` + inline `plausible.init` stub | Plausible tracker rework (2025) | Env var holds script ID, not domain; custom events via `plausible()` [CITED: plausible.io docs] |
| `next/image` `priority` | `preload` prop | Next 16.0 | Use `preload`; `priority` still works but deprecated [CITED: nextjs.org image docs] |
| `images.qualities` open | default `[75]`, required allowlist | Next 16.0 | `quality={60}` must be listed or is coerced |
| Default formats WebP only | opt-in `image/avif` | n/a | Add explicitly |

**Deprecated/outdated:** GA4 + consent banner (rejected D-01); `next-plausible` proxy requires `next start` semantic caveats.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Keyless Maps iframe `https://www.google.com/maps?q=lat,lng&z=16&output=embed` still renders | Pattern 6 | Map blank; swap for `pb=` embed URL from Google Maps Share dialog |
| A2 | Directions URL `https://www.google.com/maps/dir/?api=1&destination=lat,lng` | Pattern 6 | Button opens wrong view; low |
| A3 | LINE brand green `#06C755`; LINE URLs hosts `line.me`, `lin.ee`, `page.line.me` | Pattern 7 | Valid owner URL rejected by the host allowlist (then button hidden) |
| A4 | Plausible Cloud hosted in the EU (for the privacy sentence) | Pitfall 8 | Inaccurate privacy copy; verify before publishing |
| A5 | Vercel rewrites forward the client IP in `X-Forwarded-For` to Plausible | Pattern 1 | Events silently dropped; verify with Plausible realtime after launch |
| A6 | `customer_email` is nullable in DB (admin manual create) | Pitfall 5 | Needs a placeholder or migration; check 007 |
| A7 | 4.7 / 1 062 and Travellers' Choice are current and from Google + TripAdvisor respectively | Pitfall 2/9 | Wrong displayed numbers; owner must validate (D-11) |
| A8 | Vercel plan allows image optimization at this volume | Pitfall 1 | Optimizer quota; mitigated by pre-resized source |

## Open Questions (RESOLVED)

1. **Keep `aggregateRating` (D-14) despite Google's self-serving policy?**
   - Known: policy says self-controlled LocalBusiness reviews are ineligible for stars and aggregated third-party ratings should not be marked up. The decision is locked.
   - Unclear: whether the owner wants the (probably non-rendering) markup for non-Google consumers.
   - Recommendation: implement behind the `showAggregateRating` flag, default on per D-14, and tell the owner; easy off-switch.
   - RESOLVED: 05-03 implements aggregateRating behind the single `SHOW_AGGREGATE_RATING` flag in `src/utils/social-proof.ts` (default true, D-14), emitted only once owner-validated reviews are displayed (05-12 selection, 05-13 append); the policy risk is in OWNER-CHECKLIST.md (05-11).
2. **How do `telephone`/`whatsapp`/`sans_reservation` rows get created (D-06)?**
   - Known: no admin create exists.
   - Recommendation: add a minimal admin "Ajouter une réservation" (or confirm with owner that selector-only is enough, which makes three of four values unusable).
   - RESOLVED: 05-06 adds the admin-only `POST /api/reservations/manual` (requireAdmin + RLS insert, sources whatsapp/telephone/sans_reservation; `customer_email` verified nullable in 007) and the "Ajouter une réservation" form; 05-02 adds the source selector.
3. **Plausible script ID and goals** depend on the owner; **LINE URL**, **couple photo**, **validated reviews** likewise. Plans must not block on them (all gated).
   - RESOLVED: every owner input is gated and degrades cleanly (Plausible inert without a valid `pa-` id in 05-01, LINE hidden without a valid URL in 05-04, `COUPLE_PHOTO = null` in 05-10, `reviews: []` in 05-03 until 05-12/05-13); all owner actions are collected in OWNER-CHECKLIST.md (05-11).
4. **Spec file** (`Specs site Gecko Cabane – SEO et conversion.md`) is absent from the worktree (searched root); rely on REQUIREMENTS.md.
   - RESOLVED: `.planning/workstreams/conversion/REQUIREMENTS.md` is the spec source for all plans.
5. **Admin tile placement for « Avis »** in `src/app/admin/page.tsx`: trivial, follow existing card pattern.
   - RESOLVED: 05-09 adds the "Avis" card to the grid and the quick-links list of `src/app/admin/page.tsx`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node/npm | build/tests | ✓ | project toolchain | — |
| sharp | one-off hero downscale | ✓ | 0.34.5 (via next) | any image tool |
| Plausible Cloud account + `pa-` script ID | KPI-01 | ✗ (owner action) | — | code inert, no script rendered |
| Plausible goals configured | RESA-06 events | ✗ (owner action) | — | events fire but are not shown |
| `NEXT_PUBLIC_LINE_URL` | RESA-05 | ✗ (owner) | — | button hidden |
| `RESEND_API_KEY`, `RESTAURANT_NOTIFICATION_EMAIL`, `RATE_LIMIT_SECRET` | REV-07 | assumed set in prod (used by phase 1) | — | soft-fail + Sentry (existing behaviour) |
| Supabase migrations 015/016 applied | RESA-06, REV-06 | ✗ until applied | — | **must be applied before deploy** (same constraint as 014); code that writes new columns would otherwise 500 |
| Real review texts, couple photo, owner bio text | CONV-01/02 | ✗ (owner) | — | blocks hidden / "à compléter" |
| PageSpeed measurement | SEO-08 | ✓ via Vercel preview URL | — | Lighthouse local |

**Missing with no fallback:** none blocking code; deployment depends on migration ordering.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0, node environment (no jsdom) |
| Config file | `vitest.config.ts` (`tests/**/*.test.ts`, alias `@`) |
| Quick run command | `npx vitest run tests/<file>.test.ts` |
| Full suite command | `npm test` (also runs inside `npm run build`) |

Style: pure-function unit tests + source-scan wiring tests (read file text, assert patterns). Follow it; no component rendering tests.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KPI-01 | `PlausibleScript` returns null w/o env; script/endpoint use `/gcm/`; rewrites keyed on same env and validate `pa-` format | source-scan | `npx vitest run tests/analytics-wiring.test.ts` | ❌ Wave 0 |
| KPI-01 | middleware matcher excludes `/gcm/...` | unit | `npx vitest run tests/middleware-matcher.test.ts` | ✅ (extend) |
| RESA-06 | `track()` is no-op without `window.plausible`; EVENTS names stable | unit | `npx vitest run tests/analytics.test.ts` | ❌ Wave 0 |
| RESA-06 | attribution sanitizer accepts/rejects utm values | unit | `npx vitest run tests/attribution.test.ts` | ❌ Wave 0 |
| RESA-06 | migration 015 has check constraint with 4 values, default `'site'`, idempotent | source-scan | `npx vitest run tests/migrations.test.ts` | ✅ (extend) |
| RESA-06 | POST route never reads `source` from body; PUT whitelist accepts only the 4 values; Reservation type has `source` | source-scan + unit | `npx vitest run tests/reservations-post.test.ts tests/reservations-admin.test.ts` | ✅ (extend) |
| RESA-05 | `getLineUrl()` null for unset/invalid/non-https/foreign host; valid for line.me/lin.ee | unit | `npx vitest run tests/line.test.ts` | ❌ Wave 0 |
| RESA-05 | `FloatingContact` renders LINE only when `getLineUrl()` truthy, LINE above WhatsApp | source-scan | `npx vitest run tests/floating-contact.test.ts` | ❌ Wave 0 |
| SEO-08 | `next.config.ts` has avif+webp formats and qualities including used quality; hero uses `next/image` with `preload`/`fill`/`sizes`, no raw `<img src="/hero-bg.jpg">`; hero file < 1 MB | source-scan + fs size | `npx vitest run tests/hero-image.test.ts` | ❌ Wave 0 |
| MENU-03 | shared payment key exists in fr+en and is used by menu page and reservation section | i18n + source-scan | `npx vitest run tests/i18n.test.ts tests/payment-note.test.ts` | ✅/❌ |
| CONV-01 | social-proof config shape (rating 4.7, count 1062, reviews each have name/country/source/url/text/lang); SocialProof placed before `#reservation`; JSON-LD aggregateRating equals config; `reviewCount`, `ratingValue` present; "Laisser un avis" → `/review?src=site` | unit + source-scan | `npx vitest run tests/social-proof.test.ts tests/seo-jsonld.test.ts` | ❌/✅ (update) |
| CONV-02 | `#about` has owner/origin keys in fr+en; no new nav anchor | source-scan + i18n | `npx vitest run tests/about-section.test.ts` | ❌ Wave 0 |
| CONV-03 | `#contact` contains trajets keys, directions link, `MapEmbed` mounts iframe only after click (no `<iframe` outside conditional) | source-scan | `npx vitest run tests/map-embed.test.ts` | ❌ Wave 0 |
| REV-06 | `normalizeSource` allowlist; migration 016 shape (RPC service_role only, RLS admin, no `using (true)`); page uses `after` + `recordReviewHit`; redirect route maps targets from fixed table; `review-stats` not imported by client files | unit + source-scan | `npx vitest run tests/review-stats.test.ts tests/review-click-wiring.test.ts` | ❌/✅ |
| REV-05 | WhatsApp templates FR/EN/DE contain `https://geckocabanerestaurant.com/review?src=wa`; DE flagged "à relire" | unit | `npx vitest run tests/review-whatsapp.test.ts` | ❌ Wave 0 |
| REV-07 | feedback schema (length, optional email, src allowlist); route: honeypot early return, rate limit before send, `after()`, escapeHtml used, no DB insert; email contains source | unit + source-scan | `npx vitest run tests/review-feedback.test.ts` | ❌ Wave 0 |
| all | admin routes guarded (`/api/review/stats`, `/admin/avis`) | source-scan | `npx vitest run tests/admin-routes-guarded.test.ts` | ✅ (extend) |
| all | i18n parity, no hardcoded text | i18n | `npx vitest run tests/i18n.test.ts tests/i18n-hardcoded.test.ts` | ✅ |

Manual-only (justified): PageSpeed ≥ 85 / LCP < 2.5 s (needs deployed preview), Plausible events visible in dashboard, map actually loads, LINE link works, Resend delivery to owner inbox.

### Sampling Rate
- **Per task commit:** `npx vitest run <touched test files>`
- **Per wave merge:** `npm test`
- **Phase gate:** full suite green + `npm run lint` + `npm run build` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/analytics.test.ts`, `tests/analytics-wiring.test.ts`, `tests/attribution.test.ts`
- [ ] `tests/line.test.ts`, `tests/floating-contact.test.ts`
- [ ] `tests/hero-image.test.ts`, `tests/payment-note.test.ts`
- [ ] `tests/social-proof.test.ts`, `tests/about-section.test.ts`, `tests/map-embed.test.ts`
- [ ] `tests/review-stats.test.ts`, `tests/review-whatsapp.test.ts`, `tests/review-feedback.test.ts`
- [ ] Updates to existing: `middleware-matcher`, `migrations`, `seo-jsonld*`, `review-page-wiring`, `review-click-wiring`, `reservations-post`, `reservations-admin`, `admin-routes-guarded`
Framework install: none.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (admin existing) | existing Supabase auth |
| V3 Session Management | no | existing |
| V4 Access Control | yes | `requireAdmin()` on stats/manual routes; RLS `gecko_is_admin()`; service-role RPC only for writes |
| V5 Input Validation | yes | zod for feedback body; allowlists for `src`, `source`, utm; length caps; UUID check via `isReviewToken` |
| V6 Cryptography | yes | HMAC hash of IP via existing `hashKey` (never raw IP) |
| V8/V13 Data protection / API | yes | no PII stored for feedback; no stack traces |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect on counted `/api/review/go` | Tampering | Target from fixed map, never user URL |
| Email header/HTML injection in feedback | Tampering | `stripLineBreaks` subject, `escapeHtml` body, `replyTo` only after email validation |
| Spam of owner inbox via feedback form | DoS | honeypot + fill-time + per-IP `gecko_rate_limit_hit` |
| Forged reservation `source` | Tampering | server never reads it from public body; DB default + check constraint |
| Counter cardinality/poisoning via `src` | Tampering | source allowlist, DB check constraints |
| Service role leak to client | Info disclosure | `review-stats.ts` server-only; extend `tests/review-click-wiring.test.ts` + `no-public-secrets` scans |
| Stored XSS via review text | XSS | reviews are static config rendered as text; JSON-LD via `serializeJsonLd` |
| Tracking without disclosure | Compliance | privacy page update (Pitfall 8) |

## Sources

### Primary (HIGH confidence)
- Repository files read: `CLAUDE.md`, `05-CONTEXT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, migrations 008/009/010/014, `src/utils/{review-tracking,rate-limit,anti-bot,whatsapp,html,seo,resend}.ts`, `src/app/api/reservations/route.ts`, `ReservationForm.tsx` (submit path), `WhatsAppButton.tsx`, `review/page.tsx`, `[locale]/layout.tsx`, `[locale]/page.tsx` (hero/contact), `RestaurantJsonLd.tsx`, `middleware.ts`, `next.config.ts`, admin pages list, existing tests
- nextjs.org/docs/app/api-reference/components/image (lastUpdated 2026-09-28): preload, qualities, formats, v16 changes
- plausible.io/docs/proxy/guides/vercel; plausible.io/docs/custom-event-goals; plausible.io/docs/proxy/introduction
- developers.google.com/search/docs/appearance/structured-data/review-snippet

### Secondary (MEDIUM confidence)
- github.com/4lejandrito/next-plausible README (rejected alternative); npm registry: `@plausible-analytics/tracker` 0.4.6, `next-plausible` 4.0.0

### Tertiary (LOW confidence)
- Maps embed/directions URL forms, LINE brand color/hosts, Plausible EU hosting (training knowledge, see Assumptions Log)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, no new dependencies, all verified in repo
- Architecture: HIGH, mirrors existing code patterns
- Pitfalls: MEDIUM-HIGH, policy and build-time rewrite points from official docs; Maps/LINE details assumed

**Research date:** 2026-10-17
**Valid until:** 2026-11-17 (Plausible script format and Next 16 minor releases move; re-check if planning slips)
