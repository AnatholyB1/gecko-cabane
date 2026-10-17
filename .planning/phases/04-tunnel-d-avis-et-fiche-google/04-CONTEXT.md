# Phase 4: Tunnel d'avis et fiche Google - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Chaque client honoré est invité à laisser un avis Google ou TripAdvisor, et la fiche Google Business Profile est à jour pour la haute saison. Couvre REV-01, REV-02, REV-03, REV-04, OPS-01. Échéance P1 : 1er novembre 2026.

Hors périmètre : comptage des clics sortants par source et tableau de suivi mensuel (REV-06, phase 5), modèle WhatsApp `/review?src=wa` (REV-05, phase 5), champ « Un souci ? » (REV-07, phase 5), preuve sociale sur l'accueil (phase 5), pages et textes DE/SV complets (phase 6), TripAdvisor et posts Google (OPS-02+, phase 6).

</domain>

<decisions>
## Implementation Decisions

### Réservation « honorée » par défaut (REV-02)
- **D-01:** Pas de nouveau statut ni de bascule automatique. « Honorée » est **calculée à l'envoi** : le cron cible les réservations `confirmed` (ou `completed`) dont la date de service est passée. `completed` reste un marquage manuel optionnel ; `no_show` et `cancelled` sont exclues. Aucune migration de statut.
- **D-02:** Éligibles à l'email : **`confirmed` + `completed`** uniquement. Les `pending` jamais confirmées sont exclues (on ne sait pas si le client est venu).
- **D-03:** Fenêtre d'exception = jour du service jusqu'à **J+1 11h (Krabi)** : l'admin peut marquer `no_show` jusque-là (le bouton existe déjà sur les réservations `confirmed`). Après l'envoi J+1, on ne rattrape pas ; l'admin affiche cette échéance.
- **D-04:** L'admin affiche sur la carte de réservation un **badge de suivi** : « invitation envoyée le … », « lien cliqué », « rappel envoyé ». Le tableau mensuel complet reste en phase 5 (REV-06).

### Planification des emails (REV-03)
- **D-05:** **Vercel Cron quotidien** : `vercel.json` (n'existe pas aujourd'hui) avec un cron à **04:00 UTC = 11:00 Krabi (UTC+7, pas d'heure d'été)** vers une route protégée par `CRON_SECRET` (en-tête `Authorization: Bearer`). Sur plan Hobby l'exécution peut dériver dans l'heure (11h00–11h59) : acceptable. Pas de pg_cron ni de service externe.
- **D-06:** Idempotence par **colonnes sur `gecko_reservations`** : `review_email_sent_at`, `review_reminder_sent_at`, `review_clicked_at` (migration 014, idempotente comme 007/008). Mise à jour atomique (réservation de l'envoi avant l'appel Resend) pour qu'une relance du cron n'envoie pas deux fois.
- **D-07:** **Rattrapage borné à J+3** : le J+1 part si la visite date de 1 à 3 jours et qu'aucun envoi n'est enregistré ; au-delà on abandonne. Le rappel **J+5** (un seul) part si le lien n'a pas été cliqué (`review_clicked_at` nul), dans les 2 jours suivant l'échéance.
- **D-08:** Email en **locale de la réservation** (`gecko_reservations.locale`) avec le gabarit Resend existant (`baseTemplate`, `RESEND_FROM_EMAIL` dans `src/utils/resend.ts`). `fr` et `en` fournis ; **`de`/`sv` retombent sur `en`** tant que les textes DE/SV ne sont pas relus (phase 6). Objet court, un seul bouton vers `/review?rid=…&src=email`. Contenu échappé avec `escapeHtml`.
- **D-09:** Un rappel J+5 est aussi supprimé si la réservation passe `no_show`/`cancelled` entre-temps (le filtre d'éligibilité est réévalué à chaque exécution).

### Page /review et traçage du lien (REV-01)
- **D-10:** **Une page, trois chemins** : `/review`, `/avis`, `/bewertung` sont des alias qui mènent à la page localisée `/{locale}/review`. Langue : **`rid` → `locale` de la réservation** (prime sur Accept-Language) ; sans `rid` (QR, WhatsApp) : Accept-Language puis EN. `de` retombe sur EN tant que DE n'est pas publié.
- **D-11:** Page utilitaire, **`noindex`**, absente du sitemap et sans hreflang (jamais de hreflang vers une page non publiée, cf. D-13 phase 2). Pas de contenu SEO.
- **D-12:** Deux boutons, **Google en premier puis TripAdvisor**, ouvrables depuis un mobile. Google : `https://search.google.com/local/writereview?placeid=ChIJozpAo2GUUTARABLcICH3H7I` (Place ID déjà dans `src/utils/seo.ts`). TripAdvisor : lien d'avis `UserReviewEdit` dérivé de l'identifiant d'établissement déjà présent (`g297927-d2413872`), sur le domaine `.com`. Aucun tri préalable des clients (pas de filtrage satisfaits/insatisfaits).
- **D-13:** **Traçage minimal** : le rendu serveur de `/review` avec un `rid` valide pose `review_clicked_at` (ce qui annule le rappel J+5). `rid` inconnu ou mal formé : la page s'affiche normalement sans écriture. Les clics sortants vers Google/TripAdvisor et leur ventilation par source (`email`/`qr`/`wa`) sont comptés en **phase 5 (REV-06)** ; ici le paramètre `src` est seulement conservé dans l'URL.
- **D-14:** `rid` est l'identifiant opaque de la réservation (UUID) : la page n'affiche aucune donnée personnelle, la lecture/écriture du clic passe par un client service-role côté serveur avec commentaire justificatif (RLS), jamais exposé au client.

### QR code et supports imprimables (REV-04)
- **D-15:** Livrer **2 PDF prêts à imprimer** : un insert pour l'**addition** et un **chevalet de table** (A6 plié), chacun avec le QR et un texte court **FR/EN/DE**, marges de coupe incluses.
- **D-16:** QR généré par **script local** (lib `qrcode` en devDependency), SVG vectoriel + PDF **commités** dans le repo (ex. `docs/print/`). URL statique `https://geckocabanerestaurant.com/review?src=qr` ; aucun service tiers ni route API.
- **D-17:** Les textes **DE sont rédigés par Claude et marqués « à relire »** ; le propriétaire les valide avant impression (contrainte PROJECT.md : textes DE relus par un humain).
- **D-18:** Ton **court et chaleureux, sans promesse ni contrepartie** (ex. « Un avis nous aide beaucoup »). Aucune remise, aucun cadeau en échange d'un avis (interdit par Google et TripAdvisor).

### Fiche Google Business Profile (OPS-01)
- **D-19:** Claude **pilote GBP via le navigateur Chrome** (extension claude-in-chrome) connecté au compte du propriétaire, **après son accord explicite et avec validation de chaque modification avant le clic** (contrainte « actions externes » de PROJECT.md). Un dossier de textes prêts à coller est préparé d'abord (catégories, attributs, lien, description) pour que chaque action soit relue.
- **D-20:** Contenu de la mise à jour : catégorie principale « French restaurant », secondaires « Thai », « Fusion », « Wine bar » ; attributs pertinents ; **lien de réservation** `https://geckocabanerestaurant.com/{locale}#reservation` avec `utm_source=google&utm_medium=gbp` ; **lien de la carte** vers `/menu` (HTML déjà en ligne, phase 3).
- **D-21:** Photos : on **réutilise d'abord celles de `public/`** (plats, cheffe, façade). Il n'y en a qu'environ 7 pour 20 demandées : on **publie l'existant** et l'écart jusqu'à 20 photos récentes est noté comme **reste à faire côté propriétaire**, sans bloquer le 1er novembre. Rien d'inventé ni de photo de stock.

### Claude's Discretion
Format exact des PDF (dimensions, mise en page, polices cohérentes avec le site), nom et chemin de la route cron (ex. `/api/cron/review-invitations`), structure du module d'envoi (fonction pure testable pour la sélection des réservations éligibles), clés i18n de la page `/review` et textes des emails FR/EN, forme du badge admin, nom du fichier de migration, schéma exact du lien TripAdvisor d'avis, calcul du fuseau Krabi (UTC+7), choix du rendu des alias (`redirects` Next ou middleware), tests Vitest.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planification
- `.planning/ROADMAP.md` §Phase 4 : objectif, critères de succès
- `.planning/REQUIREMENTS.md` : REV-01..04, OPS-01 ; REV-05..07 (phase 5, hors périmètre)
- `.planning/PROJECT.md` : contraintes (échéance 1er nov., accord du propriétaire pour toute action externe, textes DE relus, conformité PDPA/RGPD)
- `.planning/phases/01-r-servation-s-re-et-sans-friction/01-CONTEXT.md` : migrations 007/008, `locale` sur les réservations, patterns de routes API
- `.planning/phases/02-fondations-seo-techniques/02-CONTEXT.md` : D-13/D-14 (pas de hreflang vers page non publiée)
- `.planning/phases/03-carte-html-et-pages-d-atterrissage-cl-s/03-CONTEXT.md` : `/menu` (lien de la fiche Google)

### Code concerné
- `src/utils/resend.ts` : `baseTemplate`, `customerStatusEmail`, `RESEND_FROM_EMAIL`, `escapeHtml`, `EmailLocale`
- `src/app/api/reservations/route.ts` : création/mise à jour des réservations (statuts)
- `src/app/admin/reservations/page.tsx` : `STATUS_LABELS`, boutons `completed`/`no_show` (badge de suivi à ajouter)
- `src/types/database.ts` : `Reservation`, `ReservationStatus`
- `supabase/migrations/008_reservation_booking.sql` : colonne `locale`, modèle de migration idempotente ; dernière migration actuelle : 013
- `src/utils/seo.ts` : Place ID Google, identifiants TripAdvisor, `buildPageMetadata`
- `src/middleware.ts`, `next.config.ts` : routage i18n et redirections (alias `/review`, `/avis`, `/bewertung`)
- `messages/fr.json`, `messages/en.json`, `tests/i18n.test.ts` (parité des clés)
- `public/` : photos existantes réutilisables pour la fiche Google
- `CLAUDE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/INTEGRATIONS.md`

### Spec d'origine
- `Specs site Gecko Cabane – SEO et conversion.md` (A1–A4) : chemin à localiser par le planificateur

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/resend.ts` : gabarit d'email bilingue (`baseTemplate`, `detailsTable`, `COPY[locale]`), `formatReservationDate`, `getResendClient` ; à étendre avec un `reviewInvitationEmail(locale)`.
- `ReservationStatus` inclut déjà `completed` et `no_show` ; l'admin a déjà les boutons « Terminée » / « Non présenté » sur les réservations `confirmed`.
- `gecko_reservations.locale` (fr/en/de/sv) déjà en base depuis la phase 1.
- `createAdminClient()` (service-role) pour le cron et la pose de `review_clicked_at`, avec commentaire justificatif.
- `src/utils/seo.ts` contient le Place ID Google et l'URL TripAdvisor ; `buildPageMetadata` pour les metadata (ici `noindex`).
- Tests Vitest exécutés avant le build (`tests/*.test.ts`) ; parité i18n testée.

### Established Patterns
- Routes API : `try/catch` → `{ error }` + code HTTP ; service-role seulement avec justification ; jamais de stack trace.
- Migrations idempotentes numérotées (`supabase/migrations/0NN_*.sql`), tables préfixées `gecko_`.
- Textes visibles de `[locale]` via next-intl (fr + en) ; admin en français fixe.
- Pas de `vercel.json` ni de cron existant : création à faire.

### Integration Points
- Nouvelle route cron (ex. `src/app/api/cron/review-invitations/route.ts`) + `vercel.json`.
- Nouvelle page `src/app/[locale]/review/page.tsx` + alias `/review`, `/avis`, `/bewertung`.
- Migration 014 : colonnes `review_email_sent_at`, `review_reminder_sent_at`, `review_clicked_at`.
- Admin : badge de suivi sur la carte de réservation ; rappel de l'échéance no-show.
- Livrables d'impression sous `docs/print/` (+ script de génération du QR).
- Variable d'environnement `CRON_SECRET` à créer dans Vercel (accord du propriétaire).

</code_context>

<specifics>
## Specific Ideas

- Le QR pointe vers `/review?src=qr` ; l'email vers `/review?rid=…&src=email` ; WhatsApp (`src=wa`) viendra en phase 5.
- Fuseau Krabi = UTC+7 sans heure d'été : 11h00 Krabi = 04:00 UTC.
- Pour la fiche Google, un dossier de textes prêts à coller est produit avant toute action dans le navigateur.

</specifics>

<deferred>
## Deferred Ideas

- Comptage des clics sortants (Google/TripAdvisor) par source et tableau mensuel de comparaison : phase 5 (REV-06).
- Modèle de message WhatsApp avec `/review?src=wa` : phase 5 (REV-05).
- Champ « Un souci ? » avec email au propriétaire : phase 5 (REV-07).
- Textes DE/SV des emails et de la page, après relecture humaine : phase 6.
- Table dédiée `gecko_review_invitations` (historique par invitation) : à reconsidérer si la phase 5 en a besoin.
- Complément jusqu'à 20 photos récentes pour la fiche Google : à fournir par le propriétaire.

</deferred>

---

*Phase: 4-Tunnel d'avis et fiche Google*
*Context gathered: 2026-10-17*
