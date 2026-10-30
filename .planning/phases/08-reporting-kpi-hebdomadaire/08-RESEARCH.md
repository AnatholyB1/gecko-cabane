# Phase 8: Reporting KPI hebdomadaire - Research

**Researched:** 2026-10-30
**Domain:** Cron Vercel + agrégation Supabase + APIs externes (Search Console, Bright Data, Claude) + email Resend + page admin
**Confidence:** MEDIUM (code du dépôt : HIGH ; APIs externes : MEDIUM ; seuils d'alerte : LOW, spec absente)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01 Orchestration: job Vercel Cron dans l'appli (route `/api/cron/...`, Bearer CRON_SECRET comme les crons existants), PAS n8n. KPI-02 est réinterprété: "workflow n8n" devient "job cron dans l'appli". Collecte lundi 7h Krabi (00:00 UTC), envoi 8h Krabi (01:00 UTC).
- D-02 Sources v1: (a) en base: réservations, no-show, clics /review par source, newsletter (Resend, plus Brevo); (b) Search Console via compte de service Google (code + marche à suivre, accès créé par le propriétaire); (c) rang TripAdvisor via Bright Data (coût par appel, plafonné).
- D-03 Hors v1: Google Business Profile / avis Google automatiques. Champ de saisie manuelle hebdomadaire dans l'admin à la place (ne bloque pas le rapport). Une source indisponible est affichée "non disponible", jamais inventée.
- D-04 WhatsApp: PAS en v1. KPI-05 est livré en email seul; résumé WhatsApp reporté.
- D-05 Dashboard: page `/admin/kpi`, admins seulement (requireAdmin), français fixe, historique semaine par semaine. Pas de lien public.
- D-06 Table `weekly_kpis` (préfixe `gecko_` à respecter: `gecko_weekly_kpis`), migration numérotée 018, écrite en fichier, appliquée seulement après accord.
- D-07 Rédaction (KPI-04) par l'API Claude, 3 phrases de lecture + 3 actions en français; modèle réglé par variable d'env; repli sur texte sans IA si l'appel échoue.
- D-08 Alertes immédiates (KPI-07): avis <= 3 étoiles (saisie manuelle ou source) et retour privé "Un souci ?" de /review => email immédiat au propriétaire.
- D-09 KPI-08: 2 semaines de test en mode brouillon (rapport envoyé au propriétaire seulement, marqué TEST) avant déclaration "fiable"; ne peut pas être clos avant mi-novembre 2026.

### Claude's Discretion
Non listé explicitement : schéma exact de `gecko_weekly_kpis`, découpage en modules, mécanisme du mode brouillon, choix libs (googleapis vs JWT à la main, SDK vs fetch), seuils par défaut, format de saisie manuelle.

### Deferred Ideas (OUT OF SCOPE)
WhatsApp automatique (Cloud API Meta); avis Google via Business Profile API; comparaison N-1 (2e saison); n8n.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KPI-02 | Collecte hebdo lundi 7h Krabi dans `gecko_weekly_kpis` | Cron `/api/cron/weekly-kpi`, semaine Asia/Bangkok, sources DB + SC + Bright Data, upsert idempotent |
| KPI-03 | Comparaison S-1 + seuils d'alerte | Module pur `kpi-compare`/`kpi-alerts`; seuils = constantes (spec introuvable, valeurs proposées à confirmer) |
| KPI-04 | 3 phrases + 3 actions via Claude | `fetch` vers Messages API, JSON validé zod, repli déterministe |
| KPI-05 | Email lundi 8h (WhatsApp différé, D-04) | Resend via `getResendClient`, claim avant envoi, idempotencyKey |
| KPI-06 | Dashboard historique | `/admin/kpi` client + `/api/kpi` GET, `requireAdmin` |
| KPI-07 | Alerte immédiate avis <=3 / retour privé | Retour privé : email déjà envoyé par `/api/review/feedback`; ajouter alerte sur saisie manuelle |
| KPI-08 | 2 semaines en mode TEST | Drapeau env `KPI_REPORT_MODE` (défaut `test`), colonne `report_mode` par ligne, compteur dans le dashboard |
</phase_requirements>

## Summary

Le dépôt fournit presque tout le socle : garde Bearer `CRON_SECRET` fail-closed, `?dry=1`, `maxDuration = 60`, `krabiToday/addDays` (`src/utils/review-invitations.ts`), `requireAdmin` (`src/utils/auth.ts`), `getResendClient` / `RESTAURANT_NOTIFICATION_EMAIL` (`src/utils/resend.ts`), motif « claim avant envoi » + `idempotencyKey`. Aucun nouveau paquet npm n'est nécessaire : Search Console (JWT RS256 via `node:crypto` + `fetch`), Bright Data (`fetch` REST) et Claude (`fetch`) se font sans dépendance.

Trois pièges de données à connaître avant de planifier : (1) `gecko_review_clicks` (016) agrège par MOIS, pas par semaine : il faut des instantanés cumulatifs et un delta ; (2) le document « Specs site Gecko Cabane – SEO et conversion.md » est absent du dépôt (recherche faite), donc les seuils d'alerte ne sont pas connus : des valeurs par défaut sont proposées en constantes, à faire valider ; (3) le retour privé « Un souci ? » envoie déjà un email au propriétaire (`src/app/api/review/feedback/route.ts`, via `after()`), donc KPI-07 pour cette moitié se réduit à tester/qualifier l'existant, pas à le dupliquer.

**Primary recommendation:** une route unique `GET /api/cron/weekly-kpi` (collecte puis, si la ligne existe et n'a pas été envoyée, envoi), planifiée à 00:00 UTC et 01:00 UTC, idempotente par `week_start` ; modules purs testables dans `src/utils/kpi-*.ts` ; mode TEST par défaut (fail-safe).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Planification hebdo | Vercel Cron (Backend) | — | D-01 |
| Collecte DB + sources externes | API / Backend (route cron, service role) | Database | Secrets serveur ; PII (réservations) jamais sortie |
| Agrégats / comparaison / seuils | Modules purs serveur | — | Testables sans réseau |
| Rédaction IA | API / Backend | — | Clé API serveur ; entrée = chiffres agrégés seulement |
| Envoi rapport + alertes | API / Backend (Resend) | — | Idempotence côté serveur |
| Historique + saisie manuelle | Browser (page admin client) | API `/api/kpi` + RLS admin | Convention admin du dépôt |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next / @supabase/supabase-js / resend / @sentry/nextjs / zod | déjà installés | cron, DB, email, erreurs, validation | Déjà utilisés par les crons existants [VERIFIED: package.json, code] |
| `node:crypto`, `fetch` natifs | Node | JWT RS256 Search Console, appels Bright Data et Claude | Zéro dépendance, surface d'attaque minimale |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JWT manuel `node:crypto` | `google-auth-library` (11.3.2 sur le registre) [VERIFIED: registry npmjs] | Lib plus robuste mais chaîne de dépendances lourde ; le flux compte de service = 1 signature + 1 POST. Recommandé : manuel (~40 lignes) + test avec paire de clés générée |
| `fetch` Claude | `@anthropic-ai/sdk` | SDK = dépendance de plus pour 1 appel ; `fetch` suffit (retry inutile : repli sans IA) |

**Installation:** aucune. **Package Legitimacy Audit:** aucun paquet externe ajouté, slopcheck non applicable. Si le planificateur décide d'ajouter un SDK, il doit gater l'installation par `checkpoint:human-verify` (non vérifié ici).

## Architecture Patterns

### Flux
```
Vercel Cron 00:00 UTC (+ 01:00 UTC) --Bearer CRON_SECRET--> /api/cron/weekly-kpi
  1. week = [lundi-7, dimanche-1] Asia/Bangkok  (?week=YYYY-MM-DD pour rattrapage, ?dry=1)
  2. collecte parallèle, chaque source avec AbortSignal.timeout:
       DB (réservations, newsletter_events, review_clicks snapshot) | Search Console | Bright Data
     -> source KO = null + "non disponible" (jamais inventé)
  3. upsert gecko_weekly_kpis (onConflict week_start, colonnes collecteur seulement)
  4. compare S-1 + alertes (pur) -> Claude (JSON validé) | repli texte déterministe
  5. claim report_sent_at (update ... is null returning) -> Resend (idempotencyKey kpi-report-{week}-{mode})
     mode test: destinataire = RESTAURANT_NOTIFICATION_EMAIL, sujet "[TEST]"
/admin/kpi (client) --> /api/kpi GET (historique) / PUT (saisie manuelle + alerte <=3)
/api/review/feedback (existant) --> email propriétaire (retour privé)
```

### Structure recommandée
```
src/utils/kpi-week.ts        # bornes semaine Krabi (pur)
src/utils/kpi-collect.ts     # requêtes DB agrégées (service role)
src/utils/kpi-gsc.ts         # JWT + searchAnalytics (fetch injectable)
src/utils/kpi-tripadvisor.ts # Bright Data + parseRank (pur)
src/utils/kpi-alerts.ts      # comparaison S-1 + seuils (constantes)
src/utils/kpi-narrative.ts   # prompt, appel Claude, validation, repli
src/utils/kpi-report-email.ts# gabarit HTML/texte (escapeHtml de ./html)
src/app/api/cron/weekly-kpi/route.ts
src/app/api/kpi/route.ts     # requireAdmin ; ajouter à GUARDED_ROUTE_FILES (tests/admin-routes-guarded.test.ts)
src/app/admin/kpi/page.tsx   # + carte dans src/app/admin/page.tsx
supabase/migrations/018_weekly_kpis.sql
```

### Sources en base (code réel)
- **Réservations** (`gecko_reservations`) : `status` ∈ pending/confirmed/cancelled/completed/no_show, `reservation_date`, `party_size`, `created_at`, `source` ∈ site/whatsapp/telephone/sans_reservation (015). Nouvelles réservations = `created_at` dans la semaine (bornes UTC converties depuis Krabi) ; couverts/no-show = `reservation_date` dans la semaine. Taux no-show = no_show / (completed + no_show) ; null si dénominateur 0. Pagination : `fetchAllPages` (`src/utils/paginate.ts`) ; ne sélectionner que statut/date/source/party_size, jamais nom/email/téléphone.
- **Clics /review** : `gecko_review_clicks(month, source, kind, hits)`, source ∈ email/qr/wa/site/unknown, kind ∈ visit/google/tripadvisor — compteurs MENSUELS. Stocker dans `gecko_weekly_kpis` un jsonb `review_clicks_snapshot` (cumul du mois courant à l'instant de collecte) et calculer le delta hebdo = cumul actuel − snapshot précédent du même mois (si changement de mois : cumul mois courant + (dernier cumul connu du mois précédent − ancien snapshot) ; à défaut null). Approximation documentée (bots/prefetch gonflent déjà les compteurs, voir 016).
- **Newsletter** : `gecko_newsletter_events(day, event, source, count)` (popup_shown, popup_dismissed, subscribed, confirmed, unsubscribed) → somme par `day` sur la semaine. Total abonnés actifs : `resolveActiveSubscribers` (`src/utils/newsletter-ledger.ts`, déjà utilisé par newsletter-sync). Brevo : ne pas utiliser (D-02).
- **Avis** : saisie manuelle (colonnes dans `gecko_weekly_kpis`) ; le total mensuel manuel existant (`gecko_review_monthly_totals`) reste distinct.

### Schéma proposé `gecko_weekly_kpis` (018)
`week_start date primary key` (lundi Krabi), `week_end date`, colonnes numériques nullables par KPI (reservations_new, covers, no_show, completed, no_show_rate, reservations_by_source jsonb, review_clicks_week jsonb, review_clicks_snapshot jsonb, newsletter_* , gsc_clicks, gsc_impressions, gsc_ctr, gsc_position, gsc_days_covered, tripadvisor_rank, tripadvisor_total), manuel (google_reviews_total, google_new_reviews, google_min_rating smallint check 1..5, manual_note), `sources_status jsonb` (ok/unavailable par source), `alerts jsonb`, `narrative jsonb`, `report_mode text check in ('test','live')`, `report_sent_at timestamptz`, `collected_at`, `updated_at`. RLS : activée ; policy select pour `gecko_is_admin()` ; update/insert admin limité aux colonnes manuelles via l'API (service role pour le cron). `revoke all ... from anon, authenticated` puis `grant select` (modèle 016). `tests/migrations.test.ts` impose préfixe `gecko_` et numérotation strictement croissante : 018 conforme. Fichier écrit, NON appliqué sans accord (D-06).
Les colonnes manuelles et collecteur doivent pouvoir être écrites indépendamment : upsert avec uniquement les colonnes concernées (une saisie avant la collecte crée la ligne partielle).

### Search Console (compte de service)
- Flux : JWT `{iss: client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat, exp: iat+3600}` signé RS256 (`crypto.createSign('RSA-SHA256')`, base64url) → POST `https://oauth2.googleapis.com/token` (`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`) → `access_token`. [CITED: developers.google.com/identity/protocols/oauth2/service-account — flux standard ; ASSUMED pour le détail des champs, non re-fetché]
- Requête : `POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl encodé}/searchAnalytics/query`, scope `webmasters.readonly`, corps `{startDate,endDate,dimensions:['date'],dataState,rowLimit}` ; réponse `rows[].{keys,clicks,impressions,ctr,position}`. Dates en heure du Pacifique. Les données récentes peuvent être incomplètes ; `dataState` `final` (défaut) ou `all` avec `metadata.first_incomplete_date`. Top rows seulement (limites internes). [CITED: developers.google.com/webmaster-tools/v1/searchanalytics/query]
- Recommandation : dimension `date`, `dataState: 'all'`, additionner clics/impressions, position moyenne pondérée par impressions, enregistrer `gsc_days_covered` et marquer « partiel » si `first_incomplete_date` ≤ dimanche.
- Prérequis propriétaire : créer le compte de service, ajouter son email comme utilisateur de la propriété Search Console, fournir JSON via variable d'env (`GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL` ex. `sc-domain:geckocabanerestaurant.com`). Attention aux `\n` échappés dans `private_key`. Jamais en chat.

### Bright Data (rang TripAdvisor)
- API directe Web Unlocker : `POST https://api.brightdata.com/request`, `Authorization: Bearer`, corps `{zone, url, format:'raw'}`. [CITED: docs.brightdata.com/scraping-automation/web-unlocker/send-your-first-request] Le prix par requête n'est pas sur cette page ; tarif Web Unlocker de l'ordre de ~1,5 USD / 1000 requêtes [ASSUMED] — à confirmer sur le tableau de bord/tarifs du propriétaire.
- Plafond : UNE requête par exécution (pas de retry), `AbortSignal.timeout(20_000)`, désactivable par absence de `BRIGHTDATA_API_KEY`; au plus 1 appel/semaine (le cron réutilise la valeur déjà stockée si la ligne a `tripadvisor_rank`), coût ≈ 4–5 appels/mois.
- Parsing : l'URL de la fiche vient d'une variable d'env (`TRIPADVISOR_URL`) ; le rang est extrait par regex sur le HTML/texte (motif type « #12 of 85 Restaurants in Krabi Town », multilingue FR/EN : « n° 12 sur 85 ») [ASSUMED, à valider sur un échantillon réel hors prod]. Pas de correspondance, HTTP non-2xx, timeout ou 429 ⇒ `tripadvisor_rank = null`, statut « non disponible ». L'outil MCP `scrape_as_markdown` n'est pas utilisable à l'exécution (outil d'agent) : utiliser l'API REST.
- Risque : TripAdvisor change souvent son HTML ; parseur isolé et testé sur fixtures, échec silencieux côté rapport mais visible dans `sources_status`.

### Claude (KPI-04)
- `POST https://api.anthropic.com/v1/messages`, en-têtes `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`, corps `{model, max_tokens, system, messages}` ; réponse `content[0].text` [ASSUMED sur la version d'en-tête et la forme, non re-fetchées ici ; la redirection docs vers platform.claude.com a été constatée]. Modèle : `ANTHROPIC_MODEL` obligatoire, aucune valeur codée en dur ; absent ou erreur ⇒ repli.
- Entrée : uniquement l'objet agrégé (chiffres, deltas, alertes, noms de sources) sérialisé en JSON. Interdits dans le prompt : nom/email/téléphone, texte des messages « Un souci ? », notes libres. Test : le prompt construit ne contient aucune clé hors liste blanche.
- Sortie : demander du JSON `{lecture:[3], actions:[3]}`, valider avec zod (3 éléments, chaînes ≤ 300 caractères, strip des balises), sinon repli. Timeout 20 s. Repli déterministe : phrases générées depuis les deltas/alertes. Les textes IA sont échappés par `escapeHtml` dans l'email.
- Bonne pratique : instruire de ne citer que les chiffres fournis et de dire « non disponible » pour les null.

### Mode brouillon (KPI-08)
`KPI_REPORT_MODE` : `test` (défaut si absent ou invalide) | `live`. En `test` : destinataire = `RESTAURANT_NOTIFICATION_EMAIL` uniquement, sujet préfixé `[TEST]`, bandeau dans le corps ; `report_mode` stocké par ligne. En `live` : propriétaire + `KPI_REPORT_RECIPIENTS` (liste d'emails, optionnelle). Le dashboard affiche le nombre de rapports TEST envoyés ; la déclaration « fiable » est une décision humaine après ≥ 2 rapports TEST vérifiés (au plus tôt mi-novembre) et le passage à `live` = changement d'env par le propriétaire. Le plan doit inclure un checkpoint:human-verify pour ce basculement.

### Alertes immédiates (KPI-07)
- Retour privé : déjà envoyé au propriétaire dans `after()` de `/api/review/feedback`. Travail : (a) préfixe sujet explicite si souhaité, (b) test de non-régression (route appelle `resend.emails.send` vers `RESTAURANT_NOTIFICATION_EMAIL`), (c) ne PAS dupliquer. Limite connue : si Resend/destinataire non configuré, seul `Sentry.captureMessage` signale l'échec.
- Avis ≤ 3 : saisie manuelle `google_min_rating` (1–5) via `/api/kpi` PUT ; si ≤ 3 et valeur nouvelle/modifiée ⇒ email d'alerte immédiat au propriétaire (hors dépendance du rapport hebdo). Éviter les doublons : n'envoyer que si la valeur passe de non-alerte à alerte ou change (comparer à la ligne existante) + idempotencyKey `kpi-lowrating-{week}-{rating}`. Aucune source automatique d'avis en v1 (D-03).

### Seuils d'alerte (KPI-03) : spec introuvable
Le fichier « Specs site Gecko Cabane – SEO et conversion.md » n'existe pas dans le dépôt (recherche sur le dépôt) ; PROJECT.md le référence seulement. Le planificateur doit (1) isoler les seuils dans `kpi-alerts.ts` en constantes exportées, (2) prévoir une question au propriétaire. Défauts proposés [ASSUMED] : réservations −30 % vs S-1 (base ≥ 5) ; no-show > 15 % (≥ 2 no-show) ; clics Search Console −30 % ; position moyenne dégradée de > 3 ; rang TripAdvisor dégradé de ≥ 3 places ; désinscriptions > confirmations ; avis ≤ 3 étoiles ; source indisponible 2 semaines de suite. S-1 manquant ⇒ pas de delta (« première semaine »). N-1 différé.

### Fuseau et semaine
Semaine = lundi 00:00 → dimanche 23:59:59 Asia/Bangkok (UTC+7, sans heure d'été). Le cron de 00:00 UTC lundi = lundi 07:00 Krabi ⇒ `krabiToday` = lundi ⇒ `week_start = addDays(today,-7)`, `week_end = addDays(today,-1)`. Fonction pure avec `now` injecté. Conversion en bornes UTC pour `created_at` : `${start}T00:00:00+07:00` … `[start, end+1j)`. Idempotence : PK `week_start`, upsert ; re-run = même ligne ; envoi protégé par `report_sent_at` + idempotencyKey. Paramètre `?week=YYYY-MM-DD` (lundi valide uniquement) pour rattrapage.

### Vercel Cron
- Limites : 100 crons/projet sur tous les plans ; Hobby = 1 exécution/jour max et précision ±59 min ; Pro = à la minute [CITED: vercel.com/docs/cron-jobs/usage-and-pricing, 2026-07-15]. Plan du projet non vérifié [ASSUMED Hobby possible]. Conséquence : ne pas supposer que 00:00 précède 01:00 ; la route doit être autosuffisante (collecte si absente, puis envoi si non envoyé) et idempotente. Deux entrées `vercel.json` vers la même route (`0 0 * * 1` et `0 1 * * 1`) ; sur Hobby l'heure d'envoi « 8h » peut glisser jusqu'à ~9h (à signaler au propriétaire).
- `export const maxDuration = 60` comme les crons existants ; budget interne ~50 s (`TIME_BUDGET_MS` du patron newsletter-sync). Collecte en `Promise.allSettled`, timeouts par source (SC 10 s, Bright Data 20 s, Claude 20 s).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Garde cron | nouvelle auth | copier le bloc Bearer `CRON_SECRET` fail-closed | Cohérence + tests existants |
| Garde admin | check ad hoc | `requireAdmin()` | Boundary = `gecko_admins` |
| Semaine/fuseau | arithmétique locale | `krabiToday`/`addDays` | Évite DST/locale |
| Échappement HTML | concat brute | `escapeHtml`/`stripLineBreaks` (`src/utils/html.ts`) | Texte IA non fiable |
| Pagination Supabase | boucle maison | `fetchAllPages` | Limite max_rows |
| Idempotence envoi | flag en mémoire | claim DB + `idempotencyKey` | Livraisons cron en double |

## Common Pitfalls

1. **Clics /review mensuels pris pour hebdo** : afficher le cumul mois comme semaine. Utiliser instantané + delta ; test sur changement de mois.
2. **Spec/seuils absents** : inventer silencieusement. Constantes nommées + question propriétaire (A2).
3. **Ordre des crons non garanti (Hobby)** : route autosuffisante.
4. **Source indisponible traitée comme 0** : un `null` ne doit jamais devenir 0 ni déclencher « chute de 100 % » ; la comparaison ignore les null.
5. **Search Console données incomplètes / fuseau Pacifique** : `gsc_days_covered`, marquer « partiel ».
6. **PII dans le prompt ou les logs** : liste blanche stricte, pas de `console.log` du rapport ; Sentry sans `extra` de contenu.
7. **Basculement en `live` par erreur** : défaut `test`, valeur invalide ⇒ `test`.
8. **Double alerte** pour le retour privé (existant) : ne pas ajouter un second email.
9. **Upsert écrasant la saisie manuelle** : le cron n'écrit que ses colonnes.
10. **Cron non authentifié en test local** : `CRON_SECRET` requis ; ne jamais appeler les APIs réelles en test (mocks `fetch`).
11. **`zod` non déclaré dans `package.json`** (transitif, noté dans CLAUDE.md) : déjà utilisé par `review-feedback.ts` ; le signaler, ne pas aggraver.

## Code Examples

### Semaine Krabi (pur)
```typescript
// Source: patron de src/utils/review-invitations.ts
import { krabiToday, addDays } from '@/utils/review-invitations'
export function previousWeek(now: Date) {
  const today = krabiToday(now)                  // lundi pour le cron de 00:00 UTC
  const dow = new Date(today + 'T00:00:00Z').getUTCDay() // 1 = lundi
  const monday = addDays(today, -((dow + 6) % 7))   // lundi de la semaine courante
  const start = addDays(monday, -7)
  return { start, end: addDays(monday, -1) }
}
```

### JWT compte de service (sans dépendance)
```typescript
import { createSign } from 'node:crypto'
const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url')
export function signServiceAccountJwt(email: string, privateKey: string, nowSec: number) {
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64u(JSON.stringify({
    iss: email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: nowSec, exp: nowSec + 3600,
  }))
  const sig = createSign('RSA-SHA256').update(`${head}.${claims}`).sign(privateKey.replace(/\\n/g, '\n'))
  return `${head}.${claims}.${b64u(sig)}`
}
```

### Envoi idempotent (patron review-invitations)
Claim `update({report_sent_at: now}).eq('week_start', w).is('report_sent_at', null).select('week_start')` ; 0 ligne ⇒ déjà envoyé ; échec Resend ⇒ remettre `report_sent_at` à null + `Sentry.captureException`.

## State of the Art

| Ancien | Actuel | Impact |
|--------|--------|--------|
| n8n (spec d'origine) | Cron Vercel dans l'appli (D-01) | REQUIREMENTS/ROADMAP/PROJECT parlent encore de n8n/WhatsApp/GBP : mettre à jour la traçabilité (KPI-02 réinterprété, KPI-05 email seul) |
| docs.anthropic.com | platform.claude.com/docs | URL de doc redirigée (301) |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Plan Vercel possiblement Hobby (précision ±59 min) | Cron | Heure d'envoi imprécise ; vérifier le plan |
| A2 | Seuils par défaut proposés (spec absente) | Seuils | Fausses alertes/alertes manquées ; validation propriétaire |
| A3 | Tarif Web Unlocker ~1,5 USD/1000 requêtes | Bright Data | Coût sous-estimé (négligeable à 4–5 appels/mois) |
| A4 | Format de rang TripAdvisor « #N of M » / FR | Bright Data | Parseur à adapter ; repli « non disponible » |
| A5 | Détails API Claude (en-tête version 2023-06-01, `content[0].text`) | Claude | Appel échoue ⇒ repli ; vérifier à l'implémentation |
| A6 | Détails exacts du flux OAuth compte de service | GSC | Token refusé ⇒ « non disponible » |
| A7 | Zone Bright Data Web Unlocker créée par le propriétaire (nom en env `BRIGHTDATA_ZONE`) | Bright Data | Source indisponible |

## Open Questions (RESOLVED)

Numérotation des plans après révision (08-01 découpé : activation = 08-12, KPI-08 = 08-13).

1. **Seuils d'alerte de la spec ?** Fichier introuvable. RESOLVED → 08-10 (checkpoint:decision du propriétaire, constantes ALERT_THRESHOLDS isolées ; `lowRatingMax` fixé à 3 par D-08).
2. **Plan Vercel (Hobby/Pro) ?** Détermine la précision de 8h. RESOLVED → 08-12 Task 3 étape 2 (vérification du plan et des entrées cron, repli à une seule entrée) ; `shouldSendNow` exige lundi Krabi et heure ≥ 8, robuste à ±59 min.
3. **URL TripAdvisor + zone Bright Data** (et autres accès propriétaire) : RESOLVED → docs/kpi/KPI-SETUP.md (08-04) + saisie par le propriétaire en 08-12 Task 3 étape 1 (noms de variables seulement, jamais en chat).
4. **Destinataires « équipe »** (KPI-05) en mode live : RESOLVED → 08-13 Task 2 (`KPI_REPORT_RECIPIENTS` confirmé au passage en live ; en test, propriétaire seul).
5. **Champs de saisie manuelle** (total avis Google, nouveaux avis, note minimale, note libre) : RESOLVED → docs/kpi/KPI-SETUP.md section 10 (08-04) + point de confirmation propriétaire en 08-12 Task 3 étape 5 (« les 4 champs suffisent » ou liste des champs manquants, traités en gap closure).

## Environment Availability

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| Node/npm/vitest | build, tests | ✓ (repo) | — |
| CRON_SECRET, RESEND_API_KEY, RESTAURANT_NOTIFICATION_EMAIL | cron, email | variables déjà lues par le code ; valeurs non vérifiées en prod | route renvoie 401/500 propre |
| GSC_SERVICE_ACCOUNT_JSON, GSC_SITE_URL | KPI Search Console | ✗ à fournir par le propriétaire | « non disponible » |
| BRIGHTDATA_API_KEY, BRIGHTDATA_ZONE, TRIPADVISOR_URL | rang TripAdvisor | ✗ à fournir | « non disponible » |
| ANTHROPIC_API_KEY, ANTHROPIC_MODEL | rédaction | ✗ à fournir | repli texte sans IA |
| KPI_REPORT_MODE, KPI_REPORT_RECIPIENTS | KPI-08 | à définir | défaut `test` |
| Migration 018 appliquée | stockage | ✗ (après accord, D-06) | cron renvoie 500 propre/dry-run |

Bloquants sans repli : migration 018 appliquée et Resend configuré (pour l'envoi). Les sources externes sont facultatives par conception.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0, env node |
| Config file | `vitest.config.ts` (`tests/**/*.test.ts`, alias `@`) |
| Quick run command | `npx vitest run tests/kpi-*.test.ts` |
| Full suite command | `npm test` (aussi lancé par `npm run build`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KPI-02 | semaine Krabi, bornes, upsert idempotent, source KO ⇒ null | unit + route (fake Supabase, fetch mocké) | `npx vitest run tests/kpi-week.test.ts tests/kpi-cron-route.test.ts` | ❌ Wave 0 |
| KPI-02 | JWT RS256 vérifiable (paire de clés générée), parse SC, parseRank fixtures | unit | `npx vitest run tests/kpi-gsc.test.ts tests/kpi-tripadvisor.test.ts` | ❌ Wave 0 |
| KPI-02 | delta clics /review, changement de mois | unit | `npx vitest run tests/kpi-collect.test.ts` | ❌ Wave 0 |
| KPI-03 | deltas S-1, seuils, null jamais 0 | unit | `npx vitest run tests/kpi-alerts.test.ts` | ❌ Wave 0 |
| KPI-04 | prompt sans PII (liste blanche), JSON invalide ⇒ repli, timeout ⇒ repli | unit | `npx vitest run tests/kpi-narrative.test.ts` | ❌ Wave 0 |
| KPI-05 | email échappé, claim avant envoi, pas de double envoi, échec ⇒ release | route | `npx vitest run tests/kpi-cron-route.test.ts` | ❌ Wave 0 |
| KPI-06 | `/api/kpi` requireAdmin (GUARDED_ROUTE_FILES), page admin sans i18n | unit/static | `npx vitest run tests/admin-routes-guarded.test.ts tests/kpi-admin-wiring.test.ts` | ❌ (ajout) |
| KPI-07 | feedback ⇒ send vers notification ; note ≤3 ⇒ alerte unique ; >3 ⇒ rien | route | `npx vitest run tests/kpi-alerts-immediate.test.ts` | ❌ Wave 0 |
| KPI-08 | mode inconnu ⇒ test ; test ⇒ destinataire unique + [TEST] | unit | `npx vitest run tests/kpi-mode.test.ts` | ❌ Wave 0 |
| (régression) | 018 : préfixe gecko_, numérotation, RLS | static | `npx vitest run tests/migrations.test.ts` | ✅ existant |
| (régression) | cron 401 sans Bearer, vercel.json contient la route | route/static | `npx vitest run tests/kpi-cron-route.test.ts` | ❌ Wave 0 |

Manuel uniquement (justifié) : vrais appels GSC/Bright Data/Claude/Resend (secrets propriétaire, aucune écriture prod), 2 semaines de TEST réelles (KPI-08), validation de lecture du rapport par le propriétaire.

### Sampling Rate
- Par commit : `npx vitest run tests/kpi-*.test.ts`
- Par vague : `npm test` + `npm run lint`
- Gate de phase : suite complète verte avant `/gsd:verify-work`

### Wave 0 Gaps
- [ ] fichiers `tests/kpi-*.test.ts` listés ci-dessus ; fixtures HTML TripAdvisor anonymisées ; helper fake Supabase (réutiliser le patron de `tests/newsletter-cron-route.test.ts`)
- [ ] Aucune installation de framework requise.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | oui (cron) | Bearer `CRON_SECRET`, fail-closed |
| V3 Session Management | non | — |
| V4 Access Control | oui | `requireAdmin` + RLS `gecko_is_admin()`, écriture cron en service role |
| V5 Input Validation | oui | zod sur PUT `/api/kpi` (note 1–5, entiers bornés, `week_start` = lundi), validation sortie IA |
| V6 Cryptography | oui | `node:crypto` RS256 standard ; aucune crypto maison ; clé jamais loggée |

### Known Threat Patterns
| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Appel public du cron | Spoofing | Bearer `CRON_SECRET` |
| Fuite PII vers l'API Claude | Info disclosure | Entrée agrégée en liste blanche, test dédié |
| Injection HTML via sortie IA ou saisie manuelle | Tampering | `escapeHtml`, longueurs bornées |
| Fuite de secrets (clé SA, Bright Data) | Info disclosure | Env serveur uniquement, `tests/no-public-secrets.test.ts` |
| Coût Bright Data non plafonné | DoS financier | 1 requête/exécution, pas de retry, réutilisation de la valeur de la semaine |
| Spam d'alertes | DoS | idempotencyKey + comparaison à l'état précédent |
| SSRF via URL TripAdvisor | Tampering | URL fixée par env, jamais par l'utilisateur |

## Sources

### Primary (HIGH)
- Code du dépôt : `src/app/api/cron/review-invitations/route.ts`, `newsletter-sync/route.ts`, `src/utils/{review-stats,review-report,review-feedback,resend,auth,review-invitations}.ts`, `src/app/api/review/feedback/route.ts`, `supabase/migrations/015-017`, `vercel.json`, `tests/{migrations,admin-routes-guarded}.test.ts`
- https://vercel.com/docs/cron-jobs/usage-and-pricing (limites cron)
- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- https://docs.brightdata.com/scraping-automation/web-unlocker/send-your-first-request

### Tertiary (LOW, à valider)
- API Claude et flux OAuth compte de service : connaissance d'entraînement ; Anthropic docs redirigées vers platform.claude.com, non re-lues.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (aucune dépendance nouvelle ; code lu)
- Architecture: HIGH pour DB/cron/admin ; MEDIUM pour intégrations externes
- Pitfalls: MEDIUM-HIGH
- Seuils: LOW

**Research date:** 2026-10-30
**Valid until:** 2026-11-30 (APIs externes : revérifier à l'implémentation)
