# Phase 1: Réservation sûre et sans friction - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Un touriste étranger réserve en moins de 60 secondes (email obligatoire, SMS supprimé), et le flux de réservation n'expose plus de données personnelles ni n'est exploitable par des abus. Couvre SEC-01 à SEC-06 et RESA-01 à RESA-04. Échéance P1 : 1er novembre 2026.

</domain>

<decisions>
## Implementation Decisions

### Confirmation sans SMS (RESA-01, RESA-03)
- **D-01:** Le SMS est **supprimé du parcours public**. Le formulaire n'a plus d'étape de vérification téléphonique et `POST /api/reservations` n'exige plus `phone_verification_token`.
- **D-02:** Les routes `/api/verify/send` et `/api/verify/check`, la table `gecko_phone_verifications` (retrait par migration) et la dépendance `twilio` sont **supprimées**. Conséquence : SEC-02 ne porte plus que sur la création de réservation (plus d'endpoint SMS à limiter).
- **D-03:** Après envoi, la réservation reste `pending` et le client reçoit l'email « demande reçue » existant (`customerPendingEmail`) ; l'email de confirmation part quand l'admin confirme (comportement actuel de `PUT`). Pas de confirmation automatique.
- **D-04:** Validation serveur complète du créneau : `party_size` plafonné à **40**, refus des jours fermés (mardi) et des heures hors `opening_hours`/`special_hours`, et **capacité par créneau** (somme des couverts déjà réservés sur le créneau ≤ 40). *Note : va au-delà du texte des exigences (cf. CONCERNS « capacity not enforced ») ; décision explicite de l'utilisateur.*
- **D-05:** Téléphone : sélecteur d'indicatif pays (pré-sélectionné selon la locale) + normalisation/validation E.164 côté serveur avec `libphonenumber-js` (`normalizePhone`, `isE164Phone` dans `src/utils/validation.ts`). Le téléphone reste obligatoire, il ne sert plus qu'à joindre le client. Corrige le bug de normalisation de CONCERNS.
- **D-06:** L'email est **obligatoire** (RESA-02) ; validation de format côté client et serveur.

### Anti-abus (SEC-02)
- **D-07:** Compteurs de limitation stockés dans une **table Supabase** (`gecko_rate_limits` + fonction SQL atomique), versionnée dans les migrations. Pas d'Upstash ni de règle Vercel Firewall seule.
- **D-08:** Seuils sur `POST /api/reservations` : **5 / heure par IP**, **3 / jour par email** et **3 / jour par téléphone**. Dépassement → HTTP 429 `{ error }` avec message FR/EN clair invitant à utiliser WhatsApp.
- **D-09:** Anti-bot : **honeypot + délai minimum de remplissage** vérifié côté serveur. Pas de CAPTCHA (Turnstile pourra s'ajouter si un abus apparaît).
- **D-10:** Le jeton de confirmation doit être consommé/validé de façon atomique là où il subsiste ; plus applicable puisque l'OTP disparaît — ne pas recréer l'ancien mécanisme.

### Consentement et fin du lookup (RESA-02, SEC-01)
- **D-11:** Consentement newsletter dans une **table dédiée `gecko_marketing_consents`** : email, consent (bool), langue, source (`reservation_form`), `consented_at`, version du texte de consentement. Réutilisable par la phase 7 (Brevo).
- **D-12:** La case « Recevoir nos actualités et offres » est **non pré-cochée**, avec lien vers la politique de confidentialité. Le **double opt-in** est reporté à la phase 7 (NEWS-01) ; la phase 1 enregistre seulement le consentement brut.
- **D-13:** Création d'une page **`/privacy`** minimale FR/EN (données collectées, finalité, PDPA B.E. 2562 / RGPD, contact, désinscription). Texte rédigé par Claude, **à valider par le propriétaire avant mise en ligne**.
- **D-14:** `GET /api/reservations?phone=` est **supprimé** (aucun appelant front). Le `GET` devient admin-only avec vérification gecko-admin. Pas de lien de gestion client.

### Bouton WhatsApp flottant (RESA-04)
- **D-15:** Numéro **+66 81 958 5945** (`wa.me/66819585945`), en variable d'environnement publique, avec **message pré-rempli par langue** via next-intl (fr/en). À confirmer que ce numéro est bien actif sur WhatsApp.
- **D-16:** Bouton rond 56 px **en bas à droite**, label au survol sur desktop, `aria-label` i18n, vert WhatsApp standard. Monté dans `src/app/[locale]/layout.tsx` (toutes les pages publiques, jamais l'admin), avec marge de sécurité pour ne pas masquer le bouton de soumission sur mobile.

### Claude's Discretion
- **SEC-03** : helper partagé `requireAdmin()` s'appuyant sur `isGeckoAdmin` appliqué à toutes les routes API mutantes/admin (reservations GET/PUT/DELETE, menu, hours, tables, settings, announcement, upload).
- **SEC-04** : migrations 007+ reproduisant le schéma réel `gecko_*` (tables, RLS, `gecko_admins`, `gecko_is_admin()`) ; nécessite l'accès à la base réelle (dump) ; mise à jour de `CLAUDE.md` et `src/types/database.ts`.
- **SEC-05** : renommer `NEXT_PUBLIC_RESA_HOOK_URL` / `NEXT_PUBLIC_RESA_VALIDATION_HOOK_URL` en variables serveur ; la rotation des URLs et la mise à jour des variables Vercel exigent l'accord du propriétaire.
- **SEC-06** : déclarer `zod` dans `package.json`.
- Durcissements voisins issus de CONCERNS (liste blanche des champs du `PUT`, `escapeHtml` dans les emails, erreurs génériques) : à intégrer au plan si elles touchent les fichiers modifiés.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planification
- `.planning/ROADMAP.md` §Phase 1 — objectif, critères de succès
- `.planning/REQUIREMENTS.md` — SEC-01..06, RESA-01..04
- `.planning/PROJECT.md` — contraintes (échéance 1er novembre 2026, conformité PDPA/RGPD, accord du propriétaire pour toute action externe)

### Analyse du code
- `.planning/codebase/CONCERNS.md` — PII sur GET ?phone, absence de rate limit, migrations désynchronisées, mass assignment, injection HTML dans les emails
- `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/INTEGRATIONS.md`
- `CLAUDE.md` — règles i18n (clés fr + en), Tailwind v4, Supabase, routes API

### Spec d'origine
- `Specs site Gecko Cabane – SEO et conversion.md` — référencée par REQUIREMENTS.md (R1, N1) ; chemin à localiser par le planificateur

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/validation.ts` : `validateReservationFields`, `isPartySizeValid`, `isReservationDateValid`, `normalizePhone`, `isE164Phone` — à étendre (capacité, jours fermés).
- `src/utils/resend.ts` : `customerPendingEmail`, `restaurantNotificationEmail`, `customerStatusEmail`, `getResendClient`.
- `src/utils/supabase/server.ts` : `createClient`, `createAdminClient`, `isGeckoAdmin`.
- `src/components/ReservationForm.tsx` (550 lignes) : contient l'étape OTP à retirer et le champ email (aujourd'hui facultatif).
- `tests/api-validation.test.ts`, `tests/i18n.test.ts` : le build exécute `vitest run`, la parité des clés fr/en est testée.

### Established Patterns
- Routes : `try/catch` → `{ error }` + code HTTP ; Supabase service-role seulement avec commentaire justificatif.
- Tables préfixées `gecko_` (projet Supabase partagé) ; admin via `gecko_admins` / `gecko_is_admin()`.
- Textes visibles de `src/app/[locale]/` via next-intl dans `messages/fr.json` et `messages/en.json`.

### Integration Points
- `src/app/api/reservations/route.ts` (GET/POST/PUT/DELETE) : cœur de la phase.
- `src/app/[locale]/layout.tsx` : point de montage du bouton WhatsApp.
- `src/middleware.ts` : laisse passer `/api` ; la garde admin des routes API se fait dans les handlers.
- `supabase/migrations/` : 001–006 non alignées sur le schéma réel (préfixe `gecko_`).

</code_context>

<specifics>
## Specific Ideas

- Message 429 : inviter à réserver via WhatsApp en cas de blocage (wifi d'hôtel partagé).
- Le numéro WhatsApp reste le contact principal pour modifier/annuler une réservation (pas de lien de gestion).

</specifics>

<deferred>
## Deferred Ideas

- Lien de gestion/annulation signé dans l'email — nouvelle capacité, hors phase 1.
- Double opt-in par email — phase 7 (NEWS-01).
- Cloudflare Turnstile — à ajouter seulement si un abus apparaît.
- Mesure « réservation envoyée » / « clic WhatsApp » et champ source — phase 5 (RESA-06, KPI-01).
- Route MCP `src/app/api/mcp/route.ts` qui interroge des tables non préfixées (RESEARCH Pitfall 10) — dette notée, hors phase 1 (décision orchestrateur lors de la planification).

</deferred>

---

*Phase: 1-Réservation sûre et sans friction*
*Context gathered: 2026-10-16*
