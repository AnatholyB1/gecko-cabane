# Phase 7: Newsletter - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Le restaurant construit une liste de contacts consentants (double opt-in, consentement horodaté avec source, désinscription) et leur envoie des séquences pertinentes (bienvenue, J+1, J+3, retour octobre, saison verte), segmentés par langue, pays, résident/touriste et dernière visite. Couvre NEWS-01 à NEWS-07. Échéance P1 : 1er novembre 2026.

Hors périmètre : textes DE/SV relus (phase 6), comptage des clics d'avis (phase 5), page de preuve sociale (phase 5), portail captif WiFi réel (impossible : le WiFi est protégé par mot de passe donné aux clients).

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planification
- `.planning/workstreams/newsletter/ROADMAP.md` : objectif et critères de succès de la phase 7
- `.planning/workstreams/newsletter/REQUIREMENTS.md` : NEWS-01 à NEWS-07 (N2, N3, N4, N5)
- `.planning/PROJECT.md` : contraintes (échéance 1er nov., PDPA/RGPD, Resend transactionnel + Brevo newsletter, 1 email/mois max hors séquences, accord du propriétaire pour toute action externe, textes DE/SV relus)
- `.planning/phases/01-r-servation-s-re-et-sans-friction/01-CONTEXT.md` : D-11 à D-13 (registre `gecko_marketing_consents`, case non pré-cochée, `/privacy`, double opt-in reporté ici)
- `.planning/phases/04-tunnel-d-avis-et-fiche-google/04-CONTEXT.md` : D-01 à D-09 (réservation honorée, cron Vercel, email d'avis J+1/J+5), D-15 à D-18 (supports imprimables, QR)
- `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/ARCHITECTURE.md`
- `CLAUDE.md` (racine) : règles i18n, Supabase, Tailwind v4, routes API

### Code concerné
- `supabase/migrations/008_reservation_booking.sql` : table `gecko_marketing_consents` et RPC `gecko_create_reservation`
- `supabase/migrations/010_revoke_default_grants.sql`, `011_revoke_anon_consents_dml.sql` : droits sur le registre (aucune écriture anon)
- `supabase/migrations/014_review_invitations.sql` : modèle de migration idempotente ; dernière en date
- `src/utils/resend.ts` : `baseTemplate`, `EmailLocale`, `reviewInvitationEmail`, `escapeHtml`, `getResendClient`
- `src/app/api/cron/` : route(s) cron existante(s) de la phase 4, `vercel.json`
- `src/components/SiteFooter.tsx` : formulaire de pied de page
- `src/app/[locale]/layout.tsx`, `src/app/[locale]/privacy/page.tsx`, `src/utils/seo.ts`
- `src/utils/supabase/server.ts` : `createAdminClient()` (service-role, avec commentaire justificatif)
- `src/utils/reservation-schema.ts`, `src/utils/validation.ts` : validation email et téléphone E.164
- `messages/fr.json`, `messages/en.json`, `tests/i18n.test.ts` (parité des clés)

### Spec d'origine
- `Specs site Gecko Cabane – SEO et conversion.md` (N1–N5) : chemin à localiser par le planificateur

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gecko_marketing_consents` (phase 1) : registre de consentement existant, à étendre plutôt qu'à recréer.
- `src/utils/resend.ts` : gabarit d'email bilingue à étendre avec l'email de confirmation et de bienvenue.
- Cron Vercel + `CRON_SECRET` et sélection des réservations honorées (phase 4) : réutilisés pour la synchro `last_visit_date`.
- `createAdminClient()` pour les écritures du registre (aucune policy d'écriture publique).
- `libphonenumber-js` déjà présent : pays à partir de l'indicatif.
- `/privacy` (phase 1) : à mettre à jour et à versionner avec le texte de consentement.

### Established Patterns
- Routes API : `try/catch` → `{ error }` + code HTTP ; service-role justifié ; pas de stack trace ; validation des entrées.
- Migrations idempotentes numérotées, tables `gecko_`, RLS activé, droits anon révoqués.
- Textes visibles de `[locale]` via next-intl (fr + en), parité testée ; admin en français fixe.
- Pages utilitaires `noindex`, hors sitemap, sans hreflang vers une page non publiée.
- Tests Vitest exécutés avant le build.

### Integration Points
- Nouvelles routes : inscription, confirmation, désinscription, webhook Brevo, cron de synchro.
- Nouveau composant de pop-up monté dans `src/app/[locale]/layout.tsx`.
- Nouvelles pages `[locale]/newsletter` et `[locale]/wifi`.
- Variables d'environnement à créer dans Vercel (accord du propriétaire) : clé Brevo, secret de signature.

</code_context>

<specifics>
## Specific Ideas

- La recette offerte en N3 récompense l'inscription newsletter, pas l'avis (PROJECT.md).
- Le message de désinscription et le consentement doivent citer PDPA B.E. 2562 et RGPD.
- Le mot de passe WiFi affiché sur `/wifi` est lisible par quiconque connaît l'URL : page `noindex`, mot de passe en variable d'environnement ; à signaler au propriétaire (rotation possible du mot de passe).

</specifics>

<deferred>
## Deferred Ideas

- Portail captif WiFi réel : impossible avec un WiFi à mot de passe ; à reconsidérer seulement si le matériel change.
- Plafond « 1 email/mois » codé dans l'application (`last_marketing_email_at`) : à ajouter si Brevo ne suffit pas.
- Vue admin des abonnés et tableau du taux d'inscription : à voir avec le reporting (phase 5) si nécessaire.
- Séquences et Guide gourmand en DE/SV : après relecture humaine (phase 6).
- Fusion de l'email J+1 newsletter avec l'email d'avis : écartée (modifie la phase 4).

</deferred>

---

*Phase: 7-Newsletter*
*Context gathered: 2026-10-17*
