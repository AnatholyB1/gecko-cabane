# Phase 1: Réservation sûre et sans friction - Research

**Researched:** 2026-10-16
**Domain:** Next.js 16 App Router route hardening, Supabase (PostgreSQL/RLS/RPC) rate limiting + capacity, libphonenumber-js, i18n form UX, PDPA/RGPD consent
**Confidence:** HIGH on code-derived findings (read from repo), MEDIUM on live-DB facts (not inspectable from here), MEDIUM on legal wording

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Confirmation sans SMS (RESA-01, RESA-03)**
- **D-01:** Le SMS est **supprimé du parcours public**. Le formulaire n'a plus d'étape de vérification téléphonique et `POST /api/reservations` n'exige plus `phone_verification_token`.
- **D-02:** Les routes `/api/verify/send` et `/api/verify/check`, la table `gecko_phone_verifications` (retrait par migration) et la dépendance `twilio` sont **supprimées**. Conséquence : SEC-02 ne porte plus que sur la création de réservation (plus d'endpoint SMS à limiter).
- **D-03:** Après envoi, la réservation reste `pending` et le client reçoit l'email « demande reçue » existant (`customerPendingEmail`) ; l'email de confirmation part quand l'admin confirme (comportement actuel de `PUT`). Pas de confirmation automatique.
- **D-04:** Validation serveur complète du créneau : `party_size` plafonné à **40**, refus des jours fermés (mardi) et des heures hors `opening_hours`/`special_hours`, et **capacité par créneau** (somme des couverts déjà réservés sur le créneau ≤ 40). *Note : va au-delà du texte des exigences (cf. CONCERNS « capacity not enforced ») ; décision explicite de l'utilisateur.*
- **D-05:** Téléphone : sélecteur d'indicatif pays (pré-sélectionné selon la locale) + normalisation/validation E.164 côté serveur avec `libphonenumber-js` (`normalizePhone`, `isE164Phone` dans `src/utils/validation.ts`). Le téléphone reste obligatoire, il ne sert plus qu'à joindre le client. Corrige le bug de normalisation de CONCERNS.
- **D-06:** L'email est **obligatoire** (RESA-02) ; validation de format côté client et serveur.

**Anti-abus (SEC-02)**
- **D-07:** Compteurs de limitation stockés dans une **table Supabase** (`gecko_rate_limits` + fonction SQL atomique), versionnée dans les migrations. Pas d'Upstash ni de règle Vercel Firewall seule.
- **D-08:** Seuils sur `POST /api/reservations` : **5 / heure par IP**, **3 / jour par email** et **3 / jour par téléphone**. Dépassement → HTTP 429 `{ error }` avec message FR/EN clair invitant à utiliser WhatsApp.
- **D-09:** Anti-bot : **honeypot + délai minimum de remplissage** vérifié côté serveur. Pas de CAPTCHA (Turnstile pourra s'ajouter si un abus apparaît).
- **D-10:** Le jeton de confirmation doit être consommé/validé de façon atomique là où il subsiste ; plus applicable puisque l'OTP disparaît — ne pas recréer l'ancien mécanisme.

**Consentement et fin du lookup (RESA-02, SEC-01)**
- **D-11:** Consentement newsletter dans une **table dédiée `gecko_marketing_consents`** : email, consent (bool), langue, source (`reservation_form`), `consented_at`, version du texte de consentement. Réutilisable par la phase 7 (Brevo).
- **D-12:** La case « Recevoir nos actualités et offres » est **non pré-cochée**, avec lien vers la politique de confidentialité. Le **double opt-in** est reporté à la phase 7 (NEWS-01) ; la phase 1 enregistre seulement le consentement brut.
- **D-13:** Création d'une page **`/privacy`** minimale FR/EN (données collectées, finalité, PDPA B.E. 2562 / RGPD, contact, désinscription). Texte rédigé par Claude, **à valider par le propriétaire avant mise en ligne**.
- **D-14:** `GET /api/reservations?phone=` est **supprimé** (aucun appelant front). Le `GET` devient admin-only avec vérification gecko-admin. Pas de lien de gestion client.

**Bouton WhatsApp flottant (RESA-04)**
- **D-15:** Numéro **+66 81 958 5945** (`wa.me/66819585945`), en variable d'environnement publique, avec **message pré-rempli par langue** via next-intl (fr/en). À confirmer que ce numéro est bien actif sur WhatsApp.
- **D-16:** Bouton rond 56 px **en bas à droite**, label au survol sur desktop, `aria-label` i18n, vert WhatsApp standard. Monté dans `src/app/[locale]/layout.tsx` (toutes les pages publiques, jamais l'admin), avec marge de sécurité pour ne pas masquer le bouton de soumission sur mobile.

### Claude's Discretion
- **SEC-03** : helper partagé `requireAdmin()` s'appuyant sur `isGeckoAdmin` appliqué à toutes les routes API mutantes/admin (reservations GET/PUT/DELETE, menu, hours, tables, settings, announcement, upload).
- **SEC-04** : migrations 007+ reproduisant le schéma réel `gecko_*` (tables, RLS, `gecko_admins`, `gecko_is_admin()`) ; nécessite l'accès à la base réelle (dump) ; mise à jour de `CLAUDE.md` et `src/types/database.ts`.
- **SEC-05** : renommer `NEXT_PUBLIC_RESA_HOOK_URL` / `NEXT_PUBLIC_RESA_VALIDATION_HOOK_URL` en variables serveur ; la rotation des URLs et la mise à jour des variables Vercel exigent l'accord du propriétaire.
- **SEC-06** : déclarer `zod` dans `package.json`.
- Durcissements voisins issus de CONCERNS (liste blanche des champs du `PUT`, `escapeHtml` dans les emails, erreurs génériques) : à intégrer au plan si elles touchent les fichiers modifiés.

### Deferred Ideas (OUT OF SCOPE)
- Lien de gestion/annulation signé dans l'email — nouvelle capacité, hors phase 1.
- Double opt-in par email — phase 7 (NEWS-01).
- Cloudflare Turnstile — à ajouter seulement si un abus apparaît.
- Mesure « réservation envoyée » / « clic WhatsApp » et champ source — phase 5 (RESA-06, KPI-01).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Plus de PII via `GET /api/reservations?phone=` | Supprimer la branche `phone` (route.ts l.24-41) ; GET admin-only via `requireAdmin()` ; test de route qui prouve 401/403 |
| SEC-02 | Rate limit par IP et par email/téléphone | Table `gecko_rate_limits` + RPC `gecko_rate_limit_hit` (INSERT ... ON CONFLICT atomique), IP via `x-vercel-forwarded-for`/`x-real-ip`, hachage HMAC des clés |
| SEC-03 | Routes admin refusent un non-admin Gecko | `requireAdmin()` (getUser + `gecko_is_admin` RPC) ; inventaire de 15 fichiers route avec `getUser()` seul |
| SEC-04 | Migrations reproduisent le schéma réel | pg_dump/requêtes catalogue via `POSTGRES_URL_NON_POOLING` (pas de Docker disponible) ; baseline idempotente 007 ; neutraliser 001-006 |
| SEC-05 | Webhooks non exposés | Renommer en `RESA_HOOK_URL`/`RESA_VALIDATION_HOOK_URL` ; période de double lecture ; rotation = accord propriétaire |
| SEC-06 | `zod` déclaré | `npm install zod@^4` (4.3.6 déjà en lockfile) ; seul import transitif détecté dans `src/` |
| RESA-01 | SMS facultatif -> supprimé | Retirer OTP du formulaire, routes verify, table, `twilio`, `isOtpCode`, clés i18n `otp*` |
| RESA-02 | Email obligatoire + case newsletter horodatée | Zod + HTML `required`, table `gecko_marketing_consents`, RPC transactionnelle, page `/privacy` |
| RESA-03 | Réservation < 60 s avec numéro étranger | Pré-sélection pays par locale, libphonenumber `parsePhoneNumberFromString`, 0 étape intermédiaire, emails via `after()` |
| RESA-04 | Bouton WhatsApp flottant | Composant client dans `[locale]/layout.tsx`, `https://wa.me/66819585945?text=<encodeURIComponent>` |
</phase_requirements>

## Summary

Le travail de la phase est presque entièrement du code applicatif et SQL maison sur une stack déjà en place : aucune nouvelle dépendance n'est nécessaire (la seule opération de dépendances est de **déclarer `zod`** et de **retirer `twilio`**). `libphonenumber-js` (1.12.40 installé) est déjà utilisé côté client dans `ReservationForm.tsx` ; il faut l'utiliser aussi côté serveur (le bug de normalisation de `normalizePhone` - qui ne gère que les mobiles thaïs `0[6-9]` - disparaît si on parse avec le pays choisi). Next 16.1.6 fournit `after()` (stable depuis 15.1) pour déplacer webhook + emails après la réponse.

Trois points critiques qui ne sont pas dans CONTEXT : (1) **le schéma réel est invisible depuis le dépôt** et le dépôt contient des politiques dangereuses si on les rejoue (`004` : `FOR SELECT USING (true)` sur `reservations`) ; Docker n'est pas installé donc `supabase db dump` est inutilisable, mais `pg_dump 18.6` et `psql` sont installés et `.env.local` contient `POSTGRES_URL_NON_POOLING` ; (2) **la capacité "par créneau" est ambiguë** (créneau exact vs fenêtre de blocage) et la table `gecko_restaurant_settings` contient déjà `max_covers` et `table_block_duration_minutes` - c'est la source de vérité à utiliser ; (3) **`src/app/api/mcp/route.ts` interroge des tables non préfixées** (`reservations`, `opening_hours`, `menu_pages`...) qui n'existent peut-être pas en base - `check_availability` est probablement cassé ou lit les tables d'une autre application du projet partagé.

La capacité et l'insertion doivent être **atomiques** : un SELECT puis INSERT depuis Node a une fenêtre de course. Recommandation : une fonction SQL `gecko_create_reservation(...)` (SECURITY DEFINER, `pg_advisory_xact_lock` par date) qui calcule la capacité, insère la réservation et le consentement dans une seule transaction, appelée par la route via le client service-role.

**Primary recommendation:** Pipeline POST unique et ordonné - parse -> honeypot -> délai min -> zod -> libphonenumber -> règles horaires (TS pur, testable) -> rate-limit RPC (IP, email, téléphone) -> RPC atomique capacité+insert+consentement -> `after()` webhook+emails -> réponse minimale `{ data: { id, status } }`. Livrer les migrations additives avant le déploiement et la migration de **drop** de `gecko_phone_verifications` après.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Saisie, sélecteur pays, honeypot, timestamp de rendu | Browser / Client | — | `ReservationForm` est déjà `'use client'` ; aucune confiance accordée |
| Validation réelle (email, E.164, date, heure, taille) | API / Backend | Browser (UX only) | Le client est contournable ; le serveur est l'autorité |
| Rate limiting, anti-bot | API / Backend | Database (compteur atomique) | IP lue dans le handler ; compteur en SQL pour l'atomicité |
| Capacité par créneau + insertion | Database (fonction SQL + advisory lock) | API / Backend | Seule la base peut sérialiser les écritures concurrentes |
| Contrôle admin (`requireAdmin`) | API / Backend | Database (RLS `gecko_is_admin`) | Défense en profondeur déjà prévue par l'architecture |
| Webhooks + emails Resend | API / Backend (`after()`) | — | Hors chemin critique de la réponse |
| Bouton WhatsApp | Frontend Server (layout) + Browser (lien) | — | Monté dans le layout localisé, simple lien `<a>` |
| Page `/privacy` | Frontend Server (RSC) | — | Texte statique via `getTranslations` |
| Consentement newsletter | Database | API / Backend | Preuve juridique : écrite dans la même transaction que la réservation |
| Schéma / RLS | Database (migrations) | — | Source de vérité versionnée (SEC-04) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 (installé) | `after()` de `next/server`, Route Handlers | Déjà la stack ; `after` stable depuis 15.1.0 [CITED: nextjs.org/docs/app/api-reference/functions/after] |
| libphonenumber-js | 1.12.40 installé (latest 1.13.15) [VERIFIED: npm view] | Parse/validation E.164 serveur + client | Déjà utilisé (`libphonenumber-js/min`) ; pas besoin de mettre à jour |
| zod | 4.3.6 installé via lockfile (latest 4.6.7) [VERIFIED: npm view] | Schéma du body POST, `requireAdmin` n'en dépend pas | Déjà importé par `mcp/route.ts` ; à déclarer (SEC-06) |
| @supabase/supabase-js | ^2.98.0 | `rpc()` pour rate limit + création | Déjà la stack |
| next-intl | ^4.8.3 | `useLocale`, `useTranslations`, `Link` de `@/i18n/navigation` | Déjà la stack |
| resend | ^6.28.1 | Emails transactionnels | Déjà la stack |
| node:crypto (`createHmac`) | builtin | Hachage des clés de rate limit | Pas de dépendance |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.1.0 | Tests unitaires purs + tests de handlers avec mocks | Toute logique TS pure (règles horaires, capacité, IP, WhatsApp URL, escapeHtml) |
| @sentry/nextjs | ^10.45.0 | `captureException` dans `after()` et sur échec RPC rate-limit | Remplacer les `console.error` silencieux |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Table Supabase rate-limit | Upstash / Vercel Firewall | Écartés par D-07 (décision verrouillée) |
| Fenêtre fixe (`floor(epoch/window)`) | Fenêtre glissante / token bucket | Fenêtre fixe = 1 INSERT..ON CONFLICT, simple et atomique ; accepte un burst ≤ 2x à la frontière - acceptable ici |
| Timestamp client pour le délai min | Jeton HMAC émis par le serveur au rendu | Le jeton force un fetch/Server Action au montage ; timestamp client suffit contre les bots naïfs (D-09 sans CAPTCHA) |

**Installation:**
```bash
npm install zod@^4.3.6        # déclare la dépendance (SEC-06) ; lockfile reste sur 4.3.6 si on garde la version
npm uninstall twilio          # D-02
```

**Version verification:** `npm view zod version` -> 4.6.7 (modifié 2026-10-12) ; `npm view libphonenumber-js version` -> 1.13.15 ; `npm view next version` -> 16.4.2 (le projet est épinglé à 16.1.6, ne pas mettre à jour dans cette phase). [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| zod | npm | années (colinhacks) | très élevé | github.com/colinhacks/zod | [OK] | Approved - déjà dans `package-lock.json` (4.3.6), pas de postinstall |
| twilio | npm | — | — | — | non évalué | Retrait (désinstallation), pas une installation |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
Aucune nouvelle dépendance n'est introduite. `slopcheck` a été exécuté sur `zod` uniquement (résultat OK) ; `npm view zod scripts.postinstall` est vide. Note : `slopcheck install` tente d'exécuter `npm install` - ne pas l'utiliser dans le workflow d'exécution sans vérifier `git diff package.json` ensuite (rien n'a été modifié lors de la recherche).

## Architecture Patterns

### System Architecture Diagram

```
Browser (ReservationForm, 'use client')
  | POST /api/reservations  { name, email, phone(E.164 ou local+pays), date, time, party_size,
  |                           occasion, locale, marketing_consent, website(honeypot), rendered_at }
  v
Route Handler POST  (src/app/api/reservations/route.ts)
  1. request.json() (try/catch -> 400)
  2. honeypot rempli?        --yes--> 200 { data:{ id:0 } } fake success, aucune écriture
  3. now - rendered_at < 3s ? --yes--> 400 "réessayez"
  4. zod + libphonenumber (E.164 via pays choisi) + email format + longueurs   --fail--> 400
  5. règles de créneau (TS pur): date >= aujourd'hui Asia/Bangkok, party_size 1..40,
     jour fermé / heures hors special_hours > opening_hours                      --fail--> 400
  6. rate limit (RPC gecko_rate_limit_hit x3: ip 5/h, email 3/j, phone 3/j)     --over--> 429 + WhatsApp
  7. RPC gecko_create_reservation  (Postgres, 1 transaction)
        pg_advisory_xact_lock(date) -> somme des couverts actifs sur la fenêtre -> > max_covers ? 'FULL'
        INSERT gecko_reservations ; INSERT gecko_marketing_consents (si coché)    --FULL--> 409
  8. after(): webhook (AbortSignal.timeout) + emails Resend (client + restaurant) + Sentry si échec
  9. 201 { data:{ id, status:'pending' } }
  v
Supabase (service-role pour RPC/INSERT ; RLS sans policy publique sur gecko_reservations)

Admin routes (hours, special-hours, settings, announcement, menu/*, tables/*, reservations GET/PUT/DELETE)
  -> requireAdmin(): auth.getUser() 401 -> rpc('gecko_is_admin') 403 -> { supabase }
```

### Recommended Project Structure
```
src/
├── app/api/reservations/route.ts     # POST pipeline, GET/PUT/DELETE admin (requireAdmin)
├── app/[locale]/privacy/page.tsx     # nouvelle page RSC (getTranslations)
├── app/[locale]/layout.tsx           # + <WhatsAppButton />
├── components/WhatsAppButton.tsx     # 'use client', useTranslations
├── components/ReservationForm.tsx    # OTP retiré, email requis, case consentement, honeypot
├── utils/auth.ts                     # requireAdmin()
├── utils/rate-limit.ts               # getClientIp(), hashKey(), checkRateLimit()
├── utils/reservation-rules.ts        # fonctions pures: closed day, hours, slot window, capacity math
├── utils/validation.ts               # normalizePhone/isE164Phone réécrits via libphonenumber, schéma zod
├── utils/html.ts                     # escapeHtml (resend.ts)
supabase/migrations/
├── 007_gecko_baseline.sql            # schéma réel (idempotent)
├── 008_rate_limits_consents_and_rpc.sql   # additive: gecko_rate_limits, gecko_marketing_consents, RPCs
└── 009_drop_phone_verifications.sql  # APPLIQUÉE APRÈS le déploiement du code
tests/
├── reservation-rules.test.ts, rate-limit.test.ts, reservations-post.test.ts, require-admin.test.ts, whatsapp.test.ts
```

### Pattern 1: Rate limit atomique (SQL)
**What:** compteur à fenêtre fixe, une seule instruction atomique.
**When to use:** 3 appels par POST (ip/email/phone), avant la création.
```sql
-- 008_rate_limits_consents_and_rpc.sql  (à valider contre la base réelle)
create table if not exists public.gecko_rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  primary key (key, window_start)
);
alter table public.gecko_rate_limits enable row level security;   -- aucune policy: service-role uniquement

create or replace function public.gecko_rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits int;
begin
  insert into public.gecko_rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;

  -- ménage opportuniste (pas de pg_cron requis)
  if random() < 0.02 then
    delete from public.gecko_rate_limits where window_start < now() - interval '2 days';
  end if;

  return v_hits <= p_limit;      -- true = autorisé
end $$;
revoke all on function public.gecko_rate_limit_hit(text,int,int) from public, anon, authenticated;
grant execute on function public.gecko_rate_limit_hit(text,int,int) to service_role;
```
Appel TS : `adminSupabase.rpc('gecko_rate_limit_hit', { p_key, p_limit: 5, p_window_seconds: 3600 })` -> `data === true` si autorisé.

### Pattern 2: Création atomique avec capacité (SQL)
**What:** une fonction qui sérialise par date, calcule la capacité, insère réservation + consentement.
```sql
create or replace function public.gecko_create_reservation(
  p_name text, p_email text, p_phone text, p_date date, p_time time, p_party int,
  p_occasion text, p_locale text,
  p_marketing_consent boolean, p_consent_version text
) returns table (id bigint, status text, full boolean)   -- adapter le type d'id (SERIAL vs uuid) au schéma réel
language plpgsql security definer set search_path = public as $$
declare
  v_max int; v_block int; v_used int; v_new record;
begin
  perform pg_advisory_xact_lock(hashtext('gecko_resa_' || p_date::text));
  select coalesce((select value::int from gecko_restaurant_settings where key = 'max_covers'), 40) into v_max;
  select coalesce((select value::int from gecko_restaurant_settings where key = 'table_block_duration_minutes'), 120) into v_block;

  select coalesce(sum(party_size), 0) into v_used
  from gecko_reservations
  where reservation_date = p_date
    and status in ('pending','confirmed')
    and abs(extract(epoch from (reservation_time - p_time)) / 60) < v_block;   -- fenêtre de chevauchement

  if v_used + p_party > v_max then
    return query select null::bigint, null::text, true; return;
  end if;

  insert into gecko_reservations (customer_name, customer_email, customer_phone, reservation_date,
                                  reservation_time, party_size, occasion, status)
  values (p_name, p_email, p_phone, p_date, p_time, p_party, p_occasion, 'pending')
  returning * into v_new;

  if p_marketing_consent then
    insert into gecko_marketing_consents (email, consent, locale, source, consent_text_version, consented_at)
    values (lower(p_email), true, p_locale, 'reservation_form', p_consent_version, now());
  end if;
  return query select v_new.id, v_new.status, false;
end $$;
revoke all on function public.gecko_create_reservation(...) from public, anon, authenticated;
grant execute on ... to service_role;
```
Ceci est un squelette : le type de `id`, les colonnes réelles de `gecko_reservations` et un éventuel champ `locale` sont à confirmer par le dump (voir Runtime/Schema).

### Pattern 3: `requireAdmin()` partagé
```ts
// src/utils/auth.ts
import { NextResponse } from 'next/server'
import { createClient, isGeckoAdmin } from '@/utils/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!(await isGeckoAdmin(supabase))) return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { ok: true as const, supabase, user }
}
// usage:  const auth = await requireAdmin(); if (!auth.ok) return auth.response
```
Remplacer chaque bloc `getUser()` des 15 fichiers listés ci-dessous. [VERIFIED: grep du dépôt, 28 occurrences dans 15 fichiers]

### Pattern 4: IP client sur Vercel
Vercel écrase `x-forwarded-for` ; `x-real-ip` et `x-vercel-forwarded-for` portent la même IP publique du client, protégés contre l'usurpation [CITED: vercel.com/docs/headers/request-headers].
```ts
export function getClientIp(h: Headers): string | null {
  const ip = h.get('x-vercel-forwarded-for') ?? h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return ip || null            // null en dev: ne PAS créer un seau partagé 'unknown' en prod
}
```

### Pattern 5: `after()` dans un Route Handler
```ts
import { after } from 'next/server'
// ... après la RPC réussie, avant return:
after(async () => {
  try { /* webhook avec AbortSignal.timeout(5000) + Promise.allSettled(emails) */ }
  catch (e) { Sentry.captureException(e) }
})
return NextResponse.json({ data: { id, status: 'pending' } }, { status: 201 })
```
`cookies()`/`headers()` sont utilisables dans le callback en Route Handler ; le callback s'exécute même si la réponse échoue ; durée bornée par `maxDuration` ; sur Vercel repose sur `waitUntil` [CITED: nextjs.org/docs/app/api-reference/functions/after]. En vitest, `after` hors portée de requête lève : mocker `next/server`.

### Pattern 6: Téléphone (serveur et client)
```ts
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min'
export function parsePhone(raw: string, country: CountryCode) {
  const p = parsePhoneNumberFromString(raw, country)     // accepte "0812345678"+TH, "+49 151..." sans pays
  return p && p.isValid() ? p.number : null              // E.164 ou null
}
```
Vérifié localement : `('0812345678','TH') -> +66812345678`, `('06 12 34 56 78','FR') -> +33612345678`, `('+49 151 12345678') -> +4915112345678`, `('12345','FR')` invalide. [VERIFIED: exécution node dans le dépôt] `normalizePhone`/`isE164Phone` de `validation.ts` doivent déléguer à cette fonction ; le serveur reçoit `customer_phone` + `phone_country` (ou un numéro déjà E.164) et re-parse toujours.

### Pattern 7: Lien WhatsApp
`https://wa.me/66819585945?text=${encodeURIComponent(message)}` : numéro sans `+` ni zéros initiaux, texte encodé en URL [CITED: faq.whatsapp.com/5913398998672934 (page partiellement chargée) - format conforme à la connaissance standard]. Variable publique `NEXT_PUBLIC_WHATSAPP_NUMBER` avec **constante de repli** `66819585945` pour ne pas bloquer sur une modification des variables Vercel (qui demande l'accord du propriétaire). Ouvrir avec `target="_blank" rel="noopener noreferrer"`.

### Anti-Patterns to Avoid
- **SELECT puis INSERT depuis Node** pour la capacité : course entre deux requêtes ; utiliser la RPC avec verrou consultatif.
- **Seau IP partagé "unknown"** quand l'en-tête manque : bloquerait tout le monde à 5 réservations/heure ; sauter la limite IP et garder email/téléphone, journaliser.
- **Compter le rate limit avant la validation** : une saisie invalide ne doit pas consommer le quota 3/jour d'un vrai client. Ordre : validation d'abord, puis limites.
- **Retourner `select()` complet** (colonnes `admin_notes`, etc.) au visiteur : renvoyer `{ id, status }`.
- **Stocker IP/email/téléphone en clair dans `gecko_rate_limits`** : hacher en HMAC-SHA256 avec un secret serveur (minimisation PDPA/RGPD).
- **Fabriquer "aujourd'hui" avec `new Date()` UTC** : voir pitfall fuseau.
- **Rejouer `004_reservations.sql`** sur une base : sa politique `FOR SELECT USING (true)` rend les réservations publiques.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Normalisation/validation de numéros | Regex `^0[6-9]\d{8}$` / `^\+\d{8,15}$` (actuel) | `libphonenumber-js` `parsePhoneNumberFromString(...).isValid()` | Les regex actuelles ne valident que des mobiles thaïs et acceptent des numéros inexistants |
| Validation du body | `if (!x)` en chaîne | `zod` (types, longueurs, enums, trim) | Une seule source de messages et de types ; SEC-06 le déclare de toute façon |
| Compteur de débit | Compteur en mémoire / Map | `gecko_rate_limit_hit` SQL | Serverless sans état partagé : une Map ne limite rien |
| Sérialisation de la capacité | Verrou applicatif | `pg_advisory_xact_lock` en SQL | Seule la base voit toutes les requêtes concurrentes |
| Échappement HTML des emails | `.replace` ad hoc dispersé | un `escapeHtml()` unique appliqué à toute interpolation de `resend.ts` | CONCERNS : `customer_name`, `occasion`, `customer_email` injectés dans le HTML du mail restaurant |
| Envoi différé | `setTimeout`/promesses flottantes | `after()` | Une promesse non attendue est tuée à la fin de l'invocation serverless |
| Sélecteur de pays | Liste maison + codes à jour | Garder la liste de 30 pays existante et `getCountryCallingCode` pour le préfixe | Évite de dupliquer les indicatifs ; la liste actuelle suffit pour l'audience |

**Key insight:** les deux pièges classiques sont la course "check then act" (capacité, jeton) et la confiance au client (timestamp, pays, taille). Tout contrôle doit être refait dans le handler ou la base.

## Runtime State Inventory

> Phase de retrait (Twilio, OTP, table) et de renommage de variables (webhooks) : inventaire requis.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `gecko_phone_verifications` (live) : lignes de jetons expirés ; `gecko_reservations` : lignes existantes dont `customer_email` NULL (colonne reste nullable) | Migration 009 `DROP TABLE` **après** déploiement ; ne pas ajouter `NOT NULL` sur `customer_email` (anciennes lignes) - exiger l'email dans l'API/zod seulement |
| Live service config | Webhooks `NEXT_PUBLIC_RESA_HOOK_URL` / `..._VALIDATION_HOOK_URL` pointent probablement vers un workflow n8n (URLs inconnues, non lues) ; compte Twilio Verify (service SID) actif/facturable | Rotation des URLs et résiliation Twilio = **actions propriétaire** (hors dépôt) |
| OS-registered state | None - vérifié : aucun cron/tâche planifiée dans le dépôt (`vercel.json` absent) | none |
| Secrets/env vars | Vercel (et `.env.local`) : `NEXT_PUBLIC_RESA_HOOK_URL`, `NEXT_PUBLIC_RESA_VALIDATION_HOOK_URL` à renommer ; `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` à supprimer ; nouveaux : `RATE_LIMIT_SECRET` (HMAC), éventuellement `NEXT_PUBLIC_WHATSAPP_NUMBER` | Le code doit lire `RESA_HOOK_URL ?? NEXT_PUBLIC_RESA_HOOK_URL` pendant la transition, puis retirer le repli quand le propriétaire a basculé les variables Vercel. Les valeurs `NEXT_PUBLIC_*` déjà livrées dans un bundle restent exposées jusqu'à rotation |
| Build artifacts | `package-lock.json` (entrée `node_modules/twilio` + dépendances) ; `tsconfig.tsbuildinfo` (ignoré par git) mentionne twilio ; `.next/` | `npm uninstall twilio` régénère le lock ; rebuild propre |

Références restantes à nettoyer (grep) : `claude.md`, `package.json`, `src/app/api/reservations/route.ts`, `src/components/ReservationForm.tsx`, `src/utils/validation.ts` (`isOtpCode`), `tests/api-validation.test.ts` (bloc `isOtpCode`), `supabase/migrations/006_phone_verifications.sql`, clés `reservationForm.otp*` dans `messages/*.json`, docs `.planning/codebase/*`.

## Common Pitfalls

### Pitfall 1: Rejouer 001-006 sur une base vierge/partagée
**What goes wrong:** les migrations actuelles créent des tables **non préfixées** (`reservations`, `tables`, `phone_verifications`...) dans un projet Supabase **partagé** avec une autre application, et `004` crée `FOR SELECT USING (true)` + `FOR ALL USING (auth.role()='authenticated')`.
**Why it happens:** les migrations n'ont jamais été alignées sur la base réelle (préfixe `gecko_`).
**How to avoid:** archiver 001-006 (déplacer hors de `supabase/migrations/`, ex. `supabase/legacy/`) ou les remplacer par des no-op ; la baseline 007 crée uniquement des objets `gecko_*`. Décision à confirmer avec le propriétaire car l'historique `supabase_migrations.schema_migrations` du projet distant est inconnu (`supabase migration list --linked`, nécessite lien + mot de passe).
**Warning signs:** `supabase db push` annonce l'application de 001-006 sur la production.

### Pitfall 2: Appliquer la baseline sur la prod sans idempotence
**What goes wrong:** `CREATE TABLE`/`CREATE POLICY` échoue (objets déjà présents) ou, pire, un `DROP`/`CREATE` recrée les politiques avec des différences.
**How to avoid:** `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` avant `CREATE POLICY` avec le texte exact du dump ; ne jamais exécuter la baseline sur la prod sans diff préalable (`pg_dump` après vs avant). Vérification de reproductibilité = appliquer 007-009 sur une base **scratch** (pas la prod).
**Warning signs:** la sortie de dump post-migration diffère du dump initial.

### Pitfall 3: Ordre de déploiement vs `DROP TABLE gecko_phone_verifications`
**What goes wrong:** si la migration de drop passe avant le déploiement, l'ancienne version du code (qui lit la table) renvoie 500 sur toute réservation.
**How to avoid:** 008 (additive) -> déploiement code -> 009 (drop). Garder 009 dans un plan/wave séparé avec checkpoint humain.

### Pitfall 4: Fuseau horaire (UTC vs Krabi UTC+7)
**What goes wrong:** `isReservationDateValid` compare à `new Date()` local du serveur Vercel (UTC) ; côté formulaire `min={today}` vient de `toISOString()` (UTC). Entre 00:00 et 07:00 à Krabi, "aujourd'hui" est faux d'un jour ; un créneau du jour déjà passé reste réservable.
**How to avoid:** calculer "aujourd'hui" et "maintenant" avec `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' })` ; refuser un créneau du jour dont l'heure est passée (marge configurable). Calculer le jour de semaine par `Date.UTC(y,m-1,d).getUTCDay()` pour ne pas décaler. Tester avec des instants fixes (vitest `vi.setSystemTime`).

### Pitfall 5: Heures TIME Postgres
**What goes wrong:** colonnes `TIME` renvoyées `'11:00:00'` alors que le formulaire envoie `'19:00'` ; une comparaison de chaînes brute se trompe.
**How to avoid:** normaliser en minutes depuis minuit (`hh*60+mm`) avant comparaison. Dernière heure acceptée : `close_time` moins la durée de cuisine ? - la cuisine ferme à 22:00 mais `close_time` par défaut est 23:00 : voir Open Questions (le formulaire plafonne à 21:30).

### Pitfall 6: Special hours override
**What goes wrong:** utiliser `gecko_opening_hours` seul. **Règle :** une ligne `gecko_special_hours` pour la date l'emporte sur `gecko_opening_hours` (`is_open=false` -> fermé ; sinon ses `open_time`/`close_time`). `date` est UNIQUE donc au plus une ligne. [VERIFIED: 001_opening_hours.sql ; noms préfixés vérifiés dans `src/app/api/hours|special-hours/route.ts`]

### Pitfall 7: Honeypot/min-time qui frappent des vrais clients
**What goes wrong:** l'auto-remplissage du navigateur remplit un champ caché "website" ; ou un client très rapide < 3 s est refusé.
**How to avoid:** nom de champ non standard (`company_url`, `autocomplete="off"`, `tabindex=-1`, `aria-hidden`) ; honeypot -> faux succès silencieux ; délai min -> 400 avec message "réessayez" (pas de blocage silencieux), seuil 3 s mesuré du rendu au submit, et plafond (ex. 24 h) pour rejeter des valeurs forgées négatives/futures.

### Pitfall 8: Wi-Fi d'hôtel partagé (IP 5/heure)
**What goes wrong:** plusieurs touristes d'un même hôtel dépassent 5/h. C'est une décision verrouillée (D-08) ; le message 429 doit proposer WhatsApp avec lien direct. Ne pas appliquer la limite IP aux requêtes invalides (pitfall d'ordre).

### Pitfall 9: Email J+1 / langue
Les emails existants sont en **français uniquement** ; un touriste anglophone qui s'inscrit en `/en` reçoit une confirmation en français (nuit à RESA-03). Recommandation : envoyer `locale` (`fr|en`, whitelist serveur) dans le body, le stocker (colonne `locale` additive sur `gecko_reservations` - utile aussi à la phase 4 REV-03) et traduire les 3 gabarits fr/en. Voir Open Questions pour la confirmation du périmètre.

### Pitfall 10: Route MCP sur des tables non préfixées
`src/app/api/mcp/route.ts` lit `menu_pages`, `opening_hours`, `special_hours`, `announcements`, `reservations` avec le client anon. Si ces tables n'existent pas (ou appartiennent à l'autre application), les outils échouent ; si `reservations` existe avec la policy de `004`, `check_availability` lit des données de l'autre app. À vérifier avec le dump ; correction minimale (préfixe `gecko_`, `createAdminClient` pour la somme des couverts sans exposer de PII) à planifier ou à documenter comme dette si hors périmètre. [VERIFIED: lecture du fichier]

## Code Examples

### Règles de créneau (pur, testable)
```ts
// src/utils/reservation-rules.ts
export const MAX_PARTY_SIZE = 40
export function bangkokNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year:'numeric', month:'2-digit',
    day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(now)
  const g = (t: string) => parts.find(p => p.type === t)!.value
  return { date: `${g('year')}-${g('month')}-${g('day')}`, minutes: Number(g('hour')) * 60 + Number(g('minute')) }
}
export function dayOfWeek(dateStr: string) { const [y,m,d] = dateStr.split('-').map(Number); return new Date(Date.UTC(y, m-1, d)).getUTCDay() }
export function toMinutes(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
type Hours = { is_open: boolean | null; open_time: string | null; close_time: string | null }
export function resolveHours(date: string, regular: (Hours & { day_of_week: number })[], special: (Hours & { date: string })[]): Hours | null {
  return special.find(s => s.date === date) ?? regular.find(r => r.day_of_week === dayOfWeek(date)) ?? null
}
export function isTimeWithinHours(time: string, h: Hours | null, lastSeatingOffsetMin = 0) {
  if (!h || !h.is_open || !h.open_time || !h.close_time) return false
  const t = toMinutes(time)
  return t >= toMinutes(h.open_time) && t <= toMinutes(h.close_time) - lastSeatingOffsetMin
}
```

### Corps zod (squelette)
```ts
import { z } from 'zod'
export const reservationSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_email: z.string().trim().toLowerCase().email().max(254),
  customer_phone: z.string().trim().min(5).max(30),
  phone_country: z.string().length(2).optional(),
  reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reservation_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  party_size: z.number().int().min(1).max(40),
  occasion: z.string().trim().max(100).optional().nullable(),
  locale: z.enum(['fr', 'en']).default('fr'),
  marketing_consent: z.boolean().default(false),
  company_url: z.string().max(0).optional(),       // honeypot
  rendered_at: z.number().int(),
})
```
Les messages d'erreur utilisateur restent en français côté API (convention) mais pour un touriste, prévoir clés i18n côté client pour les erreurs courantes (email invalide, créneau complet, 429) : renvoyer un `code` stable (`{ error, code }`) que le formulaire traduit, tout en respectant `{ error: string }` du CLAUDE.md.

### Contrôle d'un handler admin (test)
```ts
vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'u' } } }) },
                               rpc: async () => ({ data: false, error: null }) }),
  isGeckoAdmin: async () => false,
}))
// expect((await requireAdmin()).ok).toBe(false)  -> response.status === 403
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unstable_after` | `after` de `next/server` | Next 15.1.0 | Utilisable tel quel en 16.1.6 |
| `middleware.ts` | `proxy.ts` (renommage Next 16) | Next 16 | Hors périmètre phase 1 ; ne pas toucher `src/middleware.ts` (Assumption A5) |
| OTP SMS Twilio | Email + validation E.164 | D-01 | Supprime coût SMS et abus de pumping |

**Deprecated/outdated:** `isOtpCode`, `phone_verification_token`, `phone_verifications`, `NEXT_PUBLIC_RESA_*`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Le schéma réel de `gecko_reservations` (types d'id, colonnes, éventuel `locale`) est proche de `004` avec préfixe ; le squelette SQL doit être ajusté au dump | Pattern 2 | Migration/RPC échoue ; à lever par le dump |
| A2 | `POSTGRES_URL_NON_POOLING` de `.env.local` permet `pg_dump` (peut contenir `supa=base-pooler.x` à retirer de l'URL) | SEC-04 procédure | Il faudra passer par `psql` + requêtes catalogue ou le dashboard Supabase |
| A3 | La capacité "par créneau" = fenêtre de chevauchement `table_block_duration_minutes` (défaut 120 min) autour de l'heure demandée, plafond `max_covers` (défaut 40) | Pattern 2 | Si le propriétaire veut "même heure exacte" ou "par service", la règle SQL change |
| A4 | Politique de rétention PDPA/RGPD et libellés légaux (finalité, durée, droits) ne sont pas définis par le propriétaire ; le texte `/privacy` est un brouillon | Open Questions | Non-conformité si publié sans validation |
| A5 | Le renommage `middleware` -> `proxy` de Next 16 n'est pas requis maintenant (fichier encore supporté en 16.1.6) | State of the Art | Avertissement de dépréciation seulement |
| A6 | lucide-react 1.x n'a pas d'icône de marque WhatsApp ; utiliser un SVG inline | Pattern 7 / WhatsApp | Un import cassé au build si faux |
| A7 | Le numéro +66 81 958 5945 est actif sur WhatsApp | D-15 | Bouton inutile ; confirmation propriétaire déjà notée dans CONTEXT |
| A8 | Fail-open sur erreur de la RPC de rate limit (réservation acceptée + alerte Sentry) | Pattern 1 | Fail-closed protégerait mieux mais perdrait des réservations si la base vacille ; choix produit |

## Open Questions (RESOLVED)

1. **Définition du "créneau" pour la capacité (D-04)**
   - Known: `gecko_restaurant_settings` contient `max_covers` et `table_block_duration_minutes` ; `MAX_COVERS=40` codé en dur dans le MCP.
   - Unclear: même heure exacte, fenêtre de chevauchement, ou service (déjeuner/dîner).
   - Recommendation: fenêtre de chevauchement (A3). Confirmer en une question au propriétaire/utilisateur avant le plan SQL ; la logique reste isolée dans la RPC.
   - RESOLVED: fenêtre de chevauchement `table_block_duration_minutes` (défaut 120) sur `max_covers` (défaut 40), tranchée par l'orchestrateur ; règles partagées dans 01-04 (`reservation-rules.ts`), RPC atomique `gecko_create_reservation` dans 01-06.

2. **Dernière heure réservable** : `close_time` par défaut 23:00, cuisine jusqu'à 22:00, créneaux du formulaire jusqu'à 21:30.
   - Recommendation: serveur accepte `reservation_time` ≤ `close_time - 60 min` ET impose que l'heure fasse partie de la grille 30 min du formulaire (liste `TIME_SLOTS` partagée entre client et serveur dans `reservation-rules.ts`).
   - RESOLVED: tranché par l'orchestrateur ; grille 30 min, dernière heure = `last_reservation_time` si défini, sinon fermeture cuisine 22:00 moins `table_block_duration_minutes`, dans 01-04 (`bookableSlots`/`checkSlot`), appliqués côté serveur dans 01-06 et côté formulaire dans 01-07.

3. **Neutralisation de 001-006 et historique distant** : confirmer que `supabase migration list --linked` montre ou non 001-006 appliquées (si oui, les déplacer casse `db push`).
   - RESOLVED: vérification à l'exécution dans 01-09 (`supabase migration list --db-url` consigné dans 01-DB-ROLLOUT.md avant tout push) ; 001-006 déplacées vers `supabase/legacy` en 01-03.

4. **Emails multilingues (Pitfall 9)** : inclus dans la phase (recommandé) ou dette ? Impact : 3 gabarits + colonne `locale`.
   - RESOLVED: inclus dans la phase 1 ; gabarits fr/en dans 01-05, colonne `locale` dans la migration 008 (01-06).

5. **Rétention des données** (réservations, consentements, rate-limit) : durée à fixer par le propriétaire pour `/privacy`.
   - RESOLVED: durées proposées dans le brouillon `/privacy` de 01-02 ; validation par le propriétaire avant publication dans 01-10.

6. **MCP et tables non préfixées (Pitfall 10)** : corriger dans la phase 1 ou différer.
   - RESOLVED: différé, hors phase 1 (dette notée dans 01-CONTEXT.md, Deferred Ideas).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/tests | ✓ | v26.4.0 (le projet cible `@types/node ^20`) | — |
| npm | deps | ✓ | — | — |
| Supabase CLI | migrations | ✓ | 2.116.0 (2.121.0 dispo) | — |
| Docker | `supabase db dump`, `supabase start` | ✗ | — | `pg_dump` direct + requêtes catalogue |
| pg_dump / psql | dump du schéma réel | ✓ | 18.6 | — |
| `POSTGRES_URL_NON_POOLING` | connexion directe | ✓ (nom présent dans `.env.local`, valeur non lue) | — | Dashboard Supabase -> SQL editor |
| Serveur Postgres local | tester 007-009 sur base vierge | ✗ (aucun serveur, Docker absent) | — | Projet/branche Supabase scratch **créé par le propriétaire**, ou schéma temporaire dans une transaction `BEGIN ... ROLLBACK` sur la base réelle pour les tests de fonctions |
| Compte Vercel / variables d'env | SEC-05, `RATE_LIMIT_SECRET`, WhatsApp | ✓ accès MCP Vercel possible | — | Modification = accord propriétaire |
| slopcheck | audit paquets | ✓ (pip) | — | — |

**Missing dependencies with no fallback:** aucune bloquante.
**Missing dependencies with fallback:** Docker / Postgres local -> voir ci-dessus ; la vérification "s'applique sur une base vierge" (success criterion 5) nécessite une base jetable : **checkpoint humain** pour la fournir.

**Procédure SEC-04 (accès base réelle, lecture seule) :**
```bash
# 1. Variables (ne jamais afficher la valeur) ; retirer le paramètre 'supa=' si présent dans l'URL
DB_URL="$(grep '^POSTGRES_URL_NON_POOLING=' .env.local | cut -d= -f2- | tr -d '"' | sed 's/[?&]supa=[^&]*//')"
# 2. Tables gecko_* (colonnes, contraintes, index, triggers, policies, RLS inclus par -t)
pg_dump "$DB_URL" --schema-only --no-owner --no-privileges -t 'public.gecko_*' > scratch/gecko_tables.sql
# 3. Fonctions et policies (non couvertes par -t)
psql "$DB_URL" -At -c "select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'gecko\_%'"
psql "$DB_URL" -c "select schemaname, tablename, policyname, cmd, roles, qual, with_check from pg_policies where tablename like 'gecko\_%' or (schemaname='storage' and policyname ilike '%gecko%')"
psql "$DB_URL" -c "select id, public from storage.buckets where id like 'gecko%'"   # bucket gecko-menu-images
```
Écrire les sorties dans le scratchpad, pas dans le dépôt, puis rédiger 007 à la main (nettoyée). Lecture seule de la prod : le dire au propriétaire (credentials de production). Contrôle croisé : le code référence `gecko_opening_hours`, `gecko_special_hours`, `gecko_announcement` (singulier), `gecko_restaurant_settings`, `gecko_reservations`, `gecko_tables`, `gecko_table_configurations`, `gecko_table_configuration_tables`, `gecko_table_assignments`, `gecko_menu_pages|categories|items`, `gecko_admins`, `gecko_phone_verifications`, RPC `gecko_is_admin`. [VERIFIED: grep de `src/`]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.0, environnement node |
| Config file | `vitest.config.ts` (`include: ['tests/**/*.test.ts']`, pas d'alias `@`) |
| Quick run command | `npx vitest run tests/reservation-rules.test.ts` |
| Full suite command | `npm test` (`vitest run`) ; `npm run build` exécute les tests avant `next build` |

Note : pas d'alias `@/` dans `vitest.config.ts` ; les tests existants importent en relatif (`../src/utils/...`). Pour tester le handler POST (qui importe `@/utils/...`), ajouter `resolve.alias: { '@': path.resolve(__dirname, 'src') }` à la config (Wave 0). Le build échoue si un test échoue : chaque nouveau test doit être déterministe (temps figé avec `vi.setSystemTime`).

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | GET sans admin: 401/403, plus de branche `?phone=` | unit (handler mocké) | `npx vitest run tests/reservations-get.test.ts` | ❌ Wave 0 |
| SEC-02 | clés rate-limit hachées, IP extraite (`x-vercel-forwarded-for` > `x-real-ip` > `x-forwarded-for`), 429 si RPC renvoie false, pas de seau 'unknown' | unit | `npx vitest run tests/rate-limit.test.ts` | ❌ Wave 0 |
| SEC-02 | atomicité SQL réelle | manuel/SQL | transaction `BEGIN; select gecko_rate_limit_hit('t',2,60) x3; ROLLBACK;` -> true,true,false | manuel (checkpoint) |
| SEC-03 | `requireAdmin` 401 sans user, 403 non-admin, ok admin | unit | `npx vitest run tests/require-admin.test.ts` | ❌ Wave 0 |
| SEC-03 | tous les fichiers route mutants appellent `requireAdmin` | unit (lecture de sources, comme `i18n.test.ts`) | `npx vitest run tests/admin-routes-guarded.test.ts` | ❌ Wave 0 |
| SEC-04 | migrations: nommage `gecko_`, pas de `USING (true)` sur réservations, pas de `phone_verifications` | unit (lecture SQL) | `npx vitest run tests/migrations.test.ts` | ❌ Wave 0 |
| SEC-04 | application sur base vierge | manuel (base scratch) | `supabase db reset`-équivalent sur base jetable | manuel (checkpoint) |
| SEC-05 | aucune occurrence `NEXT_PUBLIC_RESA` dans `src/` | unit (grep source) | `npx vitest run tests/no-public-secrets.test.ts` | ❌ Wave 0 |
| SEC-06 | `zod` dans `package.json` dependencies | unit | `npx vitest run tests/deps.test.ts` | ❌ Wave 0 |
| RESA-01 | aucune référence `twilio`/`phone_verification_token`/`api/verify` dans `src/` ; `twilio` absent de package.json | unit (source scan) | `npx vitest run tests/deps.test.ts` | ❌ Wave 0 |
| RESA-02 | email requis/format ; consentement non pré-coché ; bool enregistré avec version serveur | unit | `npx vitest run tests/reservations-post.test.ts` | ❌ Wave 0 |
| RESA-03 | `parsePhone`: TH/FR/GB/DE/+E.164 ; invalide -> null ; défaut pays par locale | unit | `npx vitest run tests/api-validation.test.ts` (étendre) | ✅ à étendre |
| D-04 | jour fermé (mardi), special_hours override, hors horaires, party 41, date passée (Bangkok), capacité | unit | `npx vitest run tests/reservation-rules.test.ts` | ❌ Wave 0 |
| D-09 | honeypot -> faux succès sans écriture ; délai < 3 s -> 400 ; valeur forgée rejetée | unit | `npx vitest run tests/reservations-post.test.ts` | ❌ Wave 0 |
| RESA-04 | `buildWhatsAppUrl(number, msg)` : sans `+`, encodage ; clés i18n fr/en | unit + parité | `npx vitest run tests/whatsapp.test.ts tests/i18n.test.ts` | ❌ / ✅ |
| i18n | clés `reservationForm.*`, `privacy.*`, `whatsapp.*` présentes en fr ET en | unit | `npx vitest run tests/i18n.test.ts` | ✅ |
| Emails | `escapeHtml` appliqué (`<script>` dans le nom) | unit | `npx vitest run tests/resend-escape.test.ts` | ❌ Wave 0 |
| UX < 60 s | parcours formulaire (aucune étape OTP) | manuel (chronométré, mobile, numéro étranger) | — | manuel |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/<fichier concerné>`
- **Per wave merge:** `npm test` + `npm run lint`
- **Phase gate:** `npm run build` vert (tests inclus) + checklist manuelle (RPC rate-limit en transaction rollback, GET anonyme `curl` -> 401, test mobile WhatsApp) avant `/gsd:verify-work`

### Wave 0 Gaps
- [ ] alias `@` dans `vitest.config.ts` (tests de handlers)
- [ ] `tests/reservation-rules.test.ts`, `tests/rate-limit.test.ts`, `tests/require-admin.test.ts`, `tests/reservations-post.test.ts` (mocks `@/utils/supabase/server`, `next/server` `after`), `tests/admin-routes-guarded.test.ts`, `tests/migrations.test.ts`, `tests/deps.test.ts`, `tests/whatsapp.test.ts`, `tests/resend-escape.test.ts`
- [ ] retirer le bloc `isOtpCode` de `tests/api-validation.test.ts` et adapter `isPartySizeValid` (max 40) / `normalizePhone` (nouvelle sémantique)
- [ ] Framework install: aucun (vitest déjà présent)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | oui (admin) | Supabase Auth + `gecko_is_admin` ; signup ouvert (`/api/auth/signup`) à désactiver (CONCERNS, recommandé) |
| V3 Session Management | non modifié | Cookies `@supabase/ssr` existants |
| V4 Access Control | oui | `requireAdmin()` sur toutes les routes admin ; RLS `gecko_is_admin()` ; aucune policy publique sur `gecko_reservations`, `gecko_rate_limits`, `gecko_marketing_consents` |
| V5 Input Validation | oui | zod + libphonenumber ; longueurs ; liste blanche des champs du PUT ; `escapeHtml` pour les emails |
| V6 Cryptography | oui (léger) | HMAC-SHA256 `node:crypto` avec `RATE_LIMIT_SECRET` ; ne pas écrire de hachage maison |
| V8 Data Protection | oui | Pas de PII dans les clés de rate-limit ; réponse minimale ; erreurs génériques (plus de `error.message` Supabase) |
| V11 Business Logic | oui | Capacité atomique, anti-bot, plafonds par IP/email/téléphone |
| V13 API | oui | Codes HTTP corrects (400/409/429), JSON `{ error }` |

### Known Threat Patterns for Next.js + Supabase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Énumération/divulgation PII via GET public | Information disclosure | Supprimer `?phone=` ; GET admin-only (SEC-01) |
| Spam de réservations / saturation de créneaux | Denial of service | Rate limits + honeypot + délai min + capacité (SEC-02, D-04) |
| Utilisateur du pool d'auth partagé appelant une route admin | Elevation of privilege | `requireAdmin()` avec `gecko_is_admin` (SEC-03) |
| Mass assignment sur `PUT` | Tampering | Liste blanche (`status`, `admin_notes`, ...) + enum de statut |
| Injection HTML dans l'email restaurant | Tampering / XSS-in-email | `escapeHtml` partout dans `resend.ts` ; sujets d'email sans retours ligne |
| Fuite de l'URL du webhook | Spoofing | Variables serveur ; rotation ; idéalement secret partagé en en-tête (hors périmètre) |
| Course sur la capacité | Tampering | Advisory lock dans la RPC |
| Usurpation d'IP (`X-Forwarded-For`) | Spoofing | En-têtes Vercel non falsifiables [CITED: vercel.com/docs/headers/request-headers] ; ne pas se fier à ces en-têtes hors Vercel |
| Erreurs verbeuses | Information disclosure | Messages génériques ; détail dans Sentry |
| Open redirect `redirect=` du login | Spoofing | Hors périmètre direct ; signalé dans CONCERNS |

**Routes à protéger (SEC-03), d'après `grep getUser()` :** `reservations` (GET/PUT/DELETE), `hours` (PUT), `special-hours` (POST, DELETE), `settings` (PUT), `announcement`, `menu/categories|items|pages|reorder|upload`, `tables`, `tables/[id]`, `tables/assignments`, `tables/configurations`, `tables/configurations/[id]`. Les GET publics (`hours`, `special-hours`, `settings`, `announcement`, `menu/*` lecture) restent publics. Vérifier si `tables/assignments` GET expose des réservations (PII) : s'il lit `gecko_reservations`, il doit être admin-only.

## Sources

### Primary (HIGH confidence)
- Lecture du dépôt : `src/app/api/reservations/route.ts`, `src/components/ReservationForm.tsx`, `src/utils/validation.ts`, `src/utils/resend.ts`, `src/utils/supabase/server.ts`, `src/middleware.ts`, `src/app/api/{hours,special-hours,settings,mcp,tables/assignments,verify/send}/route.ts`, `supabase/migrations/001,004,006`, `tests/*`, `vitest.config.ts`, `package.json`, `.planning/codebase/CONCERNS.md`
- https://nextjs.org/docs/app/api-reference/functions/after - stabilité 15.1.0, Route Handlers, durée, plateformes (lu 2026-10-16)
- https://vercel.com/docs/headers/request-headers - `x-forwarded-for`/`x-real-ip`/`x-vercel-forwarded-for`, anti-usurpation (lu 2026-10-16)
- Exécution locale `libphonenumber-js/min` (1.12.40) : comportements de parse listés ci-dessus
- `npm view` : zod 4.6.7, libphonenumber-js 1.13.15, next 16.4.2

### Secondary (MEDIUM confidence)
- https://faq.whatsapp.com/5913398998672934 - la page n'a chargé que partiellement ; format `wa.me/<numéro sans + ni 0>?text=<urlencoded>` confirmé dans ses grandes lignes

### Tertiary (LOW confidence)
- Libellés PDPA/RGPD (contenu de la politique de confidentialité) : connaissance générale, [ASSUMED], à valider par le propriétaire ou un juriste
- Disponibilité du pg_dump via `POSTGRES_URL_NON_POOLING` : non testée (secret non lu)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - aucune nouvelle dépendance ; versions lues dans le dépôt et le registre
- Architecture: HIGH pour le pipeline POST/`after`/`requireAdmin` ; MEDIUM pour la RPC SQL (squelette à ajuster au schéma réel)
- Pitfalls: HIGH (issus du code lu), MEDIUM sur l'état de la base distante

**Research date:** 2026-10-16
**Valid until:** 2026-11-15 (stack stable ; la deadline P1 est le 2026-11-01)
