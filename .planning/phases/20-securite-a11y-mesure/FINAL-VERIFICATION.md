# FINAL-VERIFICATION : vérification par l'objectif du milestone v1.2

Cible : `milestone/v1.2` @ `10f61e0` (docs(v1.2): fusion PERF-04), branche `audit/final-verify`. Aucun fichier source modifié. Base : `.planning/phases/18-vitesse-mobile/W1-VERIFICATION.md` (reprise pour ce qui n'a pas changé ; revérifié : H1, méta, CSP, a11y, JS, cookies, cache).

## Méthode et conditions
- Build `next build` (Turbopack) hors dépôt (`C:\gw2\w`, copie `git archive`), `next start -p 3113`. Base de comparaison : `master` @ `022b1a1`, construit pareil (`C:\gw1\m`, src identique à `git archive master`). `vitest run` sur la copie : 149 fichiers, 2431 tests OK (4 skipped).
- Le build lit la vraie base Supabase en lecture (clé anon), comme tout build du dépôt et comme W1 ; aucune écriture, aucun e-mail. Un build-témoin (`C:\gw2\c`) a utilisé un faux serveur de données local (`[]`, arrêté avant `next start`) et `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID=pa-test`. Les mesures navigateur bloquent ou interceptent `/monitoring` et `/gcm/*` (aucun envoi à Sentry ni Plausible) et coupent le réseau externe.
- Machine : Windows 11, 16 CPU logiques, ~12 % de charge CPU due à d'autres processus (mesure CIM), 4,7 Go RAM libres, Chromium 158 (Playwright 1254), Lighthouse 13.6, mobile par défaut (Slow 4G simulé, CPU x4). Verrou machine pris par moi et libéré. Scripts : scratchpad (`lh/fv-*.mjs`), hors dépôt.
- Le score en ligne reste à mesurer après déploiement.

## Verdicts

| Exigence | Verdict | Preuve exécutée | Écart |
|---|---|---|---|
| PERF-01 | VERIFIED | Master servi : `Cache-Control: private, no-cache, no-store` sur /fr. Final : `s-maxage=3600, stale-while-revalidate=31532400` sur /fr /en /de /sv, `x-nextjs-cache: HIT`. | wifi/review/newsletter restent dynamiques (voulu). |
| PERF-02 | PARTIAL (local) ; `x-vercel-cache: HIT` NOT PROVABLE LOCALLY | En-têtes publics ci-dessus. Le risque W1 (Set-Cookie `NEXT_LOCALE` sur HTML caché) est levé : `curl -I` /fr et /en/menu sans `set-cookie` (`localeCookie: false`, fix/w1-routing). | HIT CDN à contrôler en prod. |
| PERF-03 | VERIFIED (W1, non rejoué en entier) | 5 polices `.woff2` auto-hébergées préchargées ; réseau externe coupé : 0 tentative vers un hôte externe sur toutes les pages testées. | Voir PERF-07 : l'élément LCP est le logo en Cinzel Decorative. |
| PERF-04 | PARTIAL | Octets réels, mobile 390, networkidle, /fr : scripts master 947 319 o brut / 285 550 gzip (15 scripts) -> final 850 666 / 264 840 (15) = -10,2 % brut, -7,3 % gzip ; HTML /fr 215 314 / 44 052 -> 193 145 / 36 935 (-10,3 % / -16,2 %). /en : scripts idem ; HTML 216 633 -> 190 592. /de HTML 222 489 -> 192 638, /sv 216 995 -> 189 863. /fr/menu : scripts master 787 882 / 242 482 (13) -> final 850 666 / 264 840 (15) = +8 % brut (+22 Ko gzip : la page menu embarque désormais la coque, popup lazy, etc.) ; HTML 534 308 -> 617 205 (JSON-LD Menu). Lighthouse : unused JS 56 Kio, legacy JS 13 Kio (master 55-59 / 14). | Réduction réelle sur les accueils, régression sur le menu. Les ~60 Ko inutilisés et les 14 Ko de polyfills subsistent (Sentry client ~74 Ko gzip non touché, décision propriétaire). |
| PERF-05 | PARTIAL / NOT PROVABLE LOCALLY | Build-témoin avec `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` : le HTML référence `/gcm/js/script.js` (lazyOnload) ; règle d'en-tête `max-age=604800, swr=86400` (config, W1). | 7 j, pas `immutable` ; le rewrite vers plausible.io n'est pas exercé (service tiers). |
| PERF-06 | VERIFIED | Crawl de 44 URLs (W1 pour les `<img>`) ; Lighthouse CLS 0 sur 10 passes /fr /en finales. | — |
| PERF-07 | FAILED (local) ; en ligne NOT PROVABLE | 5 passes x 2 pages, build FINAL, `next start` : /fr 73/53/78/77/70, médiane **73** (53-78) ; /en 77/75/69/74/76, médiane **75** (69-77). LCP médian 4,83 s / 4,78 s, TBT médian 397 / 330 ms, FCP 0,91 s, CLS 0. Master, mêmes conditions : /fr médiane 75 (72-75), /en 74 (74-78), LCP 4,88 s : le final n'est ni meilleur ni pire que master dans ce harnais. Le build-témoin (données vides) donne une passe à 92 (LCP 2,5 s) puis 73-74 : distribution bimodale. | Seuil 90 non atteint de façon reproductible. LCP = logo `<p class=font-cinzel-decorative>` ; 90 % de « render delay » (LCP observé réel 0,5 s, simulé 4,7 s), cohérent avec le swap de police (5 polices préchargées, ~160 Ko en concurrence sur Slow 4G simulé) : hypothèse, non prouvée. Les « 92-93 » des rapports précédents sont des passes de la branche haute. Non mesuré : Plausible actif, CDN réel. |
| ONP-01 | VERIFIED | HTML + DOM rendu : 1 seul H1 par accueil. FR « Restaurant franco-thaï à Krabi Town », EN « French-Thai Restaurant in Krabi Town », DE « Französisch-thailändisches Restaurant in Krabi Town », SV « Fransk-thailändsk restaurang i Krabi Town ». Logo : `<p>` (master `<h1>`), mêmes classes. Captures d'élément master vs final : logo hero 0 pixel de différence (4 langues x 390/1440 ; DE 390 : capture 101 vs 100 px, arrondi sous-pixel, 42 px d'anti-aliasing) ; logo d'en-tête : 0 pixel de différence une fois recadré (zone cliquable de 22-28 à 48 px, centrée). Géométrie calculée identique (40/96 px, y 291/314). | Le sous-titre visible a changé (c'est le nouveau H1, 18-24 px italique), comme attendu. |
| ONP-02 | VERIFIED | `/en` title exact « Gecko Cabane – Best French-Thai Restaurant in Krabi Town » (56 car.). Description (158 car.) : « A restaurant in Krabi Town where Chef Jariya cooks French-Thai food. Rated 4.7★ on Google by guests, open every day. Book your table online in under a minute. » | La note 4,7 vient de `social-proof.ts`, non vérifiée ici. |
| ONP-03 | PARTIAL | `/en/french-restaurant-krabi` : title « Krabi Town Restaurant, 4.7★ French Cooking – Gecko Cabane » (57), description 155 car. décodées : « Looking for the best restaurant in Krabi? 4.7★ on Google: Chef Jariya's beef bourguignon, chicken in cream sauce, massaman curry. Open 7 days, book online. » | « krabi town restaurant » présent ; « best restaurant krabi » seulement sous la forme « best restaurant in Krabi ». |
| ONP-04 | PARTIAL | fr `/fr/venir-depuis-ao-nang` indexée, dans le sitemap, hreflang fr/en/x-default. de `/de/anreise-von-ao-nang`, sv `/sv/resa-fran-ao-nang` : 200, `noindex, follow`, hors sitemap, 0 hreflang. | de/sv volontairement bloquées jusqu'à ONP-11. |
| ONP-05 | PARTIAL | Idem : fr `/fr/vins-bieres-belges-krabi` indexée ; de `/de/wein-belgisches-bier-krabi`, sv `/sv/vin-belgisk-ol-krabi` noindex. | Le FR est publié ; accord alcool du propriétaire à confirmer. |
| ONP-06 | VERIFIED (périmètre publié) | Sitemap : 26 URLs ; 3 hreflang (fr,en,x-default) sur les 2 guides et privacy, 5 ailleurs ; réciprocité W1 : 0 anomalie. | de/sv des 2 guides absentes (cf. ONP-11). |
| ONP-07 | VERIFIED (structure) ; Rich Results Test NOT PROVABLE | /fr /en /de /sv `/menu` : JSON-LD `Restaurant` + `Menu` ; 50 sections, 303 items, 237 avec offre THB, 0 prix/devise invalide, identique en 4 langues. | Service tiers non appelé. |
| ONP-08 | VERIFIED (W1) | Non rejoué en entier ; og/twitter présents sur 38 URLs (W1). | Image OG de/sv = variante anglaise. |
| ONP-09 | PARTIAL | Aucune occurrence de « couple franco-thaï ». Mais le rendu de /fr contient « mari français, Frédéric » et /en « French husband » (about, pages piliers) ; de/sv idem selon W1. | « Cheffe Jariya seule » non tranché, décision propriétaire. |
| ONP-10 | VERIFIED | 44 URLs (26 du sitemap + wifi/review/newsletter/privacy x 4 langues + 4 pages de/sv non publiées) : exactement 1 H1 en HTML serveur ET 1 dans le DOM hydraté sur chacune ; 404 localisée : 1 H1. 0 exception. | — |
| ONP-11 | HUMAN GATE | Liste ci-dessous. Garde-fous vérifiés : les 4 pages de/sv des 2 nouvelles pages sont `noindex, follow`, sans canonical/hreflang, absentes du sitemap, et les fr/en n'ont pas de hreflang vers elles. | Relecture humaine non faite. |
| SEC-01 | VERIFIED | `X-Content-Type-Options: nosniff` sur 16 URLs (accueils, menu, privacy, guide, wifi fr/de, /admin/login, /api/hours, sitemap, robots, og-image, manifest, 404). | — |
| SEC-02 | VERIFIED | `strict-origin-when-cross-origin`, mêmes 16 URLs. | — |
| SEC-03 | VERIFIED | `SAMEORIGIN`, mêmes 16 URLs. | — |
| SEC-04 | VERIFIED | `camera=(), microphone=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), magnetometer=(), gyroscope=(), accelerometer=()`, mêmes 16 URLs. | — |
| SEC-05 | VERIFIED (périmètre local) | Chromium Playwright, CSP appliquée (`script-src 'self' 'unsafe-inline'`, `frame-src https://www.google.com`, `connect-src 'self'`…), build-témoin avec Plausible actif. 35 parcours, 390 et 1440 px : 12 pages x 2 (/fr /en /de /sv, menu, newsletter, review, privacy, wifi, guide EN, /admin/login, 404), réservation remplie sans envoi (/fr /en x 2 viewports, 0 POST), carte cliquée (iframe google.com montée, 4 cas), popup newsletter desktop (exit-intent) et mobile (défilement, bandeau `role=region`, test dédié) : **0 `securitypolicyviolation`, 0 message console CSP**. Contrôle positif (script, iframe, fetch vers evil.example) : 3 violations. Script Plausible `/gcm/js/script.js` exécuté sur toutes les pages publiques. | `unsafe-inline` en script (compromis documenté : SSG sans nonce). Non prouvé : Google Maps, Plausible, Sentry et Supabase réels (simulés ou interceptés), Safari/Firefox, CDN, `upgrade-insecure-requests` (seulement si VERCEL=1). Admin : page de connexion seulement. |
| A11Y-01 | VERIFIED | axe `color-contrast` : 0 sur 8 pages (/fr /en /de /sv, /fr/menu, /fr/review, /fr/privacy, /en/french-restaurant-krabi), mobile 390. | Identité visuelle : laiton plus foncé sur surtitres/prix, ivoire /60 en pied de page (déclaré 20c). |
| A11Y-02 | PARTIAL | Lighthouse a11y 100 sur les 8 pages ; axe `target-size` 0. Balayage des cibles < 48 px : liste ci-dessous. | Restent < 48 px : sélecteur de langue (25-27 x 48), bouton « Réserver » de l'accueil (39 px de haut, zone étendue à ~51 par pseudo-élément), liens en ligne. |
| A11Y-03 | VERIFIED | axe `label-content-name-mismatch` : 0 sur 8 pages ; sélecteur « EN - Changer vers English ». | Lecteur d'écran réel non testé. |

### Cibles < 48 px restantes (mobile 390, éléments interactifs visibles)
- Accueils /fr /en /de /sv : sélecteur de langue, 3 liens de 25-27 x 48 px ; « Réserver une table / Book a table / Tisch reservieren / Boka bord » 58-106 x 39 px (zone cliquable étendue par `after:`, non comptée dans le rectangle) ; lien d'évitement 1 x 1 (visible au focus seulement).
- /fr/menu, /en/french-restaurant-krabi : sélecteur de langue, 3 liens de 25-27 x 48.
- Liens en ligne (exemption WCAG 2.5.8) : « politique de confidentialité » 75-149 x 17 (une fois 285 x 38), « selenium-studio.com » et « anatholy-bricon.com » 97 x 14, téléphone 101 x 21 et e-mail 231 x 21 sur /fr/privacy.
- /fr/review : 0.

### Lighthouse (rapport PERF-07)
| Build | Page | Passes (perf) | Médiane | Min-Max | LCP méd. | TBT méd. | FCP méd. | CLS | a11y / BP / SEO |
|---|---|---|---|---|---|---|---|---|---|
| FINAL | /fr | 73, 53, 78, 77, 70 | 73 | 53-78 | 4832 ms | 397 ms | 911 ms | 0 | 100 / 100 / 100 |
| FINAL | /en | 77, 75, 69, 74, 76 | 75 | 69-77 | 4780 ms | 330 ms | 912 ms | 0 | 100 / 100 / 100 |
| master | /fr | 74, 72, 75, 75, 75 | 75 | 72-75 | 4877 ms | 332 ms | 1060 ms | 0 | 93 / 100 / 100 |
| master | /en | 74, 74, 78, 74, 78 | 74 | 74-78 | 4863 ms | 353 ms | 1064 ms | 0 | 93 / 100 / 100 |
| témoin (données vides, Plausible) | /fr | 92, 74, 73 | 74 | 73-92 | 4809 ms | 358 ms | 923 ms | 0 | 100 / 96 / 100 |
| témoin | /en | 74, 63, 75 | 74 | 63-75 | 4865 ms | 354 ms | 919 ms | 0 | 100 / 96 / 100 |

Une passe /fr du final a un TBT de 5011 ms (score 53) : bruit machine. Le harnais est instable (environ une passe sur 25 à 92) : un chiffre local isolé ne prouve rien dans un sens ni dans l'autre.

## Critères de succès par phase (ROADMAP.md)

**Phase 18** : 1 cause no-store supprimée : MET. 2 `x-vercel-cache: HIT` : NOT PROVABLE LOCALLY (cache public, `x-nextjs-cache: HIT`, plus de Set-Cookie réunis). 3 `next/font`, rien d'externe : MET. 4 JS et polyfills reculent + Plausible lazyOnload/cache : PARTIALLY MET (accueils -10 % brut ; menu +8 % ; polyfills 13-14 Ko inchangés ; lazyOnload OK). 5 pas de décalage d'image, apparence identique : MET (CLS 0, logo 0 pixel de diff).

**Phase 19** : 1 H1 unique par accueil et par page publique : MET. 2 EN home et french-restaurant : MET (réserve « best restaurant krabi » exact). 3 guides fr/de/sv, sitemap, hreflang : PARTIALLY MET (fr + en ; de/sv noindex en attente de relecture). 4 JSON-LD Menu valide : MET en structure, Rich Results Test NOT PROVABLE. 5 og/twitter, plus de « couple », relecture DE/SV : PARTIALLY MET (og oui ; « mari français » reste ; relecture HUMAN GATE).

**Phase 20** : 1 quatre en-têtes : MET. 2 CSP sans violation bloquante : MET pour les flux testés localement ; services réels non exercés. 3 contrastes, cibles 48 px, aria-label : PARTIALLY MET (contrastes et aria-label OK ; cibles 48 px incomplètes). 4 Lighthouse mobile >= 90 sur /fr et /en : NOT MET localement (73/75), à remesurer en ligne.

## ONP-11 : textes DE/SV à relire (HUMAN GATE)
Pages concernées (noindex, hors sitemap) : `/de/anreise-von-ao-nang`, `/sv/resa-fran-ao-nang`, `/de/wein-belgisches-bier-krabi`, `/sv/vin-belgisk-ol-krabi`. À relire dans `messages/de.json` et `messages/sv.json` : les namespaces complets `gettingHere` et `wineBeer`, plus les 9 clés modifiées ou ajoutées depuis master dans chaque langue (`hero.h1`, `hero.discoverAriaLabel`, `contactSection.viewMapAriaLabel`, `frenchRestaurant.subtitle`, `frenchRestaurant.intro1`, `frenchRestaurant.storyTitle`, `nav.frenchRestaurantHint`, `romanticDinner.sections`, `wineBeer.sections`), dont le texte exact suit. Méta d'accueil déjà en ligne à relire aussi : `meta.homeTitle` / `meta.homeDescription` de/sv. La meta description de `/de/wein-belgisches-bier-krabi` fait 201 caractères (> 160).

## Annexe : valeurs exactes des clés DE/SV modifiées depuis master

### DE (9 cles)
- `hero.h1` : Französisch-thailändisches Restaurant in Krabi Town
- `hero.discoverAriaLabel` : Unsere Küche entdecken: Speisekarte und Spezialitäten
- `contactSection.viewMapAriaLabel` : In Google Maps ansehen (öffnet in neuem Tab)
- `frenchRestaurant.subtitle` : Echte französische Küche von Chefköchin Jariya, an der Maharat Road.
- `frenchRestaurant.intro1` : Das Gecko Cabane ist ein kleines französisches Restaurant in Krabi Town, geführt von Chefköchin Jariya. Sie kocht die Klassiker der französischen Hausmannskost so, wie sie schmecken sollen: langsam und großzügig.
- `frenchRestaurant.storyTitle` : Das Restaurant von Chefköchin Jariya
- `nav.frenchRestaurantHint` : Französische Hausmannskost von Chefköchin Jariya, mit ein paar thailändischen Lieblingsgerichten.
- `romanticDinner.sections.ambiance.p1` : Das Gecko Cabane bietet höchstens 40 Gästen Platz, deshalb bleibt es ruhig und das Gespräch fließt von selbst. Geführt wird es von Chefköchin Jariya, die Sie persönlich willkommen heißt.
- `wineBeer.sections.belgian.p1` : Unsere Küche wird von Chefköchin Jariya geführt, und belgisches Bier ist ein natürlicher Begleiter zur französischen Hausmannskost. Abteibiere, helle Ales und Weizenbiere passen gut zu geschmorten und cremigen Gerichten.

### SV (9 cles)
- `hero.h1` : Fransk-thailändsk restaurang i Krabi Town
- `hero.discoverAriaLabel` : Upptäck vårt kök: meny och specialiteter
- `contactSection.viewMapAriaLabel` : Visa i Google Maps (öppnas i ny flik)
- `frenchRestaurant.subtitle` : Äkta fransk matlagning av kocken Jariya, på Maharat Road.
- `frenchRestaurant.intro1` : Gecko Cabane är en liten fransk restaurang i Krabi Town som drivs av kocken Jariya. Hon lagar den franska husmanskostens klassiker så som de ska smaka: långsamt och generöst.
- `frenchRestaurant.storyTitle` : Kocken Jariyas restaurang
- `nav.frenchRestaurantHint` : Fransk husmanskost av kocken Jariya, med några thailändska favoriter.
- `romanticDinner.sections.ambiance.p1` : Gecko Cabane har plats för högst 40 gäster, så matsalen förblir lugn och samtalet flyter lätt. Restaurangen drivs av kocken Jariya, som själv tar emot dig.
- `wineBeer.sections.belgian.p1` : Vårt kök drivs av kocken Jariya, och belgisk öl är ett naturligt sällskap till fransk husmanskost. Klosteröl, ljusa ales och veteöl passar bra till långkoket och krämiga rätter.
