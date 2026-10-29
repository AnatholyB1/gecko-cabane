# Phase 7: Newsletter - Research

**Researched:** 2026-10-17
**Domain:** Newsletter consent ledger (Supabase) + Brevo contact sync + signed double opt-in links (Next.js 16 route handlers) + collection points (footer, pop-up, QR page, WiFi page) + Vercel Cron
**Confidence:** MEDIUM (Brevo webhook auth header format and automation trigger wording could not be confirmed from official docs; everything on the codebase side is HIGH)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Source de vérité et synchro Brevo (NEWS-01)
- **D-01:** **Registre Supabase + copie Brevo.** `gecko_marketing_consents` (migration 008) reste la preuve légale PDPA/RGPD (email, consent, locale, source, version du texte, `consented_at`). Brevo reçoit le contact par API avec les mêmes attributs. La preuve survit à un changement d'outil.
- **D-02:** **Double opt-in maison via Resend** : email de confirmation avec lien signé, route de confirmation (ex. `/newsletter/confirm`). Le clic enregistre `confirmed_at` dans le registre ; **seulement alors** le contact est poussé dans Brevo comme confirmé. Gabarit `baseTemplate` existant, FR/EN ; `de`/`sv` retombent sur EN.
- **D-03:** **Consentements existants (formulaire de réservation, phase 1)** : un **unique email de confirmation** leur est envoyé ; seuls ceux qui cliquent entrent dans Brevo. Pas d'import direct de cases cochées (contrainte PROJECT.md : double opt-in). Envoi sous l'accord du propriétaire (action vers des tiers).
- **D-04:** **Désinscription : lien Brevo + webhook vers le registre.** Les envois Brevo portent son lien de désinscription ; un webhook Brevo écrit le retrait (consent=false, horodatage) dans `gecko_marketing_consents`. Les emails Resend adressés à des abonnés portent un lien vers une route signée `/newsletter/unsubscribe` qui met à jour registre et Brevo.

### Séquences et déclencheurs (NEWS-06)
- **D-05:** Les séquences tournent dans **les automatisations Brevo**, alimentées par des attributs de contact (`last_visit_date`, langue, segment) poussés par notre code. Le code ne planifie pas l'envoi ; il synchronise les données.
- **D-06:** **Date de visite** = `reservation_date` d'une réservation honorée (mêmes critères que la phase 4 : `confirmed`/`completed`, date passée), rapprochée par email. Pour les inscrits sans réservation (QR de l'addition, WiFi), J+1/J+3 partent de la date de confirmation de l'inscription.
- **D-07:** **Pas de collision avec l'email d'avis (phase 4)** : l'invitation d'avis reste à J+1 ; l'email newsletter « après-visite » est décalé (J+2) pour qu'un contact ne reçoive jamais deux emails le même jour. La séquence « pendant séjour » est à J+3.
- **D-08:** **Plafond « 1 email/mois hors séquences »** appliqué par convention et par les règles de fréquence/suppression de Brevo, **non codé** dans l'app. « Retour en octobre » = campagne aux touristes passés, envoyée chaque septembre/octobre ; « saison verte » (mai–octobre) = flux saisonnier ciblant résidents et anciens visiteurs.
- **D-09:** **Contenu des séquences** : brouillons FR/EN rédigés par Claude, relus par le propriétaire avant activation dans Brevo. DE/SV après relecture humaine (phase 6) ; rien n'est actif en DE/SV avant.

### Points de collecte (NEWS-02, NEWS-03, NEWS-04)
- **D-10:** **Formulaire de pied de page** (email + langue, case de consentement non pré-cochée, lien `/privacy`) dans `SiteFooter`.
- **D-11:** **Pop-up de sortie** : desktop = intention de sortie ; mobile = après ~45 s ou 60 % de défilement, en **bandeau bas (bottom sheet), jamais plein écran**. **Une fois par visiteur** (mémoire localStorage ~90 jours ; plus jamais après inscription ou fermeture). Pas sur `/review`, l'admin ni le tunnel de réservation. Le taux d'inscription est mesuré (par source).
- **D-12:** **QR de l'addition** → page dédiée **`/newsletter?src=qr`** (noindex, hors sitemap, sans hreflang vers page non publiée) proposant la **recette du curry de crabe** après double opt-in. Source de registre `bill_qr`, distincte de `/review?src=qr`. Nouveau support d'impression distinct des PDF d'avis de la phase 4.
- **D-13:** **Pas de portail captif** (le WiFi est protégé par mot de passe). NEWS-03 est livré en **page `/wifi`** : une carte de table avec QR vers `/wifi?src=wifi` affiche **immédiatement** le nom du réseau et le mot de passe (aucune porte), avec un formulaire d'inscription facultatif dessous. Source de registre `wifi`.

### Segmentation (NEWS-07)
- **D-14:** **Pays** : indicatif du téléphone (E.164, phase 1) pour les réservants ; sinon en-tête géographique Vercel (pays seulement, l'IP n'est pas stockée) ; sinon inconnu. **Résident** = case facultative « J'habite à Krabi » ou numéro +66 ; sinon **touriste** par défaut, modifiable dans Brevo.
- **D-15:** **`last_visit_date`** synchronisé par un **job planifié (Vercel Cron)** à partir des réservations honorées (réutilise la sélection de la phase 4), pour les abonnés confirmés rapprochés par email. Il alimente aussi les déclencheurs J+1/J+3.
- **D-16:** **Langue** : FR/EN/DE/SV depuis la locale de la page d'inscription ou de la réservation.

### Guide gourmand (NEWS-05)
- **D-17:** Texte FR/EN rédigé par Claude, **recommandations et photos fournies par le propriétaire** (rien d'inventé). PDF statique dans `public/`, **lien dans l'email de bienvenue** après double opt-in. DE/SV après relecture (phase 6).

### Claude's Discretion
Schéma exact des ajouts au registre (colonnes `confirmed_at`, `unsubscribed_at`, jeton de confirmation, attributs) et numéro de migration (prochain libre après 014) ; format du lien signé (HMAC/jeton) ; noms des routes API et du cron ; structure du module de synchro Brevo (fonctions pures testables) ; clés i18n (fr + en) ; mesure du taux d'inscription (événements ou table) ; mise en page du pop-up, du pied de page et des pages `/newsletter` et `/wifi` ; format de la carte WiFi et de l'insert d'addition ; mise à jour du texte `/privacy` (version du texte de consentement) ; variables d'environnement (`BREVO_API_KEY`, secret de signature, `CRON_SECRET` déjà prévu) ; où stocker le mot de passe WiFi (variable d'environnement plutôt que dans le code).

### Deferred Ideas (OUT OF SCOPE)
- Portail captif WiFi réel : impossible avec un WiFi à mot de passe ; à reconsidérer seulement si le matériel change.
- Plafond « 1 email/mois » codé dans l'application (`last_marketing_email_at`) : à ajouter si Brevo ne suffit pas.
- Vue admin des abonnés et tableau du taux d'inscription : à voir avec le reporting (phase 5) si nécessaire.
- Séquences et Guide gourmand en DE/SV : après relecture humaine (phase 6).
- Fusion de l'email J+1 newsletter avec l'email d'avis : écartée (modifie la phase 4).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NEWS-01 | Sync Brevo, double opt-in, désinscription, consentement horodaté | Ledger extension (migration 015), HMAC confirm/unsubscribe links with POST-confirm step, Brevo `fetch` client (create/update contact), Brevo webhook route |
| NEWS-02 | Footer + pop-up de sortie, taux mesuré | `NewsletterForm` shared component, `NewsletterPopup` (non-modal bottom sheet), `gecko_newsletter_events` counter table |
| NEWS-03 | WiFi : email+consentement ou accès sans inscription | `/wifi` page (noindex, dynamic, password from env), alias route `/wifi` |
| NEWS-04 | QR addition -> inscription (curry de crabe) séparé de l'avis | `/newsletter` page + alias route, source `bill_qr`, recipe link in welcome email |
| NEWS-05 | Guide gourmand PDF après confirmation | Static PDF in `public/`, link in welcome email sent on confirm |
| NEWS-06 | Séquences bienvenue/J+1/J+3/octobre/saison verte | Brevo automations fed by attributes; code only syncs (cron + confirm push); owner-gated Brevo setup tasks |
| NEWS-07 | Segmentation langue/pays/résident/dernière visite | Brevo attributes `LANGUAGE`, `COUNTRY`, `RESIDENT`, `LAST_VISIT_DATE`, `SOURCE`; libphonenumber-js country; Vercel geo header (with caveat) |
</phase_requirements>

## Summary

The phase is mostly plumbing around three things that already exist: the consent ledger (`gecko_marketing_consents`, service-role writes only, admin read RLS), the Phase 4 cron pattern (`CRON_SECRET` bearer, claim-before-send, dry-run, Sentry), and the Phase 4 noindex utility page + short-URL alias pattern (`/review`). No new npm packages are needed: Brevo is called with `fetch` (two endpoints: create/update contact, plus a webhook receiver), HMAC uses `node:crypto` (already used in `rate-limit.ts`), validation uses zod 4 (already used in `reservation-schema.ts`).

The consent model should stay an **append-only ledger with a per-row confirmation lifecycle**: each consent row (footer, popup, bill_qr, wifi, and the legacy `reservation_form` rows from D-03) gets its own `confirmed_at`; a withdrawal is a new row with `consent=false`. "Current state" of an email = latest row (pure TS resolver, unit-tested). This makes D-03 (confirm legacy rows) and D-04 (webhook writes consent=false) fit the existing schema with only additive columns.

Four non-obvious risks drive the design: (1) **link scanners** (Outlook SafeLinks, Gmail, antivirus) prefetch GET links, so a GET that confirms or unsubscribes will auto-confirm bots and auto-unsubscribe real people; confirm/unsubscribe must be GET page + POST button. (2) **Geo-IP at the restaurant is Thailand for everybody**, so `x-vercel-ip-country` is wrong for the `bill_qr` and `wifi` sources (tourists roaming/using restaurant WiFi) and must not be used to infer country or residency there. (3) The `/review` alias trick is required for `/newsletter` and `/wifi` short URLs, otherwise next-intl (`localePrefix: 'always'`, `localeDetection: false`) sends every English tourist to `/fr/...`. (4) Brevo date-triggered automations are the least documented part; build the code so it works with either a date-attribute trigger or a list-add trigger (fallback in Open Questions, resolved).

**Primary recommendation:** Extend `gecko_marketing_consents` additively (migration 015), keep Brevo as a one-way copy written only after `confirmed_at`, implement all Brevo/signing/segment logic as pure functions in `src/utils/newsletter*.ts` with Vitest coverage, and treat every Brevo-account and owner-content step (attributes, list, webhook, automations, sender domain DNS, recipe, guide, WiFi password) as an explicit owner-gated checkpoint task.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Subscribe (validate, rate-limit, write ledger, send confirm email) | API / Backend (Route Handler) | Database | Service-role write; anon has no DML (011) |
| Signed confirm/unsubscribe link verification | API / Backend | Frontend Server (page renders button) | HMAC secret server-only; POST performs the state change |
| Brevo contact push / update / unsubscribe | API / Backend | — | `BREVO_API_KEY` server-only; never in client |
| Brevo unsubscribe webhook | API / Backend | Database | Bearer-verified route writes `consent=false` row |
| `last_visit_date` + country/resident sync | API / Backend (Vercel Cron) | Database | Reads reservations (PII) with service role, pushes to Brevo |
| Footer form, pop-up, `/newsletter`, `/wifi` UI | Browser / Client (form, pop-up logic) | Frontend Server (page shells, metadata) | Pop-up needs `window`/localStorage/mouse events; pages SSR for i18n + noindex |
| Pop-up frequency capping | Browser / Client (localStorage) | — | Per-visitor, no server state (no cookie banner needed for a functional key; see PDPA note) |
| Signup-rate measurement | Database (counter table) | API / Backend | Anonymous aggregate counters, no PII |
| Short URL locale resolution (`/newsletter`, `/wifi`) | Frontend Server (middleware bypass + alias route) | — | Same as `/review` alias |
| Sequences (welcome, J+2, J+3, October, green season) | External (Brevo automations) | — | D-05: code never schedules sends |
| Welcome email with guide + recipe link | API / Backend (Resend) | CDN / Static (PDF in `public/`) | Sent on confirm |

## Standard Stack

### Core (all already installed; no new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:crypto` | built-in | HMAC-SHA256 signed links, `timingSafeEqual` | Already used in `src/utils/rate-limit.ts` [VERIFIED: codebase grep] |
| `zod` | 4.3.6 (declared `^4.3.6`) | Request validation (`z.email()`, `z.enum`) | Already used in `reservation-schema.ts` [VERIFIED: package.json] |
| `resend` | ^6.28.1 | Confirmation + welcome emails (transactional) | Locked by PROJECT.md / D-02 [VERIFIED: package.json] |
| `libphonenumber-js` | ^1.12.40 (`/min`) | Phone -> country (`parsePhoneNumberFromString(...).country`) | Already used in `validation.ts` [VERIFIED: codebase grep] |
| `@supabase/supabase-js` | ^2.98.0 | `createAdminClient()` for ledger writes | Project convention [VERIFIED: package.json] |
| `@sentry/nextjs` | ^10.45.0 | Error capture in routes/cron | Project convention [VERIFIED: package.json] |
| Native `fetch` | Node 20 | Brevo REST calls (`https://api.brevo.com/v3`) | Avoids an extra SDK dependency for 3 endpoints [ASSUMED: preference, planner may override] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | ^4.1.0 | Unit tests (node env, `tests/**/*.test.ts`) | All pure modules + source-scan wiring tests [VERIFIED: vitest.config.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fetch` wrapper | `@getbrevo/brevo` SDK | Extra dependency and slopcheck gate for no gain on 3 endpoints |
| Stateless HMAC links | Stored random token per row | Stored token (like `review_token`) needs a column + unique index; HMAC needs only a secret. Recommend HMAC (below) |
| Brevo native DOI (`/contacts/doubleOptinConfirmation`) | custom DOI | Locked: D-02 is custom via Resend |

**Installation:** none. `npm view` / slopcheck not applicable (no new packages).

## Package Legitimacy Audit

No external packages are installed by this phase. All libraries are already in `package.json` and `package-lock.json`.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 Visitor (footer / popup / /newsletter?src=qr / /wifi?src=wifi)
        |  POST /api/newsletter/subscribe  {email, locale, consent=true, resident?, source, honeypot, started_at}
        v
 [validate zod + honeypot/fill-time + rate-limit(ip,email hashed)]
        |--> geo: x-vercel-ip-country (ONLY for footer/popup sources)
        v
 gecko_marketing_consents  (+ row: consent=true, source, locale, version, consented_at, confirmation_sent_at)
        |--> Resend: confirmation email (HMAC link /{locale}/newsletter/confirm?r=<rowId>&s=<sig>)
        v
 Always the same generic response (no email enumeration)

 Email link click --> GET /{locale}/newsletter/confirm (page, noindex, shows "Confirm" button; NO state change)
        |  button -> POST /api/newsletter/confirm {r, s}
        v
 verify HMAC (timingSafeEqual) + age <= 30d --> set confirmed_at (if null)
        |--> Brevo POST /v3/contacts {email, attributes, listIds:[LIST], updateEnabled:true}   (only now)
        |--> Resend: welcome email (Guide gourmand PDF link; recipe link if source=bill_qr)
        v
 Brevo automations (owner-configured): Welcome / J+2 / J+3 / October / Green season
        ^
        | PUT /v3/contacts/{email} {attributes:{LAST_VISIT_DATE,COUNTRY,RESIDENT}}   (attributes only, never listIds)
 Vercel Cron GET /api/cron/newsletter-sync (CRON_SECRET) daily
        |  reads confirmed, not-withdrawn subscribers + honored reservations (confirmed/completed, date <= today, Krabi)

 Unsubscribe paths
   Brevo campaign/automation footer link --> Brevo --> POST /api/webhooks/brevo (Bearer) --> insert row consent=false
   Resend email link --> GET /{locale}/newsletter/unsubscribe (button page) --> POST /api/newsletter/unsubscribe
        --> insert row consent=false + Brevo PUT emailBlacklisted:true / unlink list
```

### Recommended Project Structure
```
supabase/migrations/015_newsletter.sql          # additive columns + gecko_newsletter_events + counter RPC
src/utils/newsletter-links.ts                   # pure: sign/verify HMAC, base URLs (no next/supabase/resend imports)
src/utils/newsletter-schema.ts                  # pure: zod subscribe schema, sources enum, consent text version
src/utils/newsletter-segments.ts                # pure: country from phone, resident rule, resolveStatus(rows), selectSyncUpdates(...)
src/utils/brevo.ts                              # server: fetch wrapper (upsertContact, updateContactAttributes, unsubscribeContact), pure payload builders exported
src/utils/resend.ts                             # + newsletterConfirmEmail, newsletterWelcomeEmail (reuse baseTemplate/escapeHtml)
src/app/api/newsletter/subscribe/route.ts
src/app/api/newsletter/confirm/route.ts
src/app/api/newsletter/unsubscribe/route.ts
src/app/api/newsletter/event/route.ts           # popup_shown / popup_dismissed counters
src/app/api/webhooks/brevo/route.ts
src/app/api/cron/newsletter-sync/route.ts       # + vercel.json entry
src/app/api/cron/newsletter-legacy-confirm/route.ts  # D-03 one-shot (manual, owner approval, ?dry=1)
src/app/newsletter/route.ts, src/app/wifi/route.ts   # locale alias redirects (copy review-alias pattern) + middleware set
src/app/[locale]/newsletter/page.tsx (+ confirm/page.tsx, unsubscribe/page.tsx)
src/app/[locale]/wifi/page.tsx
src/components/NewsletterForm.tsx               # 'use client', shared by footer / page / wifi / popup
src/components/NewsletterPopup.tsx              # 'use client', mounted in [locale]/layout.tsx
public/guide-gourmand-krabi-town-{fr,en}.pdf    # owner-supplied content
```

### Pattern 1: Append-only ledger with per-row lifecycle (migration 015)
**What:** Additive columns on `gecko_marketing_consents`; withdrawal = new `consent=false` row; state resolved by latest row per `lower(email)`.
**Schema (recommended):**
```sql
-- 015_newsletter.sql  (idempotent, additive; no new policy needed: table has admin-select only, anon revoked in 011)
alter table public.gecko_marketing_consents
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists country text,                 -- ISO-3166 alpha-2 or null
  add column if not exists is_resident boolean not null default false,
  add column if not exists brevo_synced_at timestamptz,
  add column if not exists last_visit_synced date;       -- last value pushed to Brevo (change detection)

create index if not exists idx_gecko_marketing_consents_unconfirmed
  on public.gecko_marketing_consents (id) where consent and confirmed_at is null;
```
No `locale` constraint exists on this table (the `de`/`sv` check is on `gecko_reservations` only) [VERIFIED: migration 008 grep], so `de`/`sv` can be stored without a change. `source` is free text: use a TS enum (`footer`, `popup`, `bill_qr`, `wifi`, `reservation_form`, plus withdrawal sources `brevo_webhook`, `unsubscribe_link`).
**Do not** add a policy or new grants: the table already has RLS + admin-select only and anon DML revoked (010/011); new columns inherit. A `tests/migrations.test.ts`-style static test should assert no `using (true)` and no anon grant is introduced.

### Pattern 2: Signed link = HMAC over `(purpose, rowId, exp)` + POST confirmation
**What:** `sig = base64url(HMAC-SHA256(NEWSLETTER_SIGNING_SECRET, "confirm:" + rowId + ":" + exp))`; URL carries `r`, `e`, `s`. Verify with `timingSafeEqual` after length check (same pattern as the Vercel docs example [CITED: vercel.com/docs/headers/request-headers]). Confirm links expire at 30 days; unsubscribe links carry no expiry (`e` omitted) and sign over the row id.
**Why GET page + POST button:** mail scanners prefetch links; a state-changing GET would auto-confirm (voids the DOI proof) and auto-unsubscribe. The page performs no write on GET.
**Also add** `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers on Resend emails to subscribers (the unsubscribe URL must accept POST) [ASSUMED: RFC 8058 behavior; Resend `headers` option; verify in Resend docs during planning].
**Example (pure module):**
```typescript
// src/utils/newsletter-links.ts
import { createHmac, timingSafeEqual } from 'node:crypto'
export function signNewsletterLink(secret: string, purpose: 'confirm' | 'unsubscribe', rowId: number, exp?: number): string {
  return createHmac('sha256', secret).update(`${purpose}:${rowId}:${exp ?? ''}`).digest('base64url')
}
export function verifyNewsletterLink(secret: string, purpose: 'confirm' | 'unsubscribe', rowId: number, exp: number | undefined, sig: string, nowSec: number): boolean {
  if (exp !== undefined && nowSec > exp) return false
  const expected = Buffer.from(signNewsletterLink(secret, purpose, rowId, exp))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
```

### Pattern 3: Brevo calls (verified endpoints)
- **Create/upsert:** `POST https://api.brevo.com/v3/contacts` with `api-key` header; body `{ email, attributes, listIds, updateEnabled: true }`. `updateEnabled` default is false; attributes must already exist in the account and mistyped values are ignored; 201 on create returns `id` [CITED: developers.brevo.com/reference/createcontact].
- **Update:** `PUT https://api.brevo.com/v3/contacts/{email-url-encoded}` body `{ attributes, listIds, unlinkListIds, emailBlacklisted }`; 204 on success, 404 if not found [CITED: developers.brevo.com/reference/updatecontact]. Attribute names uppercase.
- **Rate limits:** `/v3/contacts/*` = 10 req/s and 36,000 req/h, both applied [CITED: developers.brevo.com/docs/api-limits]. Sequential calls with ~150 ms pause stay well under.
- **Date attribute format:** send `YYYY-MM-DD` [ASSUMED: confirm with one sandbox contact before relying on it].
- Cron updates use `PUT` with attributes only, never `listIds`, so a Brevo-side unsubscribed contact is never re-added by the sync. Only the confirm route and an explicit re-subscribe (new confirmed ledger row) send `listIds` and `emailBlacklisted:false`.

### Pattern 4: Brevo webhook receiver
Create via API (`POST /v3/webhooks`) with `type: "marketing"`, `events: ["unsubscribed", "spam"]` (allowed marketing values include `spam, opened, click, hardBounce, softBounce, unsubscribed, listAddition, delivered, contactUpdated, contactDeleted`) and `auth: { type: "bearer", token }` [CITED: developers.brevo.com/reference/createwebhook, /docs/secured-webhooks]. Brevo docs do not state the header it sends; assume `Authorization: Bearer <token>` and compare with `timingSafeEqual` [ASSUMED]. Make the route tolerant: also accept the same token as `?token=` in the registered URL if the header test fails (decide after a live test with the owner). Doc inconsistency: the payload example uses `"event": "unsubscribe"` while the create enum is `unsubscribed`; accept both. Payload carries `email`, `list_id[]`, `ts_event`. Policy: any unsubscribe/spam event withdraws marketing consent globally (conservative, PDPA-safe); respond 200 fast, idempotent (skip if latest row already `consent=false`). Webhook limit is 40 per account (marketing + transactional) [CITED: developers.brevo.com/docs/how-to-use-webhooks].

### Pattern 5: Cron `newsletter-sync` (reuse Phase 4)
Same skeleton as `src/app/api/cron/review-invitations/route.ts` (Bearer `CRON_SECRET`, fail closed, `?dry=1`, `maxDuration = 60`, Sentry, sleep between calls). Steps: load newsletter-source ledger rows (small table), resolve active subscribers (confirmed, not withdrawn) in a pure function, load honored reservations (`REVIEW_ELIGIBLE_STATUSES`, `reservation_date <= krabiToday`) for those emails, compute `max(reservation_date)` per email, push only when it differs from `last_visit_synced`. Vercel Hobby crons: one run per day max, timing ±59 min; up to 100 crons per project [CITED: vercel.com/docs/cron-jobs/usage-and-pricing]. Add `{ "path": "/api/cron/newsletter-sync", "schedule": "30 4 * * *" }` to `vercel.json` (existing review cron is `0 4 * * *`). If the account is already Pro, nothing changes.
**Phone-derived fields in the same job:** country from `parsePhoneNumberFromString(customer_phone)?.country`; resident if country calling code is 66 (D-14). Calling codes shared by several countries (+1) return `undefined` country; keep it null.

### Pattern 6: Pop-up (Google-compliant, non-modal bottom sheet)
Google flags interstitials that cover the whole page or hide content, and treats "banners that take up only a small fraction of the screen" as acceptable, explicitly including newsletter sign-ups in small banner containers [CITED: developers.google.com/search/docs/appearance/avoid-intrusive-interstitials]. Therefore: `role="dialog"` non-modal (`aria-modal` omitted), fixed bottom, `max-h` ~35 vh, no backdrop, no scroll lock, no focus trap, Escape and a visible close button (44x44 px), safe-area padding, offset so it does not overlap the existing `WhatsAppButton`. Triggers: desktop (`matchMedia('(hover: hover) and (pointer: fine)')`) = `mouseout` on `document` with `relatedTarget === null && clientY <= 0`, armed after ~10 s on page; touch = `setTimeout(45_000)` OR scroll depth >= 60 % (whichever first, once). localStorage key stores `{ until: epochMs }` (~90 days) wrapped in try/catch (Safari private mode, blocked storage); set on show, on dismiss and on successful subscribe. Excluded paths via `usePathname` from `@/i18n/navigation`: `/review`, `/newsletter`, `/wifi`, and suppress while the reservation form has focus/dirty state. Mount `NewsletterPopup` in `src/app/[locale]/layout.tsx` next to `WhatsAppButton` (admin is outside `[locale]`, so it is excluded by construction).

### Pattern 7: Short-URL alias + noindex utility pages
Middleware (`localePrefix: 'always'`, `localeDetection: false`) redirects `/newsletter` to `/fr/newsletter`, so English tourists scanning a QR would get French. Reuse the `/review` mechanism: add `'/newsletter'` and `'/wifi'` to `REVIEW_ALIASES` in `src/middleware.ts` (rename the set to a generic name), add `src/app/newsletter/route.ts` and `src/app/wifi/route.ts` resolving locale from Accept-Language (`pickAcceptLanguage` in `src/utils/review-links.ts` is reusable; de/sv -> en), forwarding only whitelisted `src` (`qr`, `wifi`), `Cache-Control: private, no-store`, 307. Update `tests/middleware-matcher.test.ts`. Pages under `[locale]` follow `review/page.tsx`: `generateMetadata` returns only `{ title, robots: { index: false, follow: false } }` (no `buildPageMetadata`, no canonical/alternates), and are NOT added to `PUBLISHED_PAGES` (sitemap/hreflang source). Do not `Disallow` them in `robots.ts` (crawlers must fetch the page to see `noindex`); they are simply not linked anywhere.

### Pattern 8: Signup-rate measurement
Add `gecko_newsletter_events (day date, event text, source text, count int, primary key (day, event, source))` plus a `security definer` RPC `gecko_newsletter_count(p_event, p_source)` doing `insert ... on conflict do update set count = count + 1`, executable by `service_role` only (mirror the grant pattern of `gecko_create_reservation`: `revoke all ... from public, anon, authenticated; grant execute ... to service_role`), table with RLS enabled and `revoke all ... from anon, authenticated` (mirror 010 for `gecko_rate_limits`). Events: `popup_shown`, `popup_dismissed`, `subscribed` (server-side on successful subscribe), `confirmed`. Rate per source = confirmed ledger rows by `source` / `popup_shown` (query by SQL; admin view is deferred). No third-party analytics exists in `package.json`, so this is the minimal compliant option (no PII, no cookies).

### Anti-Patterns to Avoid
- **State change on GET** (confirm/unsubscribe): scanners will trigger it. Use POST behind a button.
- **Pushing to Brevo before `confirmed_at`**: violates D-02 and the double opt-in constraint.
- **Using `x-vercel-ip-country` for `bill_qr` / `wifi`** or inferring "resident" from country `TH`: everyone at the restaurant resolves to Thailand.
- **Cron sending `listIds`**: could re-add an unsubscribed contact.
- **Returning different responses for known/unknown emails** on subscribe (enumeration of the customer list).
- **Reading the WiFi password with `NEXT_PUBLIC_*`** or hard-coding it: it would be inlined in the client bundle/repo.
- **Duplicate confirmation sends**: claim `confirmation_sent_at` before sending (Phase 4 pattern), release on failure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Constant-time token compare | `===` on signatures | `crypto.timingSafeEqual` with length pre-check | Timing leaks |
| Email validity | custom regex | zod 4 `z.email().max(254)` (as in reservation-schema) | Consistency, edge cases |
| Phone -> country | prefix tables | `libphonenumber-js/min` `parsePhoneNumberFromString().country` | Shared calling codes, formats |
| Rate limiting | in-memory counters | existing `gecko_rate_limit_hit` RPC + `hashKey` (extend the `kind` union with `'newsletter-ip'`/`'newsletter-email'`, or a `scope` prefix) | Serverless instances share no memory; reuses HMAC hashing so raw IP/email are never stored |
| Honeypot / min fill time | new bot logic | `src/utils/anti-bot.ts` (`isHoneypotFilled`, `checkFillTime`) | Already tested |
| Email HTML shell | new template | `baseTemplate`, `escapeHtml`, `stripLineBreaks` in `resend.ts` / `html.ts` | Brand + XSS safety; `baseTemplate` is not exported today, so add the new email builders inside `resend.ts` |
| Unsubscribe footer in Brevo sends | own link | Brevo's mandatory unsubscribe link + webhook | D-04 |
| Scheduling of sequences | cron that sends emails | Brevo automations | D-05 |
| Krabi date math | `new Date()` local | `krabiToday`, `addDays` from `review-invitations.ts` | Server TZ independence |

**Key insight:** every hard part (signing, rate-limiting, anti-bot, Krabi dates, email shell, cron skeleton, noindex pages, alias redirects) already has a tested helper in this repo; the phase is composition plus Brevo wiring.

## Runtime State Inventory

Not a rename/refactor phase, but it creates external runtime state that is not in git:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing `gecko_marketing_consents` rows from reservation form (consent=true, unconfirmed) | Data: D-03 one-shot confirmation job; never auto-import to Brevo |
| Live service config | Brevo account: contact attributes, list, webhook, automations, sender/domain authentication | Owner-gated manual/API setup; document IDs in env |
| OS-registered state | None | — |
| Secrets/env vars | New: `BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_WEBHOOK_TOKEN`, `NEWSLETTER_SIGNING_SECRET`, `WIFI_SSID`, `WIFI_PASSWORD`; existing `CRON_SECRET`, `RATE_LIMIT_SECRET`, `RESEND_API_KEY` | Create in Vercel (owner approval); add names to a no-public-secrets test (existing `tests/no-public-secrets.test.ts`) |
| Build artifacts | `public/` PDF guide and print supports (static) | Owner content required |

## Common Pitfalls

### Pitfall 1: Link prefetch auto-confirms or auto-unsubscribes
**What goes wrong:** Outlook SafeLinks/Gmail/AV fetch the link; confirm fires without a human; unsubscribe link silently removes a real subscriber.
**How to avoid:** GET renders a button; POST changes state. Test: GET handler/page has no write (source-scan test).
**Warning signs:** `confirmed_at` within seconds of `confirmation_sent_at`.

### Pitfall 2: Brevo attributes missing
**What goes wrong:** `POST /contacts` succeeds but attributes are silently dropped if they do not already exist or mismatch the type [CITED: Brevo createcontact].
**How to avoid:** Plan an owner-gated setup task creating `LANGUAGE` (text), `COUNTRY` (text), `RESIDENT` (boolean or text), `LAST_VISIT_DATE` (date), `SOURCE` (text), `CONSENT_AT` (date) in Brevo (UI or `POST /v3/contacts/attributes/normal/{name}` [ASSUMED endpoint shape, verify]); add a smoke script that upserts a test contact and reads it back.

### Pitfall 3: Geo header wrong at the restaurant (see Summary)
**How to avoid:** `resolveCountry({ phoneCountry, geoCountry, source })` pure function: phone > (geo only if source in footer/popup) > null. Header is absent in local dev; treat missing/`XX`-like values as null; accept only `/^[A-Z]{2}$/`.

### Pitfall 4: Brevo date-trigger uncertainty
**What goes wrong:** Brevo's help pages describe date triggers via a "Contact attributes" entry condition in the *classic* editor, only available to accounts that used it since early 2025; a community thread reports unannounced changes in "date in attribute occurs" behavior [CITED: help.brevo.com/hc/en-us/articles/115001468849; community.brevo.com/t/2838]. 
**How to avoid:** First planning task = owner confirms editor type and that an "X days after date attribute" entry exists. Fallback (still compatible with D-05's spirit): the cron additionally sets a `SEQUENCE_STAGE` attribute or adds the contact to a dedicated Brevo list on the computed day; the automation triggers on that. Keep the code's output (attributes) identical so either works.

### Pitfall 5: D-06 vs reality for bill_qr / wifi
Contacts sign up at the table but may confirm hours/days later; "date de confirmation" (D-06) could misplace J+1 by days. Research recommendation: for `bill_qr` and `wifi`, set `LAST_VISIT_DATE` to the date of `consented_at` (Krabi date) since the signup happens during the visit; flag to owner as a refinement of D-06.

### Pitfall 6: D-07 collision window
Review invite goes at J+1 (Phase 4 window days 1-3 old, catch-up). The newsletter J+2 email depends on Brevo timing; Brevo sends in its own schedule so a late review invite (catch-up at day 2-3) can still coincide. Set Brevo send time to a different hour of day from the Resend cron (04:00 UTC = 11:00 Krabi) or accept a tiny overlap; and keep welcome email (immediate on confirm) distinct. Document for the owner.

### Pitfall 7: Re-subscribe after Brevo unsubscribe/blacklist
Brevo `emailBlacklisted` persists. On explicit new confirmed consent, send `emailBlacklisted:false` with `listIds` in the upsert; verify behavior on a sandbox contact [ASSUMED].

### Pitfall 8: Brevo free plan limits
Brevo free plan: 300 emails/day and a 100,000-contact storage cap per Brevo help; whether automations are available/limited on the free plan could not be confirmed from official docs [CITED: help.brevo.com/hc/en-us/articles/208580669 via search; automation scope UNVERIFIED]. Owner must confirm plan before the sequences are promised in the plan.

### Pitfall 9: WiFi page exposure
Password readable by anyone with the URL, `noindex` is not access control. Page is server-rendered with `export const dynamic = 'force-dynamic'` (or reads env at request time) so rotating `WIFI_PASSWORD` needs a redeploy only if the env is baked at build; use `Cache-Control: no-store`. Tell the owner to rotate the password periodically.

### Pitfall 10: Email abuse as a relay
Anyone can submit someone else's email; the confirmation email then goes to a third party. Mitigations: hashed per-IP and per-email rate limits (e.g. 5/h/IP, 3/day/email), honeypot, and idempotent resend suppression (do not re-send a confirmation more than once per 24 h per email).

## Code Examples

### Pure resolver of current state (tested in Vitest)
```typescript
// src/utils/newsletter-segments.ts
export type LedgerRow = { id: number; email: string; consent: boolean; confirmed_at: string | null; consented_at: string; source: string }
/** Latest row per lower(email) decides; active = consent && confirmed_at. */
export function resolveActiveSubscribers(rows: LedgerRow[]): Map<string, LedgerRow> {
  const latest = new Map<string, LedgerRow>()
  for (const r of rows) {
    const k = r.email.toLowerCase()
    const prev = latest.get(k)
    if (!prev || r.consented_at > prev.consented_at || (r.consented_at === prev.consented_at && r.id > prev.id)) latest.set(k, r)
  }
  // Note: a confirmed row followed by an unconfirmed re-subscribe attempt must stay active:
  // refine in the real implementation (consider last CONFIRMED consent vs last WITHDRAWAL).
  return new Map([...latest].filter(([, r]) => r.consent && r.confirmed_at))
}
```
Planner note: define precisely as "active = exists a confirmed consent=true row whose `consented_at` is later than every consent=false row"; unit-test the interleavings (confirm, withdraw, re-subscribe unconfirmed, re-subscribe confirmed).

### Brevo upsert payload builder (pure, then `fetch`)
```typescript
// Source: developers.brevo.com/reference/createcontact
export function buildUpsertBody(c: { email: string; language: 'fr'|'en'|'de'|'sv'; country: string|null; resident: boolean; source: string; consentAt: string; lastVisit: string|null }, listId: number) {
  return {
    email: c.email,
    updateEnabled: true,
    emailBlacklisted: false,
    listIds: [listId],
    attributes: {
      LANGUAGE: c.language, COUNTRY: c.country ?? '', RESIDENT: c.resident, SOURCE: c.source,
      CONSENT_AT: c.consentAt.slice(0, 10), ...(c.lastVisit ? { LAST_VISIT_DATE: c.lastVisit } : {}),
    },
  }
}
// fetch('https://api.brevo.com/v3/contacts', { method:'POST', headers:{ 'api-key': key, 'content-type':'application/json', accept:'application/json' }, body: JSON.stringify(body) })
```

### Geo header read (route handler)
```typescript
// Source: vercel.com/docs/headers/request-headers (x-vercel-ip-country: ISO 3166-1 alpha-2)
const raw = request.headers.get('x-vercel-ip-country')
const geoCountry = raw && /^[A-Z]{2}$/.test(raw) ? raw : null   // never store the IP
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full-screen newsletter modal | Small banner / bottom sheet | Google intrusive-interstitial guidance | Pop-up must stay a small non-blocking banner |
| Brevo classic automation editor | New editor for accounts that did not use classic since early 2025 | 2025 | Trigger names differ; verify in the owner's account |
| GET unsubscribe/confirm links | POST confirm + RFC 8058 one-click headers | Mailbox-provider bulk sender rules | Add `List-Unsubscribe-Post` on direct emails to subscribers |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Brevo sends webhook bearer token as `Authorization: Bearer <token>` | Pattern 4 | Webhook rejects all calls; fall back to token in URL query |
| A2 | Brevo date attribute accepts `YYYY-MM-DD` via API | Pattern 3 | `LAST_VISIT_DATE` silently dropped; verify with sandbox contact |
| A3 | `POST /v3/contacts/attributes/normal/{name}` creates attributes | Pitfall 2 | Create attributes in Brevo UI instead |
| A4 | Updating `emailBlacklisted:false` + `listIds` re-subscribes a previously unsubscribed contact | Pitfall 7 | Re-subscribers stay blocked; owner must clear manually |
| A5 | Resend supports custom `headers` for `List-Unsubscribe`/`List-Unsubscribe-Post` | Pattern 2 | Skip one-click headers; keep link only |
| A6 | A Brevo account has an "X days after date attribute" automation entry in the owner's editor | Pitfall 4 | Use list-add / `SEQUENCE_STAGE` fallback |
| A7 | Brevo free plan allows the needed automations (not verified) | Pitfall 8 | Owner upgrades plan or sequences are send-manually |
| A8 | `fetch` wrapper preferred over Brevo SDK | Standard Stack | Planner may switch; low risk |
| A9 | Any Brevo unsubscribe/spam event should withdraw consent globally | Pattern 4 | Over-withdrawal (a list-only unsub removes everything); acceptable for PDPA but confirm with owner |
| A10 | A functional localStorage key for pop-up capping needs no consent banner under PDPA/GDPR | Pattern 6 | Legal review; stores no identifier, only an expiry timestamp |

## Open Questions (RESOLVED)

1. **Which Brevo plan and editor does the owner have, and are automations enabled?** — RESOLVED
   - Known: free plan = 300 emails/day; automation scope unconfirmed.
   - Resolution: answered by the owner at the 07-10 Task 2 checkpoint (approval item 2: plan, automations, editor type deciding option A date-attribute trigger vs option B list fallback in docs/newsletter/BREVO-SETUP.md, written in 07-07). Code in 07-04/07-09 supports both options, so nothing upstream blocks on the answer. Automations are built by the owner in 07-11 Task 1.
2. **Sender domain authentication for Brevo (SPF/DKIM/DMARC on geckocabanerestaurant.com)?** — RESOLVED
   - Resolution: 07-10 Task 1 checks whether the domain DNS is on Vercel; approval item 3 asks the owner to authorize the records (added by Claude via Vercel DNS, or by the owner otherwise), coexisting with Resend records; the procedure is in BREVO-SETUP.md (07-07). Executed in 07-10 Task 3 only after approval.
3. **Which date drives `LAST_VISIT_DATE` for `bill_qr` / `wifi` sign-ups?** — RESOLVED
   - Decision taken: the **confirmation date** (`confirmed_at`, Krabi day), per D-06 as implemented in 07-04 (newsletter-segments) and synced by 07-09. The signup/consent date is not used.
   - The owner may revise this at 07-10 approval item 9 (keep confirmation date, or switch to signup date); a switch would be a quick-fix on newsletter-segments.ts.
4. **Consent text version string and `/privacy` update** — RESOLVED
   - Resolution: version string is `newsletter-2026-10-17` (`NEWSLETTER_CONSENT_VERSION` in src/utils/newsletter-schema.ts, 07-01). FR/EN privacy section `privacy.newsletter` (sources, double opt-in, Resend and Brevo as processors, country/geo rule, resident flag, pop-up memory, unsubscribe, PDPA B.E. 2562 and GDPR) written in 07-07 Task 2 and reviewed by the owner in 07-07 Task 3. The existing privacy copy already states "Every newsletter will include an unsubscribe link" [VERIFIED: messages/en.json].
5. **Owner-supplied content** (crab curry recipe, Guide gourmand recommendations and photos, WiFi SSID/password, print layouts) — RESOLVED
   - Resolution: guide, photos and recipe are supplied at the 07-02 Task 2 owner checkpoint (no invented content); print proofs approved at 07-10 item 7; WiFi SSID/password typed by the owner into .env.local at 07-10 Task 2 (never in chat), piped to Vercel in 07-10 Task 3; rotation policy at item 8.
6. **Resend sending limits for the one-shot D-03 mailing** — RESOLVED
   - Resolution: 07-10 Task 1 counts the maximum audience (distinct reservation_form consent emails) and approval item 11 asks the owner to approve, postpone or refuse; the job in 07-09 Task 3 is manual, `?dry=1` first, batched (≤ ~50 per invocation, `maxDuration = 60`, 600 ms pause as in Phase 4); it runs only in 07-11 Task 3 after the live round trip and only if approved.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + npm | build/tests | ✓ | project standard | — |
| Brevo account + API key | NEWS-01/06/07 | ? (owner) | — | Code is buildable and unit-testable without it; live verification blocked |
| Vercel env vars (`BREVO_*`, `NEWSLETTER_SIGNING_SECRET`, `WIFI_*`) | runtime | ✗ (to create, owner approval) | — | Routes fail closed (503/500) when unset |
| Vercel Cron | sync job | ✓ (existing cron) | Hobby: daily only | Sufficient |
| Resend | confirm/welcome mails | ✓ (existing) | ^6.28.1 | — |
| Brevo DNS/sender auth | deliverability | ? (owner) | — | None for real sends |

**Missing dependencies with no fallback:** Brevo account/plan confirmation and sender domain authentication (block live sequences, not code).
**Missing dependencies with fallback:** env vars (fail closed in dev/tests).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 (node env) |
| Config file | `vitest.config.ts` (`tests/**/*.test.ts`, alias `@`) |
| Quick run command | `npx vitest run tests/newsletter-*.test.ts` |
| Full suite command | `npm test` (also runs inside `npm run build`) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NEWS-01 | HMAC sign/verify: tamper, wrong purpose, expiry, length mismatch | unit | `npx vitest run tests/newsletter-links.test.ts` | ❌ Wave 0 |
| NEWS-01 | Subscribe schema (email, locale fr/en/de/sv, consent must be true, source enum) | unit | `npx vitest run tests/newsletter-schema.test.ts` | ❌ Wave 0 |
| NEWS-01 | Confirm/unsubscribe pages have no write on GET; routes use POST + `createAdminClient` + verify | source-scan | `npx vitest run tests/newsletter-wiring.test.ts` | ❌ Wave 0 |
| NEWS-01 | Brevo only called after `confirmed_at` (confirm route order) ; webhook fails closed without token | unit/source-scan | `npx vitest run tests/newsletter-brevo.test.ts` | ❌ Wave 0 |
| NEWS-01 | Migration 015 idempotent, additive, no `using (true)`, no anon grant; sequence 015 | static | `npx vitest run tests/migrations.test.ts` | ✅ (extend) |
| NEWS-02 | Popup storage-cap logic (pure `shouldShowPopup(state, now, path)`), excluded paths | unit | `npx vitest run tests/newsletter-popup.test.ts` | ❌ Wave 0 |
| NEWS-02 | Footer/popup wired; i18n keys parity fr/en | static | `npx vitest run tests/i18n.test.ts tests/i18n-hardcoded.test.ts` | ✅ |
| NEWS-03/04 | `/wifi` & `/newsletter` metadata robots noindex; not in `PUBLISHED_PAGES`; alias routes + middleware set; password only from env (no literal) | source-scan | `npx vitest run tests/newsletter-pages.test.ts tests/middleware-matcher.test.ts tests/no-public-secrets.test.ts` | ❌ Wave 0 / ✅ extend |
| NEWS-05 | Welcome email contains guide URL and escapes HTML; FR/EN, de/sv -> en | unit | `npx vitest run tests/resend-newsletter.test.ts` | ❌ Wave 0 |
| NEWS-06 | Cron: 401 without secret, dry-run counts, claim pattern; `vercel.json` has the path | source-scan/unit | `npx vitest run tests/newsletter-cron.test.ts` | ❌ Wave 0 |
| NEWS-07 | `resolveCountry` (phone > geo only for footer/popup > null), resident rule (+66 or checkbox), `resolveActiveSubscribers` interleavings, `selectSyncUpdates` change detection | unit | `npx vitest run tests/newsletter-segments.test.ts` | ❌ Wave 0 |

Manual-only (justified: external system): Brevo attribute creation, webhook live test (A1), automation behavior and send timing, sender-domain deliverability, one real double-opt-in round trip with a test mailbox, mobile bottom-sheet visual check (Playwright is not set up here).

### Sampling Rate
- **Per task commit:** `npx vitest run tests/newsletter-*.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test && npm run lint && npm run build` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/newsletter-links.test.ts`, `-schema`, `-segments`, `-brevo`, `-wiring`, `-popup`, `-pages`, `-cron`, `resend-newsletter.test.ts`
- [ ] Extend `tests/middleware-matcher.test.ts`, `tests/migrations.test.ts`, `tests/no-public-secrets.test.ts`, `tests/seo-pages.test.ts` (new pages not published)
- Framework install: none needed.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (public) / yes for webhook+cron | Bearer secrets compared in constant time; fail closed when unset |
| V3 Session Management | no | — |
| V4 Access Control | yes | Service-role only DML on ledger; RLS admin-select; no anon policy |
| V5 Input Validation | yes | zod schema (email max 254, locale enum, source enum, ISO country regex); webhook payload validated before use |
| V6 Cryptography | yes | HMAC-SHA256 via `node:crypto`, `timingSafeEqual`, secret in env, never hand-rolled hashing |
| V7/V8 Data protection | yes | Consent timestamp+source+version; raw IP never stored (hashed rate-limit keys); no PII in counters |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged confirm/unsubscribe link | Spoofing/Tampering | HMAC with purpose + id + expiry, constant-time compare |
| Link prefetch side effects | Tampering | POST behind button |
| Email enumeration via subscribe | Info disclosure | Uniform response regardless of existing state |
| Subscription bombing / relay | DoS/Abuse | Hashed IP+email rate limits, honeypot, fill-time, per-email resend suppression |
| Forged Brevo webhook | Spoofing | Bearer token check, fail closed, optional IP allowlist (Brevo publishes ranges) |
| Secret leakage | Info disclosure | `NEXT_PUBLIC_` never used for Brevo/WiFi/signing; extend `no-public-secrets` test |
| HTML injection in emails | Tampering | `escapeHtml`/`stripLineBreaks` on every interpolation |
| Open redirect via `src`/`locale` | Tampering | Whitelist `src` and locale values, build redirect paths from constants |
| Cron endpoint abuse | DoS | `CRON_SECRET` Bearer, fail closed (existing pattern) |

## Project Constraints (from CLAUDE.md)

- All visible strings in `src/app/[locale]/` and components used there via next-intl; keys in both `messages/fr.json` and `messages/en.json` (parity enforced by `tests/i18n.test.ts`; `de`/`sv` pending). Admin stays French/fixed.
- Supabase: `createClient` (server) in Server Components/Route Handlers; `createAdminClient()` (service role) only with a justifying comment; never expose the service role client-side. Migrations numbered sequentially in `supabase/migrations/`, all tables `gecko_`-prefixed (shared project), idempotent, never apply `supabase/legacy/`.
- Tailwind v4 syntax: `bg-(--var)`, theme tokens (`bg-gc-jungle`, `text-gc-ivory`, ...) from `globals.css`.
- Components using hooks/events start with `'use client'`; Server Components preferred for initial data; no business logic in UI components.
- API routes: validate all inputs, return `{ error: string }` with proper HTTP codes, never stack traces, type with `ApiResponse<T>`; `try/catch` with `Sentry.captureException`.
- Style: 2 spaces, single quotes, no semicolons, trailing commas; no new trailing whitespace.
- Tests run before build (`npm run build` = `vitest run && next build`).
- Constraints from PROJECT.md: P1 live before 1 Nov 2026; PDPA B.E. 2562 + GDPR (explicit consent, double opt-in, unsubscribe link, timestamped consent with source); Resend transactional / Brevo newsletter; max 1 email/month outside sequences; any publish/send to third parties requires owner approval; no unverifiable claims in schema; DE/SV copy human-reviewed.
- GSD workflow: repo edits go through a GSD command. No project skills directory found.

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/migrations/008, 010, 011, 014`, `src/app/api/cron/review-invitations/route.ts`, `src/utils/resend.ts`, `src/utils/rate-limit.ts`, `src/utils/anti-bot.ts`, `src/utils/review-links.ts`, `src/utils/review-alias.ts`, `src/middleware.ts`, `src/utils/seo.ts`, `src/app/[locale]/review/page.tsx`, `src/components/SiteFooter.tsx`, `src/app/[locale]/layout.tsx`, `vercel.json`, `vitest.config.ts`
- https://developers.brevo.com/reference/createcontact (create contact fields, `updateEnabled`, attributes must pre-exist)
- https://developers.brevo.com/reference/updatecontact (PUT by email, attributes/listIds/unlinkListIds/emailBlacklisted, 204/404)
- https://developers.brevo.com/docs/api-limits (contacts: 10 rps, 36,000 rph)
- https://developers.brevo.com/reference/createwebhook (marketing events enum, auth, headers)
- https://developers.brevo.com/docs/marketing-webhooks (unsubscribe payload)
- https://vercel.com/docs/cron-jobs/usage-and-pricing (Hobby: daily, ±59 min, 100 crons)
- https://vercel.com/docs/headers/request-headers (`x-vercel-ip-country`, signature compare pattern)
- https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials

### Secondary (MEDIUM confidence)
- https://developers.brevo.com/docs/secured-webhooks (bearer `auth` object; header name not stated)
- https://help.brevo.com/hc/en-us/articles/115001468849 and https://help.brevo.com/hc/en-us/articles/360020994839 (classic editor contact-attribute / date entry, via search summary)
- https://help.brevo.com/hc/en-us/articles/208580669 (free plan limits, via search summary)

### Tertiary (LOW confidence)
- https://community.brevo.com/t/problem-or-bug-with-trigger-date-in-an-attribute-occurs/2838 (date trigger behavior changes)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, no new packages; all reuse verified in repo.
- Architecture: HIGH for Supabase/Next/Vercel parts; MEDIUM for Brevo automation and webhook auth specifics.
- Pitfalls: HIGH for prefetch, geo, alias, grants; MEDIUM for Brevo re-subscribe and free-plan automation.

**Research date:** 2026-10-17
**Valid until:** 2026-11-01 for Brevo specifics (re-check before building automations); 30 days for the rest.
