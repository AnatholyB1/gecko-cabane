# Phase 5 (Conversion et mesure) - Audit independant v1.0

Branche `audit/v1.0-phase5`, base `master` (c12faf4). Date 2026-10-30. Lecture seule sur `src/` et `messages/`.
Methode : lecture du code de master (05-PHASE-REPORT.md non cru), puis `vitest run` (77 fichiers, 1013 tests OK, 1 skipped), `tsc --noEmit` (0 erreur), `eslint src` (0 erreur, 5 avertissements deja connus), script de parite des cles messages. Aucun appel reseau, aucune ecriture en base, aucun email/SMS/WhatsApp.

Format : `SEV | fichier:ligne | probleme | correctif`

## Compte par severite

HIGH 3, MEDIUM 5, LOW 7, INFO 3.

## Passe 1 - Revue de code (correction, i18n, Tailwind v4)

HIGH | src/utils/social-proof.ts:32,34,72 + src/utils/seo.ts:359-392 | `aggregateRating` (4,7 / 1 062, attribue a Google) est emis dans le JSON-LD Restaurant avec `SHOW_AGGREGATE_RATING = true`, alors que les 3 avis affiches sont tous TripAdvisor et que les chiffres sont des constantes figees a la main, non verifiables par le code. Cela viole la contrainte projet "aucune affirmation non verifiable dans le schema (notes, avis)" et le propre commentaire du fichier (l.7-10) sur la politique d'extraits d'avis de Google (balisage auto-controle, risque d'action manuelle). | Passer `SHOW_AGGREGATE_RATING` a `false` tant que le proprietaire n'a pas confirme les chiffres par ecrit ET accepte le risque (OWNER-CHECKLIST section 5). Garder le badge visuel, retirer seulement le balisage.

HIGH | src/i18n/request.ts:28-32 ; scripts/translation-scope.json:2-9 ; src/utils/seo.ts:27 | La page d'accueil est publiee en de/sv (PUBLISHED_PAGES), mais les espaces de noms ajoutes en phase 5 `socialProof` (13 cles), `payment` (1), `line` (2), `reviewFeedback` (14) sont absents de de.json et sv.json (192 cles manquantes au total, dont privacy 53, newsletter 44, wifi 10). Ils retombent silencieusement sur l'anglais (deepMerge). Le bloc de preuve sociale, la ligne de paiement, le libelle LINE et le formulaire "Un souci ?" s'affichent donc en anglais sur la page DE/SV "publiee". Ces espaces ne figurent pas dans `translation-scope.json`, donc la porte `i18n-publication-gate` (validation ecrite + cles completes) ne les couvre pas : la regle "textes DE/SV relus par un humain" est contournee par construction. | Ajouter `socialProof`, `payment`, `line` au scope "home" et `reviewFeedback` au scope "review" dans translation-scope.json ; faire traduire/relire DE et SV ; ou retirer de/sv de PUBLISHED_PAGES pour l'accueil tant que ce n'est pas fait.

HIGH | (criterion 3) SEO-08 | PageSpeed mobile mesure a 79 / LCP 4,4 s par la phase elle-meme (05-PHASE-REPORT.md, "Restant"), contre l'objectif >= 85 et LCP < 2,5 s. Critere de succes 3 non atteint. Aucune mesure post-correction dans le depot. | Voir passe 3 ; mesurer sur la preversion apres correctifs (poids de la police, hero `fill` + `preload` avec `opacity .28`, `<img>` botaniques l.154/567/750 de `[locale]/page.tsx`).

MEDIUM | src/utils/review-feedback.ts:31 ; src/app/api/review/feedback/route.ts:51-53 | `locale` du formulaire "Un souci ?" accepte seulement fr/en (`.catch('fr')`). Un visiteur DE ou SV (pages /review de/sv publiees) est etiquete "Langue : fr" dans l'email au proprietaire et recoit le message 429 en francais. | Accepter `['fr','en','de','sv']` dans le schema, afficher l'anglais pour de/sv ; le proprietaire voit la vraie langue.

MEDIUM | src/app/api/reservations/route.ts:147 | Message 429 : francais si `r.locale === 'fr'`, anglais sinon : coherent mais ne couvre pas de/sv (acceptable car fallback EN). Signale pour memoire avec le point precedent. | Aucun si fallback EN assume.

MEDIUM | src/utils/social-proof.ts:49 | Un des 3 avis affiche comme prenom est "Jean-Louis305" (pseudonyme TripAdvisor avec chiffres), pas un prenom ; D-11 exige "prenom + pays". Verbatim respecte mais l'affichage "nom" est un identifiant de compte. | Faire confirmer par le proprietaire ou afficher "Jean-Louis" apres accord ecrit.

LOW | src/components/ReservationForm.tsx:296 ; src/components/ReviewFeedbackForm.tsx:164 | Le lien WhatsApp de repli (erreur de reservation, "Un souci ?") n'appelle pas `track(EVENTS.whatsappClick)`. KPI-01 ("clic WhatsApp") ne compte que le bouton flottant. | Ajouter `onClick={() => track(EVENTS.whatsappClick, {locale, src:'fallback'})}` ou documenter la limite.

LOW | src/utils/social-proof.ts:36 | `travellersChoice: { awarded: true, year: null }` : badge affiche sans annee ; l'attribution du badge n'est pas verifiable dans le code (a confirmer par le proprietaire, OWNER-CHECKLIST 4). | Confirmer avant mise en production, sinon `awarded:false`.

LOW | src/app/api/reservations/route.ts:283-297 (PUT) | Aucune machine d'etats : un admin peut renvoyer `confirmed` plusieurs fois et chaque appel renvoie l'email de confirmation au client. | Ne notifier que si le statut change effectivement.

INFO | Tailwind v4 | Aucun `bg-[var(--x)]` dans src (grep). Tokens `gc-line`, `gc-whatsapp` definis dans globals.css:17-20,57-60. Admin utilise `bg-(--primary)`. Conforme.

INFO | messages | EN complet (532 cles). FR n'a pas 55 cles EN-only (gettingHere, wineBeer, 4 meta) : voulu (pages publiees en EN seul). Aucun placeholder `{x}` incoherent entre langues.

## Passe 2 - Securite

Points verifies sains : cible `/api/review/go` fixe (pas d'open redirect, route:10-14) ; `requireAdmin` sur stats / manual / reservations GET-PUT-DELETE ; `source` non falsifiable (absent du schema zod, defaut DB, migration 015) ; manual route : allowlist champ par champ, `site` exclu, client cookie sous RLS ; migrations 015/016 : RLS active, RPC `gecko_review_click_hit` reservee a service_role ; echappement HTML et sujet sans retours ligne dans l'email "Un souci ?" ; cle de limitation hachee HMAC, aucune IP brute stockee ; service-role uniquement dans des fichiers serveur (review-stats.ts importe seulement cote serveur, test de cablage present) ; pas de stack trace renvoyee ; `no-public-secrets` passe.

MEDIUM | src/utils/rate-limit.ts:120-124,44,86 | Le limiteur "Un souci ?" (comme reservations/newsletter) est fail-open : sans `RATE_LIMIT_SECRET`, sans IP, ou sur erreur RPC, aucune limite. Le formulaire declenche un email Resend vers le proprietaire a chaque envoi : une absence de variable ou d'IP permet l'inondation de la boite et la consommation du quota Resend. Seul garde-fou restant : honeypot + delai 3 s (triviaux a contourner par un script). | Ajouter un plafond global (cle fixe `feedback:global`, ex. 30/h) qui s'applique aussi sans IP ; alerter (Sentry deja appele) et verifier `RATE_LIMIT_SECRET` en production (OWNER-CHECKLIST 1).

MEDIUM | src/app/api/review/go/route.ts:23 ; src/app/[locale]/review/page.tsx:50 | Aucune limitation sur `/api/review/go` et sur les visites `/review` : chaque requete fait un RPC service-role (ecriture) ; la route `go` attend (`await`) l'ecriture avant la redirection, donc une lenteur DB retarde l'utilisateur. Les compteurs REV-06 sont gonflables par bots, prefetch et `rid` quelconque au format UUID (la source devient "email" pour n'importe quel UUID bien forme, review-links.ts normalizeReviewSource). Accepte et documente pour les bots, mais l'attribution "email" est triviale a fausser et la metrique REV-06 est donc indicative seulement. | Faire `after(() => recordReviewHit(...))` dans `go` (comme dans la page) ; ne creditez "email" que si le `rid` existe en base (ou labellisez la metrique "indicative").

LOW | src/utils/rate-limit.ts:22-29 | `getClientIp` retombe sur `x-real-ip` puis `x-forwarded-for` (falsifiables) si `x-vercel-forwarded-for` est absent. Sur Vercel le premier est toujours pose par la plateforme, donc sans effet en production ; en dehors de Vercel (preview locale, autre hebergeur) le contournement est trivial. | Ne retomber sur les autres en-tetes que si `process.env.VERCEL` est absent et le documenter.

LOW | src/app/api/reservations/manual/route.ts:47 ; review-invitations cron | Une reservation manuelle saisie avec email recoit ensuite l'invitation d'avis J+1 / J+5 sans que le client ait vu de formulaire ni de consentement ; sources `telephone`/`sans_reservation` incluses. Email transactionnel/legitime interet probable, mais non trace dans la politique de confidentialite (la politique decrit le formulaire web). | Mentionner l'origine telephone/WhatsApp dans la politique ou exclure `sans_reservation` du cron d'avis.

LOW | src/components/PlausibleScript.tsx ; next.config.ts:rewrites | Plausible charge sur toutes les locales, y compris de/sv dont la politique (privacy) n'est pas publiee (PUBLISHED_PAGES privacy = fr,en). Le lien /privacy de/sv retombe sur l'anglais. Mesure sans cookies, risque faible mais information incomplete en DE/SV. | Publier la politique en DE/SV avant d'activer `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID`, ou la servir en EN avec `noindex` explicite.

LOW | src/components/MapEmbed.tsx:25 | Iframe Google Maps chargee au clic (bien), mais `referrerPolicy="no-referrer-when-downgrade"` envoie l'URL complete (avec `?utm_*`) a Google. | Utiliser `strict-origin-when-cross-origin`.

INFO | Webhooks | Aucun webhook ajoute en phase 5 (le webhook Resend appartient a la phase newsletter, hors perimetre). Verification de signature non auditee ici.

## Passe 3 - Verification "goal-backward" des criteres de succes (ROADMAP.md Phase 5)

| # | Critere | Verdict | Preuve code |
|---|---------|---------|-------------|
| 1 | Preuve sociale au-dessus de la reservation : note 4,7, Travellers' Choice, avis reels prenom+pays, lien "Laisser un avis" | PARTIEL | `SocialProof` rendu l.561 avant `#reservation` l.564 de `[locale]/page.tsx`. Note, badge (sans annee), 3 avis TripAdvisor mot pour mot, lien `/review?src=site` presents. Reserves : les chiffres et le badge sont des constantes non verifiees (HIGH 1), chrome en anglais en DE/SV (HIGH 2), "Jean-Louis305" n'est pas un prenom. |
| 2 | "Qui sommes-nous" et "Comment venir" (carte integree, bouton itineraire) visibles | PARTIEL | `#contact` : `googleDirectionsUrl()` l.631 et `MapEmbed` (clic) l.660 presents. `#about` existe mais `COUPLE_PHOTO = null` (about-content.ts:5) : pas de photo du couple, prenom du proprietaire seulement dans une legende conditionnee a la photo. CONV-02 est d'ailleurs decoche dans REQUIREMENTS.md, et le texte DE "prevu en phase 6". Les temps de trajet (20 min, 50 baht, 3 min, 15 min) sont marques a valider. |
| 3 | Mobile PageSpeed >= 85, LCP < 2,5 s en 4G | NON ATTEINT | Mesure phase : 79 / 4,4 s. Aucune mesure posterieure. Impossible a prouver ici (pas de PSI). |
| 4 | Paiement + frais carte visibles sur carte ET reservation ; bouton LINE present | PARTIEL | `payment.note` ("Espèces, cartes, PromptPay - frais de 5 %") rendu l.587 (accueil, sous la reservation) et dans `menu/page.tsx:31`. Bouton LINE (`FloatingContact`) rendu seulement si `NEXT_PUBLIC_LINE_URL` valide : tant que la variable n'est pas fournie (OWNER-CHECKLIST 3) le bouton est absent en production. Note de paiement en anglais en DE/SV. |
| 5 | Champ source en base ; evenements "reservation envoyee" et "clic WhatsApp" mesures ; clics `/review` comptes par source ; "Un souci ?" envoie un email au proprietaire | PARTIEL | Code present et teste : migration 015 (`source`, `utm_*`), `Reservation Sent` (ReservationForm:224), `WhatsApp Click` (FloatingContact:92), compteurs 016 + `go`/page, feedback -> Resend. Rien n'est actif tant que : 015/016 ne sont pas appliquees, `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` n'est pas fourni (le proxy `rewrites` est fige au build), l'email de test REV-07 n'est pas recu. REV-07 reste decoche dans REQUIREMENTS.md. |

Exigences : KPI-01, RESA-05, RESA-06, CONV-01, CONV-03, MENU-03, REV-05, REV-06 sont coches et leur code existe ; SEO-08, CONV-02 et REV-07 ne le sont pas, ce qui concorde avec la lecture du code.

## Ce que je n'ai pas pu prouver

- Que les migrations 015 et 016 sont appliquees en production (aucune lecture de base). Sans 015 : `source`/UTM perdus (la mise a jour UTM est best effort) et l'insertion manuelle echoue ; sans 016 : compteurs muets et `/admin/avis` en erreur.
- Qu'un email "Un souci ?" arrive reellement (REV-07), que Resend est configure, et que `RATE_LIMIT_SECRET` est defini en production.
- Que Plausible recoit les evenements (pas de compte, variable absente) ni que le proxy `/gcm` fonctionne apres build.
- Le score PageSpeed / LCP actuel de master (aucun acces a PSI ni a Lighthouse dans cet audit).
- L'exactitude de 4,7 / 1 062, de l'attribution Travellers' Choice, de l'authenticite et de l'accord de publication des 3 avis TripAdvisor (dependent du proprietaire).
- Le rendu reel de l'iframe Maps (URL legacy sans cle `output=embed`).
- La conformite des signatures du webhook Resend et de la phase newsletter (hors perimetre).
- Le rendu visuel mobile (aucun navigateur lance ; le rapport de phase cite un test Chromium 390 px, non reverifie).

## FIXES (branche `fix/v1.0-phase5`, base `milestone/v1.0`)

Corriges (code + tests, y compris chemins d'echec) :

- HIGH aggregateRating / preuve sociale : chiffres reels fournis par le proprietaire (Google 4,7 / 1 065 avis ; TripAdvisor 4,7 / 814 avis) dans `social-proof.ts` (`ratings.google`, `ratings.tripadvisor`). `SocialProof.tsx` affiche un bloc par source avec son nom et ses chiffres ; le badge Travellers' Choice est dans le bloc TripAdvisor. Le schema (`aggregateRating`) reprend uniquement les chiffres Google (jamais additionnes). Drapeau `SHOW_AGGREGATE_RATING` inchange (true) ; commentaire ajoute sur la politique Google "self-serving review snippets". Cle morte `home.reviewsLine` mise a jour en fr/en (de/sv : branche i18n).
- HIGH i18n scope : `socialProof`, `payment`, `line` ajoutes au scope "home", `reviewFeedback` au scope "review" dans `scripts/translation-scope.json`. DEPENDANCE : la porte `i18n-publication-gate` (de/sv "complete keys") et `review-docs` (docs/ph6 : tables de cles et signature) restent ROUGES (9 tests) tant que `fix/v1.0-i18n` n'a pas fourni les cles de/sv et les documents de relecture. C'est voulu : la porte fait maintenant son travail. Ne pas merger sans cette branche (`npm run build` lance vitest).
- MEDIUM locale "Un souci ?" : le schema accepte fr/en/de/sv (le formulaire envoyait deja la vraie locale) ; l'email proprietaire affiche la vraie langue ; le 429 est en francais pour fr, anglais sinon.
- MEDIUM limiteur "Un souci ?" fail closed : sans `RATE_LIMIT_SECRET` ou sans IP, la requete est comptee dans un seau global `feedback:global` (10/h, sans donnee personnelle). Une panne RPC reste fail-open (documente, Sentry).
- MEDIUM `/api/review/go` : verification, limitation (30/h par IP hachee, seau global `review-hit:global` 600/h sans IP/secret) et ecriture passent dans `after()` : la redirection n'attend plus la base. "email" n'est credite que si le `rid` existe en base (`resolveVerifiedSource`) ; un `src=email` nu ou un UUID inconnu compte "unknown". La page `/review` applique la meme verification et la meme limitation, et transmet le `rid` verifie aux boutons.

Documente seulement (non corrige) :

- LOW / INFO de la passe 1 et 2 (lien WhatsApp de repli sans evenement, annee Travellers' Choice, machine d'etats PUT reservations, `getClientIp` hors Vercel, origine telephone des invitations d'avis, Plausible en de/sv, referrerPolicy Maps) : inchanges.
- MEDIUM "Jean-Louis305" (pseudonyme TripAdvisor affiche comme prenom) : necessite l'accord du proprietaire, inchange.
- MEDIUM message 429 reservations en de/sv : repli EN accepte, inchange.
- HIGH SEO-08 PageSpeed mobile 79 / LCP 4,4 s : OUVERT. Demande un chantier performance separe ; aucune mesure post-correction.

Non prouve apres correctifs : migrations 015/016 en production, reception reelle de l'email "Un souci ?", `RATE_LIMIT_SECRET` defini en production, rendu visuel mobile du nouveau bloc a deux sources, exactitude du badge Travellers' Choice.
