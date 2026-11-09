# Requirements: Gecko Cabane — v1.2 Vitesse mobile, SEO on-page et sécurité

**Defined:** 2026-11-09
**Core Value:** geckocabanerestaurant.com doit devenir la première source de réservations des touristes européens de Krabi : être trouvé (SEO FR/EN/DE) et réserver en moins de 60 secondes.
**Contraintes :** pas de changement de design ni de textes hors liste ; textes DE/SV relus par un humain ; rien n'est publié ou envoyé à un tiers sans accord du propriétaire. Reprend SEO-08 (dette v1.0).

## v1 Requirements

### Vitesse mobile (PERF)

- [ ] **PERF-01**: La cause du rendu dynamique (`cache-control: private, no-cache, no-store`) dans `app/[locale]` est identifiée et supprimée (cookies(), headers(), searchParams, fetch sans cache…)
- [ ] **PERF-02**: Les pages publiques /fr /en /de /sv sont servies en statique ou ISR (`generateStaticParams`, `revalidate` si besoin) avec un cache public : `x-vercel-cache: HIT` après le premier appel
- [ ] **PERF-03**: Les polices (dont Cinzel Decorative du H1, élément LCP) se chargent via `next/font` (subset latin, display swap, preload), sans chargement externe ni bloquant
- [ ] **PERF-04**: Le JavaScript inutile est réduit (≈ 60 Ko inutilisés, 14 Ko de polyfills) : composants serveur par défaut, sections sous la ligne de flottaison chargées en différé
- [ ] **PERF-05**: `/gcm/js/script.js` a un cache long (immutable) ou est chargé via `next/script` `lazyOnload`
- [ ] **PERF-06**: Toutes les images ont width/height (ou équivalent) : pas de décalage de mise en page
- [ ] **PERF-07**: Lighthouse mobile ≥ 90 sur /fr et /en, mesuré (base : 72, LCP 3,8 s, TBT 680 ms)

### SEO on-page (ONP)

- [ ] **ONP-01**: Sur chaque accueil, le logo « GECKO CABANE » reste visuel mais n'est plus un H1 ; un vrai H1 par langue (EN « French-Thai Restaurant in Krabi Town », FR « Restaurant franco-thaï à Krabi Town », DE et SV équivalents)
- [ ] **ONP-02**: Accueil EN : title « Gecko Cabane – Best French-Thai Restaurant in Krabi Town » et meta description avec « restaurant in Krabi », la cheffe Jariya, la note 4,7★ et la réservation en ligne
- [ ] **ONP-03**: `/en/french-restaurant-krabi` : title et description réécrits pour « krabi town restaurant » et « best restaurant krabi » (note, plats phares, ouvert 7j/7)
- [ ] **ONP-04**: Versions fr/de/sv de `/en/getting-here-from-ao-nang`, slugs traduits, hreflang
- [ ] **ONP-05**: Versions fr/de/sv de `/en/wine-belgian-beer-krabi`, slugs traduits, hreflang
- [ ] **ONP-06**: Le sitemap contient les nouvelles pages ; les hreflang sont réciproques entre toutes les versions
- [ ] **ONP-07**: La page menu a un JSON-LD schema.org Menu (MenuSection, MenuItem avec name, description, offers.price en THB) généré depuis les données de la carte, valide au Rich Results Test, en plus du JSON-LD Restaurant
- [ ] **ONP-08**: Toutes les pages internes ont og:image et balises Twitter (aujourd'hui seulement les accueils)
- [ ] **ONP-09**: Plus aucun texte ni meta ne parle d'un « couple franco-thaï » ; la présentation officielle est la cheffe Jariya
- [ ] **ONP-10**: Un seul H1 descriptif par page publique
- [ ] **ONP-11**: Les textes DE et SV des nouvelles pages sont relus par un humain avant mise en production

### Sécurité (SEC)

- [ ] **SEC-01**: `next.config` envoie `X-Content-Type-Options: nosniff`
- [ ] **SEC-02**: `next.config` envoie `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **SEC-03**: `next.config` envoie `X-Frame-Options: SAMEORIGIN`
- [ ] **SEC-04**: `next.config` envoie une `Permissions-Policy` minimale
- [ ] **SEC-05**: Une `Content-Security-Policy` compatible avec les scripts existants (GTM/analytics, Google Maps, Sentry, Supabase) ne casse ni la réservation ni l'admin ; vérifiée dans le navigateur sans violation bloquante

### Accessibilité mobile (A11Y)

- [ ] **A11Y-01**: Les contrastes insuffisants signalés par Lighthouse sont corrigés sans changer l'identité visuelle
- [ ] **A11Y-02**: Les zones cliquables trop petites sur mobile font au moins 48 px
- [ ] **A11Y-03**: Les `aria-label` sont alignés avec le texte visible

## Future Requirements (reportées)

- Dette v1.0 : CONV-02 (photo, année d'ouverture, histoire), KPI-08 (live pas avant le 2026-11-16), OPS-01/04/05 (GBP, TripAdvisor, NAP), lancement de la newsletter, relecture native DE/SV du reste du site
- Dette v1.1 : AUDIT-01/02/04, RSV-06 (observation des crons), QA-02 (lecteur d'écran réel), défauts d'API listés dans MILESTONES.md

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changement de design ou de textes hors liste | Contrainte explicite du milestone |
| Actions externes (Google, TripAdvisor, blogs, hôtels) | Accord du propriétaire requis |
| Traduction automatique brute DE/SV | Relecture humaine exigée |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERF-01 | Phase 18 | Pending |
| PERF-02 | Phase 18 | Pending |
| PERF-03 | Phase 18 | Pending |
| PERF-04 | Phase 18 | Pending |
| PERF-05 | Phase 18 | Pending |
| PERF-06 | Phase 18 | Pending |
| PERF-07 | Phase 20 | Pending |
| ONP-01 | Phase 19 | Pending |
| ONP-02 | Phase 19 | Pending |
| ONP-03 | Phase 19 | Pending |
| ONP-04 | Phase 19 | Pending |
| ONP-05 | Phase 19 | Pending |
| ONP-06 | Phase 19 | Pending |
| ONP-07 | Phase 19 | Pending |
| ONP-08 | Phase 19 | Pending |
| ONP-09 | Phase 19 | Pending |
| ONP-10 | Phase 19 | Pending |
| ONP-11 | Phase 19 | Pending |
| SEC-01 | Phase 20 | Pending |
| SEC-02 | Phase 20 | Pending |
| SEC-03 | Phase 20 | Pending |
| SEC-04 | Phase 20 | Pending |
| SEC-05 | Phase 20 | Pending |
| A11Y-01 | Phase 20 | Pending |
| A11Y-02 | Phase 20 | Pending |
| A11Y-03 | Phase 20 | Pending |

**Coverage:** 26/26 requirements v1 mappés (PERF 7, ONP 11, SEC 5, A11Y 3)

---
*Requirements defined: 2026-11-09*
