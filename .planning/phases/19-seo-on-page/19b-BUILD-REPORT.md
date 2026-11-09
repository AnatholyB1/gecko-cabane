# 19b BUILD REPORT (ONP-01, ONP-02, ONP-03, ONP-10)

Branche `phase/19b-home-meta` (base `milestone/v1.2`, merge refait avant le gate : « Already up to date »). Aucun push, aucun déploiement, aucune migration.

## Ce qui est fait

- **ONP-01** : dans `src/app/[locale]/page.tsx`, le logo « GECKO CABANE » est passé de `<h1>` à `<p>` (mêmes classes, même style inline). Le sous-titre existant du hero (`<p class="font-cormorant italic font-light ...">`) devient le **H1**, mêmes classes, texte lu dans la nouvelle clé `hero.h1` (qui remplace `hero.subtitle`, supprimée des 4 fichiers de messages, plus utilisée nulle part). Aucun bloc visuel nouveau. Pas de changement de chargement : page toujours SSG, `setRequestLocale`, `getTranslations({ locale })` intacts.
  - fr « Restaurant franco-thaï à Krabi Town » ; en « French-Thai Restaurant in Krabi Town » ; de « Französisch-thailändisches Restaurant in Krabi Town » ; sv « Fransk-thailändsk restaurang i Krabi Town ». Rendu dans le hero, juste sous le logo (HTML vérifié : 1 seul `<h1>` par accueil).
- **ONP-02** : `meta.homeTitle` EN = « Gecko Cabane – Best French-Thai Restaurant in Krabi Town » (56 car.). `meta.homeDescription` EN (158 car.) : « A restaurant in Krabi Town where Chef Jariya cooks French-Thai food. Rated 4.7★ on Google by guests, open every day. Book your table online in under a minute. » Pas d'`aggregateRating`. fr/de/sv inchangés.
- **ONP-03** : `/en/french-restaurant-krabi`. Title (57 car.) « Krabi Town Restaurant, 4.7★ French Cooking – Gecko Cabane ». Description (155 car.) « Looking for the best restaurant in Krabi? 4.7★ on Google: Chef Jariya's beef bourguignon, chicken in cream sauce, massaman curry. Open 7 days, book online. » Plats pris dans la section « Signature dishes » de la page elle-même (bourguignon, poulet à la crème, massaman). « best » n'apparaît que sous forme de question, jamais en affirmation (seul le title de l'accueil porte « Best », demandé explicitement). fr/de/sv inchangés.
- **ONP-10** : audit du HTML rendu par `next start` (script `b19-h1audit.mjs` hors dépôt) sur 89 URLs : sitemap + toutes les pages publiques en fr/en/de/sv (accueil, menu, privacy, review, wifi, newsletter, confirm, unsubscribe, 5 guides SEO, pages 19a y compris les slugs de/sv non publiés, page 404). **0 page sans H1 ou à H1 multiples** (89 sur 89 = exactement 1). Donc aucune autre correction de page n'a été nécessaire. Nouveau test `tests/seo-h1.test.ts` : textes H1 des 4 langues, accueil = 1 h1 depuis `hero.h1` et logo non-titre, chaque `page.tsx` publique a exactement 1 h1 ou délègue à `SeoLandingPage`/`UtilityCard` (1 h1 chacun).

## Tests adaptés (signalé)

`tests/landing-page.test.ts` : le title EN de la landing doit contenir « krabi town restaurant » (au lieu de « french restaurant »). `tests/seo-pages.test.ts` : (1) le titre EN d'accueil figé change (demande ONP-02) ; (2) la règle « pas de note, pas de best, pas de chiffre décimal » dans les meta reste stricte pour fr/de/sv, mais est levée pour **en** (le propriétaire demande « Best » et la note 4,7) ; la règle « pas d'horaire en dur » reste pour toutes les langues. Longueur 150-160 et mention de Jariya et Krabi toujours exigées.

## Vérifié (réellement exécuté)

- Visuel (Playwright, iPhone 14 et 1440, mouvement réduit, pleine page, avant/après avec pixelmatch) : même hauteur de page dans les 4 cas. Pixels différents : desktop fr 2291 (0,013 %), desktop en 2283 ; mobile 9-13 k pixels (0,04-0,05 %). Les différences sont **toutes** la ligne du sous-titre (desktop : bbox y 630-654 seulement ; mobile : mêmes 4 491 px répétés à chaque tuile de 16 384 px de la capture pleine page). Donc design identique, seul le **texte** du sous-titre change (il est plus long, la hauteur de page est identique dans les 4 captures).
- Lighthouse mobile local (médiane de 3, throttling par défaut, `next start` port 3104, machine chargée par d'autres agents donc bruit élevé) : /en avant 62 / LCP 5,54 s / TBT 692 ms ; après 64 / 5,33 s / 645 ms. /fr avant 63 / 5,44 s / 655 ms ; après 72 / 5,28 s / 363 ms. CLS 0, FCP ~1,1 s identiques. Pas de régression (LCP et score dans le bruit). Le H1 est servi dans le HTML statique, sans chargement différé.
- `curl` des 4 accueils (build avant le dernier ajustement de meta) : title, description, H1 conformes ; logo en `<p>`.

## Non prouvé

- Le gain SEO (classement, CTR) : rien de mesurable en local.
- LCP réel : le Lighthouse local est simulé ; l'élément LCP est désormais le H1 Cormorant italique (plus le logo Cinzel Decorative) ou l'image du hero, non ré-isolé.
- Rendu SERP des 4,7★ en title/description (Google peut réécrire).

## À signaler au propriétaire / à relire

- **Texte visible modifié** : le sous-titre du hero passe de « Franco-Thai Restaurant » (en), « Restaurant Franco-Thaï » (fr), etc. à la phrase H1 avec « à Krabi Town » (la ligne « Krabi Town · Thaïlande » juste dessous répète donc la localisation).
- **ONP-11, à relire par un humain** : H1 DE et SV (brouillons imposés par la décision D-01), et le rendu de l'accueil de/sv qui les affiche (pages de/sv déjà publiées : la feuille signée `docs/ph6/review/{de,sv}/` de l'accueil, si elle existe, cite l'ancien sous-titre).
- **Non modifié mais à noter (ONP-10 « descriptif »)** : H1 peu descriptifs : `/menu` « Our menu » (« Notre carte » etc.), `/wifi` « Restaurant WiFi », `/review` « Your opinion matters to us ». Texte hors liste, laissé tel quel ; pages noindex pour wifi/review, mais `/menu` est indexée.
- La page 404 rend « Page introuvable » dans les 4 langues (1 h1, comportement existant du correctif Sentry S).

## Gate (verrou machine pris puis libéré)

- `npx vitest run` : 146 fichiers, 2442 tests passés, 1 skipped (première passe : 1 échec `landing-page.test.ts`, corrigé, voir plus haut). `npx tsc --noEmit` : 0 erreur avant et après build. `npm run lint` : 0 erreur (2 warnings existants). `npm run build` : OK. Après build : curl de l'accueil EN et de la landing EN conformes (title, description, og:title/description, twitter:title).
