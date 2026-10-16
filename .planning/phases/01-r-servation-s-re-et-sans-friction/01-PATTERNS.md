# Phase 1: Réservation sûre et sans friction - Pattern Map

**Mapped:** 2026-10-16
**Files analyzed:** 33 (new/modified/deleted)
**Analogs found:** 27 / 33 (6 sans analogue : SQL RPC, rate-limit, bouton flottant, tests de handler, tests de scan source, migration baseline)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/api/reservations/route.ts` (POST rewrite, GET/PUT/DELETE guard) | controller (route handler) | request-response | lui-même (`route.ts` actuel) + `src/app/api/settings/route.ts` | exact (self) |
| `src/utils/auth.ts` (`requireAdmin`) | utility/middleware | request-response | `src/utils/supabase/server.ts` `isGeckoAdmin` (l.51-64) + bloc `getUser()` de `settings/route.ts` l.25-27 | role-match |
| `src/utils/rate-limit.ts` (`getClientIp`, `hashKey`, `checkRateLimit`) | utility | request-response + RPC | `src/utils/supabase/server.ts` `isGeckoAdmin` (appel `rpc`) | partial |
| `src/utils/reservation-rules.ts` (fonctions pures horaires/capacité) | utility | transform | `src/utils/validation.ts` (pur, sans dépendance) | exact |
| `src/utils/validation.ts` (réécriture phone, zod, max 40) | utility | transform | lui-même | exact (self) |
| `src/utils/html.ts` (`escapeHtml`) + `src/utils/resend.ts` (application) | utility | transform | `src/utils/resend.ts` | exact (self) |
| `src/app/api/{hours,special-hours,settings,announcement}/route.ts` (garde admin) | controller | CRUD | `src/app/api/special-hours/route.ts` | exact |
| `src/app/api/menu/{categories,items,pages,reorder,upload}/route.ts` (garde admin) | controller | CRUD | `src/app/api/special-hours/route.ts` | exact |
| `src/app/api/tables/**/route.ts` (5 fichiers, garde admin) | controller | CRUD | `src/app/api/special-hours/route.ts` | exact |
| `src/app/api/verify/{send,check}/route.ts` | controller | request-response | SUPPRIMER (D-02) | n/a |
| `src/app/api/mcp/route.ts` (Pitfall 10, optionnel) | controller | request-response | lui-même (tables non préfixées l.39/91/135/172) | self |
| `src/components/ReservationForm.tsx` (OTP retiré, email requis, consentement, honeypot) | component (client) | request-response | lui-même | exact (self) |
| `src/components/WhatsAppButton.tsx` | component (client) | event-driven (IntersectionObserver) | `src/components/LanguageSwitcher.tsx` / `AnnouncementBanner.tsx` (client + useTranslations) | partial |
| `src/app/[locale]/layout.tsx` (+ `<WhatsAppButton />`) | layout | request-response | lui-même | exact (self) |
| `src/app/[locale]/privacy/page.tsx` | page (RSC) | request-response | `src/app/[locale]/page.tsx` + `not-found.tsx` (getTranslations) | role-match |
| `src/app/globals.css` (`--gc-whatsapp*`) | config | n/a | `globals.css` `:root` l.5-10 + `@theme inline` l.40-46 | exact (self) |
| `messages/fr.json`, `messages/en.json` | config | n/a | bloc `reservationForm` (fr.json l.74-116) | exact |
| `supabase/migrations/007_gecko_baseline.sql` | migration | batch | `004_reservations.sql` (structure uniquement, NE PAS copier les policies) | partial/anti-analog |
| `supabase/migrations/008_rate_limits_consents_and_rpc.sql` | migration | CRUD/atomic | `004_reservations.sql` (trigger/index style) + `006_phone_verifications.sql` (RLS sans policy) | role-match |
| `supabase/migrations/009_drop_phone_verifications.sql` | migration | batch | `006_phone_verifications.sql` (inverse) | role-match |
| `vitest.config.ts` (alias `@`) | config | n/a | lui-même | exact (self) |
| `tests/reservation-rules.test.ts` | test | transform | `tests/api-validation.test.ts` | exact |
| `tests/api-validation.test.ts` (retirer `isOtpCode`, adapter 40/phone) | test | transform | lui-même | exact (self) |
| `tests/rate-limit.test.ts`, `tests/whatsapp.test.ts`, `tests/resend-escape.test.ts` | test | transform | `tests/api-validation.test.ts` | exact |
| `tests/require-admin.test.ts`, `tests/reservations-post.test.ts`, `tests/reservations-get.test.ts` | test | request-response (mocks) | aucun handler test existant (squelette `vi.mock` dans RESEARCH) | none |
| `tests/admin-routes-guarded.test.ts`, `tests/migrations.test.ts`, `tests/deps.test.ts`, `tests/no-public-secrets.test.ts` | test | file-I/O (scan source) | `tests/i18n.test.ts` (readFileSync + join(process.cwd())) | role-match |
| `package.json` (+zod, -twilio) | config | n/a | n/a | n/a |

## Pattern Assignments

### `src/app/api/reservations/route.ts` (controller, request-response) - POST pipeline

**Analog:** lui-même (structure `try/catch`, noms de colonnes, emails) ; garde admin copiée de `requireAdmin` (voir Shared).

**Imports pattern actuel** (l.1-11) : conserver le style, remplacer `validateReservationFields/isPartySizeValid/isReservationDateValid` par le schéma zod + règles.
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { validateReservationFields, isPartySizeValid, isReservationDateValid } from '@/utils/validation'
import {
  getResendClient, RESEND_FROM_EMAIL, RESTAURANT_NOTIFICATION_EMAIL,
  customerPendingEmail, restaurantNotificationEmail, customerStatusEmail,
} from '@/utils/resend'
```
Ajouter : `import { after } from 'next/server'` (fusionner avec la ligne 1), `import * as Sentry from '@sentry/nextjs'`.

**Squelette try/catch + erreurs génériques** (l.83-87, 250-253) :
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    ...
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Reservation error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
```
Changement : `request.json()` invalide -> 400 ; `console.error` -> `Sentry.captureException`.

**A SUPPRIMER** : l.96 `phone_verification_token`, l.105-145 (bloc vérification + consommation du jeton), l.147-152 (`isPartySizeValid` "1 et 50"), l.161-164 (commentaire OTP "real gate").

**Insertion service-role avec commentaire justificatif** (l.161-183) : même convention, mais remplacer par `adminSupabase.rpc('gecko_create_reservation', {...})`, et garder le commentaire justifiant le service-role (RLS bloque l'INSERT public) :
```typescript
const { data, error } = await adminSupabase
  .from('gecko_reservations')
  .insert({ customer_name, customer_email: customer_email || null, customer_phone,
            reservation_date, reservation_time, party_size, occasion: occasion || null, status: 'pending' })
  .select().single()
if (error) {
  console.error('Reservation error:', error)
  return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
}
```
Réponse finale : `{ data: { id, status: 'pending' } }` (ne plus renvoyer `select()` complet).

**Webhook + emails** (l.185-246) a déplacer dans `after(async () => {...})`. Reprendre tel quel la structure `sends: Promise<unknown>[]` + `Promise.allSettled` (l.226-245). Lecture env : `process.env.RESA_HOOK_URL ?? process.env.NEXT_PUBLIC_RESA_HOOK_URL` (SEC-05, double lecture temporaire). Ajouter `signal: AbortSignal.timeout(5000)` au `fetch`.

**GET** (l.14-80) : supprimer toute la branche `if (phone) {...}` (l.18, 24-41) et remplacer l.43-47 par `requireAdmin()`. Garder le builder de requête filtres l.49-71 tel quel.

**PUT** (l.257-353) : remplacer garde l.260-264 par `requireAdmin()` ; remplacer `const { id, ...updates } = body` (l.268) par liste blanche explicite (`status` enum `pending|confirmed|cancelled|completed|no_show`, `admin_notes`) ; webhook l.295 -> `RESA_VALIDATION_HOOK_URL ?? NEXT_PUBLIC_...` ; `error.message` (l.290) -> message générique. **DELETE** (l.356-382) : garde idem.

---

### `src/utils/auth.ts` (utility, request-response) - `requireAdmin()`

**Analog:** `src/utils/supabase/server.ts` `isGeckoAdmin` (l.51-64) + garde actuelle de `settings/route.ts` (l.25-27).

**Garde actuelle à remplacer (settings l.25-27, copiée dans 15 fichiers)** :
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```
**Helper existant à réutiliser** (server.ts l.58-64) :
```typescript
export async function isGeckoAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data, error } = await supabase.rpc('gecko_is_admin')
  if (error) return false
  return data === true
}
```
Cible : voir RESEARCH Pattern 3 (retourne `{ ok:false, response }` ou `{ ok:true, supabase, user }`). Utilisation dans handler : `const auth = await requireAdmin(); if (!auth.ok) return auth.response` puis utiliser `auth.supabase`. Messages anglais `'Unauthorized'`/`'Forbidden'` (convention des routes hors reservations ; `reservations/route.ts` utilise `'Non autorisé'` : unifier).

---

### Routes admin à garder (hours, special-hours, settings, announcement, menu/*, tables/*) (controller, CRUD)

**Analog:** `src/app/api/special-hours/route.ts` - GET public sans garde (l.4-21), mutations avec `try/catch` + garde inline (l.23-62).

**Pattern de remplacement** (ex. `special-hours` POST l.25-31) :
```typescript
// AVANT
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
// APRES
const auth = await requireAdmin()
if (!auth.ok) return auth.response
const { supabase } = auth
```
Garder `catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }` (l.59-61). GET restent publics. Fichiers (28 occurrences, 15 fichiers, compte vérifié) : `announcement`(1), `hours`(1), `special-hours`(2), `reservations`(3), `settings`(1), `tables`(1), `tables/[id]`(2), `tables/assignments`(2), `tables/configurations`(1), `tables/configurations/[id]`(2), `menu/categories`(3), `menu/items`(3), `menu/pages`(3), `menu/reorder`(1), `menu/upload`(2). Les `error.message` renvoyés (ex. special-hours l.12, 55, 87) peuvent passer en message générique si le fichier est touché.

---

### `src/utils/validation.ts` (utility, transform)

**Analog:** lui-même. Conserver le style : bannières `// ----`, JSDoc par fonction, fonctions pures sans framework (header l.1-3).

**À réécrire** : `normalizePhone` (l.10-16, regex mobile thaï `0[6-9]`) et `isE164Phone` (l.19-21, regex `^\+\d{8,15}$`) -> déléguer à `libphonenumber-js/min` `parsePhoneNumberFromString(raw, country)` (déjà importé côté client dans `ReservationForm.tsx` l.5 : `import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js/min'`).
**À modifier** : `isPartySizeValid` l.37-40 : `size <= 50` -> `<= 40` (`MAX_PARTY_SIZE`). `isReservationDateValid` l.46-51 : remplacer `new Date()` par `bangkokNow()` (Pitfall 4). `validateReservationFields` l.28-34 (retourne `string | null`, message FR) : ajouter `customer_email` obligatoire, conserver la signature `string | null`.
**À supprimer** : `isOtpCode` (l.53-56) ET son bloc dans `tests/api-validation.test.ts` l.175-200 + l'import l.15.

---

### `src/utils/reservation-rules.ts` (utility, transform) - nouveau

**Analog:** `src/utils/validation.ts` (pur, testable). Contenu : voir RESEARCH "Règles de créneau" (`bangkokNow`, `dayOfWeek`, `toMinutes`, `resolveHours`, `isTimeWithinHours`, `MAX_PARTY_SIZE`, `TIME_SLOTS` partagée). Calcul de date : réutiliser l'astuce UTC de `src/utils/resend.ts` l.24-27 :
```typescript
const [year, month, day] = dateStr.split('-').map(Number)
const d = new Date(Date.UTC(year, month - 1, day))
// d.getUTCDay() pour éviter le décalage de fuseau
```
Tables lues par le handler : `gecko_opening_hours`, `gecko_special_hours` (noms préfixés, cf. `special-hours/route.ts` l.9). `special_hours` l'emporte, `date` UNIQUE (`onConflict: 'date'`, special-hours l.50).

---

### `src/utils/rate-limit.ts` (utility, request-response + RPC)

**Analog partiel:** appel `rpc` de `isGeckoAdmin` (server.ts l.61) ; client service-role `createAdminClient()` (server.ts l.43-49) :
```typescript
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } })
}
```
Reste : RESEARCH Patterns 1 et 4 (`getClientIp`, HMAC `createHmac('sha256', process.env.RATE_LIMIT_SECRET!)`, `rpc('gecko_rate_limit_hit', {p_key, p_limit, p_window_seconds})`). Pas d'analogue de rate-limit dans le dépôt. Ajouter un commentaire justifiant le service-role (convention CLAUDE.md). Mettre à jour le JSDoc de `createAdminClient` (server.ts l.39-42 cite "OTP verification", devenu faux).

---

### `src/utils/resend.ts` + `src/utils/html.ts` (utility, transform)

**Analog:** `resend.ts` lui-même. Points d'interpolation non échappés à passer par `escapeHtml` : `detailsTable` l.91 `${value}` (et `occasion` l.83), titre l.100 `${r.customer_name}`, l.121 `${r.customer_name}`, l.125 `${r.customer_phone}`, l.131 `${r.customer_email}`, intro l.144-145 `${r.customer_name}`. Sujet l.137 `(${r.customer_name})` : retirer retours ligne. Pitfall 9 : emails FR uniquement (`<html lang="fr">` l.43) ; si locale ajoutée, dupliquer gabarits en suivant la forme `{ subject, html }` des trois fonctions (l.98-156).

---

### `src/components/ReservationForm.tsx` (component, request-response)

**Analog:** lui-même ; reste `'use client'` + `useTranslations('reservationForm')` (l.1-4, 62).

**Imports** : ajouter `useLocale` (next-intl) et `Link` de `@/i18n/navigation` ; conserver `libphonenumber-js/min` (l.5-6).

**Suppressions** : type `PhoneVerifState` (l.8), états OTP (l.82-88), `resetVerification` (l.125-130), `sendOtp`/`checkOtp` (l.142-193), garde `otpRequired` dans `handleSubmit` (l.197-200), `sendDisabled` (l.240-244), bouton envoi/vérifié (l.339-361), bloc OTP (l.369-408), `disabled={phoneVerifState==='verified'}` (l.309, 332), `disabled` du submit lié à la vérification (l.523), note `otpRequired` (l.536-540).

**À conserver tel quel (réutilisable)** : `COUNTRIES` (l.18-49), classes `inputClass`/`selectClass`/`primaryButtonClass` (l.52-59), `fullPhone`/`phoneIsValid` useMemo (l.105-123), classe conditionnelle de soulignement du téléphone (l.334-337 : `border-gc-copper` / `border-gc-jungle`), bloc succès (l.253-271), bannière erreur (l.274-278), labels (`font-raleway font-medium text-[11px] tracking-[0.2em] uppercase`).

**Changements** :
- Pré-sélection pays : `useState<CountryCode>('TH')` (l.83) -> dérivé de `useLocale()` (`fr`->FR, `en`->GB, repli TH) ; idem reset l.228.
- Email (l.411-425) : ajouter `required`, `inputMode="email"`, `aria-invalid`/`aria-describedby`, hint `emailInvalid` au blur.
- Party size : `Math.min(20, ...)` (l.488) -> 40 ; boutons `w-9 h-9` -> `w-11 h-11` ; `aria-label="-1"`/`"+1"` (l.478, 489) -> `t('partySizeDecrease')`/`t('partySizeIncrease')`.
- Erreurs littérales (l.231 `'Une erreur est survenue'`, l.234 `'Erreur de connexion...'`) -> clés i18n ; mapper HTTP 429 -> `rateLimited` + lien WhatsApp.
- Corps POST (l.208-212) : `{ ...form, customer_phone: fullPhone, locale, marketing_consent, website, rendered_at }`, plus de `phone_verification_token`.
- Ajouter id `reservation-submit` au bouton (l.521-534, pour l'IntersectionObserver).
- Honeypot, checkbox consentement : pas d'analogue ; suivre UI-SPEC section ReservationForm. Format du lien intra-locale : `Link` de `src/i18n/navigation.ts` (l.4 `export const { Link, redirect, usePathname, useRouter } = createNavigation(...)`).
- `today` (l.100, `toISOString()` UTC) -> date Bangkok (Pitfall 4).

---

### `src/components/WhatsAppButton.tsx` (component, event-driven)

**Analog:** composants clients existants `LanguageSwitcher.tsx` / `AnnouncementBanner.tsx` (`'use client'` + `useTranslations`) pour la forme ; aucun analogue de bouton flottant ni d'IntersectionObserver. Suivre UI-SPEC section 2 et RESEARCH Pattern 7. Utiliser tokens `bg-gc-whatsapp hover:bg-gc-whatsapp-dark` (à créer dans globals.css) ; SVG inline (pas d'icône lib). Clés `whatsapp.ariaLabel`, `whatsapp.label`, `whatsapp.prefill`. Construire l'URL via une fonction pure exportée `buildWhatsAppUrl(number, msg)` (testable, `tests/whatsapp.test.ts`). Repli constant `66819585945` si `NEXT_PUBLIC_WHATSAPP_NUMBER` absent (RESEARCH ; UI-SPEC dit "ne rien rendre" : arbitrage planificateur, RESEARCH recommande le repli).

---

### `src/app/[locale]/layout.tsx` (layout) - montage

**Analog:** lui-même (l.22-26) :
```typescript
return (
  <NextIntlClientProvider messages={messages}>
    {children}
  </NextIntlClientProvider>
)
```
Ajouter `<WhatsAppButton />` après `{children}` dans le provider ; import `@/components/WhatsAppButton`. Le layout valide déjà la locale (l.15-17).

---

### `src/app/[locale]/privacy/page.tsx` (page RSC, request-response)

**Analog:** `src/app/[locale]/page.tsx` (l.2, 10-11, 14) - Server Component `async` avec `getTranslations` :
```typescript
import { getTranslations } from 'next-intl/server'
export default async function Home() {
  const t = await getTranslations()
  return (<div className="min-h-screen bg-gc-void font-cormorant"> ...
```
Namespace ciblé comme `not-found.tsx` l.1,5 : `await getTranslations('privacy')`. Liens localisés : `Link` de `@/i18n/navigation` (le `not-found.tsx` utilise `next/link`, ne pas copier). Coins dorés : copier de `ReservationForm.tsx` l.248-250 (`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold`). Ne PAS copier les classes legacy de `not-found.tsx` (`bg-background`, `text-primary-dark`, `font-(family-name:--font-playfair)`) : UI-SPEC interdit les tokens legacy en public. Metadata : un seul `export const metadata` existe (`src/app/layout.tsx` l.35) ; aucun `generateMetadata` dans le dépôt -> pattern next-intl standard (`generateMetadata({ params })` + `getTranslations({ locale, namespace: 'privacy' })`).

---

### `src/app/globals.css` (config)

**Analog:** lui-même. Déclarer dans `:root` (près de l.5-10 `--gc-void`, `--gc-gold`, `--gc-copper`) `--gc-whatsapp: #128C7E; --gc-whatsapp-dark: #0B6B5F;` et dans `@theme inline` (l.40-46, forme `--color-gc-copper: var(--gc-copper);`) `--color-gc-whatsapp: var(--gc-whatsapp);` etc.

---

### `messages/fr.json` / `messages/en.json` (config)

**Analog:** bloc `reservationForm` (fr.json l.74-116). Supprimer les clés `otp*` (l.104-116 : `otpSend`, `otpResend`, `otpVerify`, `otpVerified`, `otpSentTo`, `otpExpiry`, `otpFormat`, `otpInvalidPhone`, `otpSendError`, `otpCheckError`, `otpRequired`, `otpChange`) dans les DEUX fichiers. Ajouter les clés de UI-SPEC (Copywriting Contract) : `emailInvalid`, `phoneInvalid`, `marketingConsent`, `privacyNote`, `genericError`, `networkError`, `rateLimited`, `rateLimitedWhatsapp`, `slotUnavailable`, `slotFull`, `partySizeDecrease`, `partySizeIncrease`; nouveaux namespaces `whatsapp.*`, `privacy.*`. `tests/i18n.test.ts` impose symétrie des clés et valeurs non vides. `marketingConsent` contient un lien : prévoir `t.rich`. Les tableaux `OCCASIONS` (ReservationForm l.64-71) stockent des valeurs FR en base (ne pas toucher).

---

### `supabase/migrations/008_*.sql` (migration)

**Analog:** `006_phone_verifications.sql` pour "table sans policy publique, service-role seul" (l.18-19) :
```sql
-- No public read/write: service role key only
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
```
et `004_reservations.sql` pour style (index `CREATE INDEX IF NOT EXISTS` l.30-33, fonction + trigger `DROP TRIGGER IF EXISTS` / `CREATE TRIGGER` l.50-64). **ANTI-ANALOGUE** : `004` l.39-48 (`FOR INSERT WITH CHECK (true)`, `FOR SELECT USING (true)`, `FOR ALL USING (auth.role()='authenticated')`) ne doit jamais être copié. Tables 008 : préfixe `gecko_` obligatoire (`gecko_rate_limits`, `gecko_marketing_consents`), SQL de RESEARCH Patterns 1-2. Numérotation séquentielle 007/008/009. 009 = inverse de 006 : `DROP TABLE IF EXISTS gecko_phone_verifications;` appliquée APRES déploiement.

### `supabase/migrations/007_gecko_baseline.sql`

Aucun analogue fiable (001-006 non préfixées, désynchronisées). Source réelle = dump via `pg_dump`/catalogues (RESEARCH procédure SEC-04). Colonnes de `reservations` connues de 004 l.2-27 comme point de départ ; l'id est `SERIAL` dans 004 mais à confirmer par le dump (la RPC de RESEARCH suppose `bigint`).

---

### `tests/*` (test)

**Analog pur:** `tests/api-validation.test.ts` - en-tête JSDoc, `import { describe, it, expect } from 'vitest'`, imports relatifs `'../src/utils/validation'` (l.8-16), `describe` par fonction, bannières `// ----`. Copier pour `reservation-rules`, `rate-limit` (fonctions pures), `whatsapp`, `resend-escape`.

**Analog scan source:** `tests/i18n.test.ts` l.11-13,40-43 :
```typescript
import { readFileSync } from 'fs'
import { join } from 'path'
const root = join(process.cwd(), 'messages')
const fr: unknown = JSON.parse(readFileSync(join(root, 'fr.json'), 'utf-8'))
```
Réutiliser `readFileSync(join(process.cwd(), ...))` pour `admin-routes-guarded`, `migrations`, `deps`, `no-public-secrets`. Messages d'échec explicites avec `expect(arr, message).toHaveLength(0)` (l.54-60).

**Tests de handler (`reservations-post`, `reservations-get`, `require-admin`)** : aucun précédent. `vitest.config.ts` (l.3-7, pas d'alias) doit gagner `resolve.alias: { '@': path.resolve(__dirname, 'src') }` ; mocker `@/utils/supabase/server` et `next/server` (`after`) selon RESEARCH. Temps figé via `vi.setSystemTime`.

## Shared Patterns

### Erreurs de route handler
**Source:** `src/app/api/settings/route.ts` l.4-17 et `special-hours/route.ts` l.4-21
**Apply to:** tous les handlers touchés
```typescript
try {
  ...
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }) // -> message générique + Sentry
  return NextResponse.json({ data })
} catch {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```
Règle phase : ne plus renvoyer `error.message` Supabase (V8).

### Authentification admin
**Source:** `src/utils/supabase/server.ts` l.58-64 (`isGeckoAdmin`) -> encapsulé dans `src/utils/auth.ts requireAdmin()`.
**Apply to:** reservations GET/PUT/DELETE, mutations hours, special-hours, settings, announcement, menu/*, tables/*, et `tables/assignments` GET s'il lit `gecko_reservations` (PII).

### Service-role avec justification
**Source:** `reservations/route.ts` l.24-27 et l.161-164 (commentaire expliquant pourquoi `createAdminClient()` plutôt que l'anon). Reproduire un commentaire équivalent pour chaque usage nouveau (rate-limit RPC, `gecko_create_reservation`).

### Noms de tables et colonnes
Tables `gecko_*` ; colonnes snake_case utilisées telles quelles (`customer_phone`, `reservation_date`, `party_size`, `admin_notes`, `confirmed_at`, `cancelled_at`). Statuts : `pending|confirmed|cancelled|completed|no_show` (004 l.19).

### i18n
**Source:** `ReservationForm.tsx` l.62 (`useTranslations('reservationForm')`), `page.tsx` l.11 (`getTranslations()`). Toute chaîne visible de `src/app/[locale]/` via clés fr+en ; admin non traduit.

### Style de code
2 espaces, guillemets simples, sans point-virgule, virgules finales ; Tailwind v4 `bg-(--var)` ; tokens `gc-*` seulement en public.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `gecko_rate_limit_hit` / `gecko_create_reservation` (SQL dans 008) | DB function | atomic write | Aucune fonction applicative SQL existante hormis `gecko_is_admin` (hors dépôt) et le trigger de 004 l.50-64 |
| `src/utils/rate-limit.ts` | utility | request-response | Aucun rate limit dans le dépôt (CONCERNS) ; utiliser RESEARCH Patterns 1 et 4 |
| `src/components/WhatsAppButton.tsx` | component | event-driven | Aucun élément fixe/IntersectionObserver existant ; UI-SPEC fait foi |
| Tests de handler (`reservations-post`, `reservations-get`, `require-admin`) | test | request-response | Aucun test de route existant, aucun mock vitest ; alias `@` à ajouter |
| `007_gecko_baseline.sql` | migration | batch | Dépôt désynchronisé ; nécessite dump de la base réelle (checkpoint humain) |
| Honeypot + délai minimum | component/controller | request-response | Nouveau ; RESEARCH Pitfall 7 + schéma zod (`company_url`, `rendered_at`). Note : UI-SPEC nomme le champ `website`/`form_started_at`, RESEARCH `company_url`/`rendered_at` : le planificateur doit trancher un seul nom |

## Metadata

**Analog search scope:** `src/app/api/**`, `src/app/[locale]/**`, `src/components`, `src/utils`, `src/i18n`, `supabase/migrations`, `tests`, `messages`, `vitest.config.ts`, `src/app/globals.css`
**Files scanned/read:** ~20 (lectures complètes de reservations/route, validation, server.ts, resend, ReservationForm, layout, settings/route, special-hours/route, not-found, tests, 004, 006 ; greps ciblés ailleurs)
**Pattern extraction date:** 2026-10-16
