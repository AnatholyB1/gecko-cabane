# Phase 5: Conversion et mesure - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Le site rassure (preuve sociale, « Qui sommes-nous », « Comment venir », modes de paiement), convertit mieux sur mobile (LINE, PageSpeed ≥ 85, LCP < 2,5 s en 4G) et mesure d'où viennent réservations et avis (analytics, champ source, comptage des visites `/review` par source, « Un souci ? »). Couvre SEO-08, MENU-03, RESA-05, RESA-06, CONV-01, CONV-02, CONV-03, REV-05, REV-06, REV-07, KPI-01. Échéance P1 : 1er novembre 2026.

Hors périmètre : pages et textes DE/SV complets (phase 6), newsletter Brevo (phase 7), TripAdvisor/posts Google (phase 6), double opt-in (phase 7).

</domain>

<decisions>
## Implementation Decisions

### Analytics et événements (KPI-01, RESA-06)
- **D-01:** **Plausible** (pas GA4) : sans cookies, donc **pas de bandeau de consentement** requis, script léger (compatible PageSpeed ≥ 85).
- **D-02:** **Plausible Cloud** (abonnement ~9 €/mois). La création du compte et le paiement sont une **action du propriétaire** (contrainte « actions externes ») ; le domaine suivi est `geckocabanerestaurant.com`. Script servi via un **rewrite Vercel/Next** (proxy) pour limiter les bloqueurs. Le code doit rester inerte (aucune erreur) tant que le domaine n'est pas configuré.
- **D-03:** Événements personnalisés : **« réservation envoyée »** (formulaire) et **« clic WhatsApp »** (bouton flottant), plus un événement pour le **clic LINE** ; la propriété `src`/locale est jointe quand disponible. Noms d'événements stables, centralisés dans un utilitaire.

### Champ « source » de la réservation (RESA-06)
- **D-04:** Colonne **`source`** sur `gecko_reservations` (migration 015, idempotente comme 007/008/014). Valeurs : `site`, `whatsapp`, `telephone`, `sans_reservation`. Le formulaire du site pose **`site`** automatiquement (non falsifiable côté serveur : le POST public ne peut écrire que `site`).
- **D-05:** Les `utm_source`/`ref` présents à l'arrivée sont **mémorisés en session** et joints à la réservation (ex. `google/gbp` via le lien GBP de la phase 4) pour distinguer l'origine d'un `site`. Colonne(s) dédiée(s), nullable.
- **D-06:** **Saisie admin** : un sélecteur de source dans l'admin réservations permet de saisir les réservations prises par WhatsApp, téléphone ou les clients sans réservation. Changement via `PUT` avec liste blanche de champs.

### Comptage des visites /review et tableau mensuel (REV-06)
- **D-07:** Chaque visite de `/review` est **comptée par source** (`email` via `rid`, `qr`, `wa`, `site`, inconnue) dans une table dédiée **`gecko_review_clicks`** (migration, RLS admin via `gecko_is_admin()`, écriture par client service-role côté serveur avec commentaire justificatif, comme `markReviewClicked`).
- **D-08:** Les **clics sortants vers Google/TripAdvisor** sont aussi comptés, par source, via une route de redirection comptée (la page `/review` reste `noindex` et sans donnée personnelle ; cf. D-13/D-14 de la phase 4).
- **D-09:** Page admin **« Avis »** (français fixe) : tableau mensuel visites/clics par source + **saisie manuelle** des totaux Google et TripAdvisor du mois pour comparer l'évolution. Aucun appel API Google/TripAdvisor.
- **D-10:** Le **modèle de message WhatsApp** (REV-05) se trouve sur cette page « Avis » : texte pré-rempli FR/EN/DE avec le lien `https://geckocabanerestaurant.com/review?src=wa`, boutons « Copier » et « Ouvrir WhatsApp » (`wa.me`). Le texte **DE est marqué « à relire »**. Pas de bouton sur la carte de réservation.

### Preuve sociale (CONV-01)
- **D-11:** Source des avis : Claude prépare des **candidats copiés fidèlement de vrais avis** Google/TripAdvisor (avec accord pour toute consultation externe) ; le **propriétaire choisit et valide 3-4 avis**. Jamais d'avis inventé ni réécrit ; prénom + pays exacts.
- **D-12:** Stockage dans un **fichier de configuration** (`src/utils/social-proof.ts` ou équivalent) : note 4,7, 1 062 avis, badge Travellers' Choice (année à vérifier), avis avec texte, prénom, pays, source et lien. Mise à jour = commit. Pas de table ni d'API Places.
- **D-13:** Les avis sont affichés **dans leur langue d'origine** (pas de traduction), avec indication de la langue ; libellés d'interface via next-intl (fr/en).
- **D-14:** **`aggregateRating` (4,7 / 1 062) est réintroduit** dans le JSON-LD Restaurant (retiré en phase 2 D-07 faute d'avis réels affichés ; la condition est maintenant remplie). Les valeurs doivent correspondre exactement à celles affichées.
- **D-15:** Placement : **section dédiée juste avant `#reservation`**, pas dans le hero (n'alourdit pas le LCP). Contient badge note + Travellers' Choice, 3-4 avis et le lien **« Laisser un avis »** vers `/review?src=site`.

### Qui sommes-nous (CONV-02)
- **D-16:** On **enrichit la section `#about` existante** (portrait de Jariya) avec le propriétaire, la photo du couple et l'origine du lieu : pas de nouvelle section ni d'ancre de navigation.
- **D-17:** La **photo du couple est fournie plus tard** par le propriétaire ; la section sort avec le portrait de Jariya seul et un emplacement prêt à recevoir la photo (aucun faux visuel).
- **D-18:** Le **texte du propriétaire et de l'origine du lieu** est tiré de **l'existant vérifiable** (code, fiche Google/TripAdvisor, site actuel) ; tout ce qui n'est pas vérifiable est signalé « à compléter » pour le propriétaire, **sans rien inventer**. FR/EN maintenant, DE en phase 6.

### Comment venir (CONV-03)
- **D-19:** Le bloc est intégré à la **section `#contact` existante** (adresse et lien maps déjà présents), sans nouvelle ancre : liste des trajets (Ao Nang 20 min en taxi, songthaew 50 bahts, 3 min du Walking Street, 15 min de Chao Fah Pier), carte et **bouton d'itinéraire Google Maps** toujours visible.
- **D-20:** **Carte iframe chargée au clic** : aperçu statique avec bouton « Afficher la carte » ; l'iframe Google Maps n'est montée qu'après l'interaction (aucun impact LCP/PageSpeed, respect de la vie privée).

### Paiement, LINE et « Un souci ? » (MENU-03, RESA-05, REV-07)
- **D-21:** Une **ligne sobre** « Espèces, cartes, PromptPay — frais de 5 % pour les paiements par carte » sur la **carte (`/menu`)** et sous le **formulaire de réservation**, via une **clé i18n partagée**. Pas d'incitation promotionnelle.
- **D-22:** **Bouton LINE** : le propriétaire fournit l'ID/URL LINE (variable d'environnement publique `NEXT_PUBLIC_LINE_URL`). Bouton vert LINE **empilé au-dessus du bouton WhatsApp flottant**, même logique de masquage mobile. **Tant que la variable n'est pas définie, le bouton n'apparaît pas** (jamais de bouton mort).
- **D-23:** **« Un souci ? » sur `/review`** : message (≈ 1 000 caractères max) + email **facultatif**, affiché **en même temps que les boutons d'avis, sans filtrage**. `POST` dédié avec validation, **honeypot + limite par IP** (table de rate-limits existante, migration 009), email **Resend au propriétaire** mentionnant la source (`src`/`rid`). **Rien n'est stocké en base** (pas d'historique admin).

### Claude's Discretion
- **SEO-08 / performance** : conversion du hero et des images en WebP/AVIF via `next/image`, `loading="lazy"` hors écran, polices, chargement différé du script Plausible ; cible PageSpeed mobile ≥ 85 et LCP < 2,5 s en 4G, à mesurer avant/après.
- Schéma exact des tables (`gecko_review_clicks`, colonnes source/UTM), route de redirection comptée, noms d'événements, anti-bot et rate limits précis, structure des composants (carrousel vs liste d'avis), design du bloc LINE/WhatsApp empilé.
- Mise en page FR/EN des nouvelles sections avec les tokens `gc-*`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planification
- `.planning/workstreams/conversion/ROADMAP.md` — objectif, critères de succès de la phase 5
- `.planning/workstreams/conversion/REQUIREMENTS.md` — SEO-08, MENU-03, RESA-05, RESA-06, CONV-01..03, REV-05..07, KPI-01
- `.planning/PROJECT.md` — contraintes (échéance 1er novembre 2026, PDPA/RGPD, accord du propriétaire pour toute action externe, aucune affirmation non vérifiable dans le schema)
- `CLAUDE.md` — règles i18n (clés fr + en), Tailwind v4, Supabase, routes API

### Décisions des phases précédentes
- `.planning/phases/01-r-servation-s-re-et-sans-friction/01-CONTEXT.md` — D-15/D-16 bouton WhatsApp, D-07/D-08 rate limits, D-09 honeypot, mesure/source renvoyées à la phase 5
- `.planning/phases/02-fondations-seo-techniques/02-CONTEXT.md` — D-07 `aggregateRating` retiré jusqu'à avis réels affichés, D-04/D-05 JSON-LD rendu serveur
- `.planning/phases/04-tunnel-d-avis-et-fiche-google/04-CONTEXT.md` — D-10..D-14 page `/review` (alias, `rid`, `src`, noindex, `review_clicked_at`), comptage par source et tableau mensuel renvoyés à la phase 5, D-20 lien de réservation GBP avec UTM

### Analyse du code
- `.planning/codebase/CONVENTIONS.md`, `STRUCTURE.md`, `ARCHITECTURE.md`, `INTEGRATIONS.md`, `CONCERNS.md`

### Spec d'origine
- `Specs site Gecko Cabane – SEO et conversion.md` — référencée par PROJECT.md (IDs T7, C2, C3, C4, R1, R2, A5, A6) ; **introuvable dans le worktree**, à localiser par le planificateur (sinon se fier à REQUIREMENTS.md)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/WhatsAppButton.tsx` + `src/utils/whatsapp.ts` : bouton flottant 56 px avec masquage mobile via `#reservation-submit` ; à étendre avec LINE et l'événement « clic WhatsApp ».
- `src/app/[locale]/review/page.tsx` : page `/review` (rid, Google/TripAdvisor, noindex) ; reçoit « Un souci ? » et le comptage des visites par `src`.
- `src/utils/review-tracking.ts` (`markReviewClicked`), `src/utils/review-links.ts` (`isReviewToken`), `src/utils/seo.ts` (`googleReviewUrl`, `tripAdvisorReviewUrl`, `SAME_AS`, `LOCALES`, Place ID).
- `src/components/RestaurantJsonLd.tsx` : JSON-LD serveur où réintroduire `aggregateRating`.
- `src/components/ReservationForm.tsx`, `src/app/api/reservations/route.ts` : point d'ajout de `source`/UTM et de l'événement « réservation envoyée ».
- `src/app/api/cron/review-invitations/` et migrations `009_rate_limits.sql`, `014_review_invitations.sql` : patterns de migration idempotente, rate limit, service-role commenté.
- `src/utils/resend.ts` : client et gabarit d'email pour « Un souci ? ».
- `src/app/[locale]/page.tsx` : sections `#about` (portrait `chef-jariya.jpg`), `#hours`, `#contact` (lien maps), hero avec `<img src="/hero-bg.jpg">` non optimisée (cible SEO-08).

### Established Patterns
- Textes visibles de `src/app/[locale]/` via next-intl, clés dans `messages/fr.json` et `messages/en.json` (parité testée par `tests/i18n.test.ts`) ; admin en français fixe, sans i18n.
- Routes API : validation des entrées, `{ error }` + code HTTP, service-role uniquement avec commentaire justificatif ; admin protégé par `requireAdmin()`.
- Tables `gecko_*` avec RLS `gecko_is_admin()` ; migrations `NNN_name.sql` séquentielles (dernière : 014).
- `npm run build` exécute `vitest run` avant `next build` : tests dans `tests/*.test.ts`.

### Integration Points
- `src/app/[locale]/layout.tsx` : montage du script Plausible et des boutons flottants.
- `next.config.ts` : rewrite proxy Plausible, formats d'images.
- `src/app/admin/` : nouvelle page « Avis », sélecteur de source dans `reservations/`.
- `src/app/[locale]/menu/` : mention paiement sur la carte.

</code_context>

<specifics>
## Specific Ideas

- Message 429 existant : WhatsApp reste le contact de repli ; LINE s'y ajoute pour les Thaïlandais.
- Le lien « Laisser un avis » de la preuve sociale pointe vers `/review?src=site` pour que le tableau mensuel distingue aussi l'origine « site ».
- Toute dépendance externe (compte Plausible, ID LINE, photo du couple, choix des avis) doit **dégrader proprement** : rien de cassé ni de visible tant que la donnée n'est pas fournie.

</specifics>

<deferred>
## Deferred Ideas

- Historique des messages « Un souci ? » consultable dans l'admin — non retenu ; à reprendre si le volume le justifie.
- Avis gérés depuis l'admin ou via l'API Google Places — non retenu pour tenir le 1er novembre.
- Bouton « Envoyer par WhatsApp » sur chaque réservation (invitation d'avis) — hors REV-05.
- Traduction des avis — non retenue (authenticité).
- Texte DE de la section « Qui sommes-nous » et des nouveaux blocs — phase 6.

</deferred>

---

*Phase: 5-Conversion et mesure*
*Context gathered: 2026-10-17*
