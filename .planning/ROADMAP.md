# Roadmap: Gecko Cabane

## Milestones

- ✅ **v1.0 SEO, conversion et réputation** — Phases 1-8 (livré 2026-10-31, clos avec dette reportée) — archive : `.planning/milestones/v1.0-ROADMAP.md`, exigences : `.planning/milestones/v1.0-REQUIREMENTS.md`
- ✅ **v1.1 Refonte de l'admin** — Phases 9-17 (livré 2026-11-02, clos avec dette reportée) — archive : `.planning/milestones/v1.1-ROADMAP.md`, exigences : `.planning/milestones/v1.1-REQUIREMENTS.md`, audit : `.planning/v1.1-MILESTONE-AUDIT.md`
- 🚧 **v1.2 Vitesse mobile, SEO on-page et sécurité** — Phases 18-20 (en cours)

<details>
<summary>✅ v1.0 SEO, conversion et réputation (Phases 1-8) — livré 2026-10-31</summary>

Détail complet des phases, plans et preuves : `.planning/milestones/v1.0-ROADMAP.md`. Les phases 4 à 8 ont été livrées avec des restes bloqués sur le propriétaire ; ces éléments restent hors périmètre de v1.1 (voir REQUIREMENTS.md, « Future Requirements ») :

- 04-03 fiche Google Business Profile (OPS-01)
- SEO-08 (PageSpeed 85, LCP 2,5 s), CONV-02 (photo du couple)
- 06-10 TripAdvisor et NAP (OPS-04, OPS-05), relecture native DE/SV
- 07-02, 07-10, 07-11 : lancement de la newsletter
- 08-13 / KPI-08 : 2 semaines de TEST puis `KPI_REPORT_MODE=live` (pas avant le 2026-11-16)

Les dossiers `.planning/phases/01-04` et `08`, ainsi que les workstreams, restent en place.

</details>

<details>
<summary>✅ v1.1 Refonte de l'admin (Phases 9-17) — livré 2026-11-02</summary>

Détail complet des phases, critères de succès et preuves : `.planning/milestones/v1.1-ROADMAP.md`. 39 exigences sur 44 sont vérifiées ; les 5 autres dépendent du propriétaire et sont reportées (voir `.planning/MILESTONES.md`, « Known Gaps »).

</details>

## Phases

**Milestone v1.2 : Vitesse mobile, SEO on-page et sécurité** (Phases 18-20, numérotation continue depuis v1.1)

- [~] **Phase 18: Vitesse mobile** - Pages publiques statiques/ISR avec cache public, polices via next/font, moins de JS, images dimensionnées, script analytics en cache long
- [~] **Phase 19: SEO on-page** - H1 par langue, metas EN réécrites, pages fr/de/sv de getting-here et wine-belgian-beer, JSON-LD Menu, og:image partout, retrait du « couple »
- [~] **Phase 20: Sécurité, accessibilité et mesure finale** - En-têtes de sécurité et CSP, contrastes/zones cliquables/aria-label, puis Lighthouse mobile >= 90 mesuré sur le site final

## Phase Details

### Phase 18: Vitesse mobile
**Goal**: Les pages publiques se chargent vite sur mobile : servies depuis le cache, sans polices ni JavaScript bloquants, sans décalage de mise en page
**Depends on**: Nothing (premier de v1.2)
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06
**Success Criteria** (what must be TRUE):
  1. La cause du rendu dynamique de `app/[locale]` est identifiée et supprimée : les réponses de /fr /en /de /sv n'envoient plus `cache-control: private, no-cache, no-store`
  2. Un second appel à /fr /en /de /sv renvoie `x-vercel-cache: HIT` (statique ou ISR avec cache public)
  3. Cinzel Decorative (H1, élément LCP) et les autres polices viennent de `next/font` (subset latin, swap, preload), sans requête de police externe ni blocage du rendu
  4. Le JS inutilisé et les polyfills reculent (composants serveur par défaut, sections sous la ligne de flottaison différées) et `/gcm/js/script.js` est servi avec un cache long immutable ou en `lazyOnload`
  5. Aucune image ne provoque de décalage de mise en page (width/height ou équivalent partout) ; l'apparence reste identique
**Plans**: TBD
**UI hint**: yes

### Phase 19: SEO on-page
**Goal**: Chaque page publique est trouvable avec un H1, des metas et des données structurées corrects dans les quatre langues, sans toucher au design
**Depends on**: Phase 18 (le rendu statique/ISR des routes `[locale]` est établi avant d'ajouter des pages et du JSON-LD)
**Requirements**: ONP-01, ONP-02, ONP-03, ONP-04, ONP-05, ONP-06, ONP-07, ONP-08, ONP-09, ONP-10, ONP-11
**Success Criteria** (what must be TRUE):
  1. Chaque accueil (fr/en/de/sv) a un seul H1 descriptif (EN « French-Thai Restaurant in Krabi Town ») ; le logo « GECKO CABANE » reste visuel mais n'est plus un H1 ; chaque page publique n'a qu'un H1
  2. L'accueil EN et `/en/french-restaurant-krabi` affichent les nouveaux title et description (« Best French-Thai Restaurant in Krabi Town », note 4,7★, cheffe Jariya, réservation en ligne, ouvert 7j/7)
  3. `getting-here-from-ao-nang` et `wine-belgian-beer-krabi` existent en fr/de/sv avec slugs traduits ; le sitemap les liste et les hreflang sont réciproques entre toutes les versions
  4. La page menu expose un JSON-LD Menu (MenuSection, MenuItem, prix en THB) généré depuis la carte et valide au Rich Results Test, en plus du JSON-LD Restaurant
  5. Toutes les pages internes ont og:image et balises Twitter ; plus aucun texte ou meta ne mentionne un « couple franco-thaï » ; les textes DE/SV des nouvelles pages ont été relus par un humain avant mise en production
**Plans**: TBD
**UI hint**: yes

### Phase 20: Sécurité, accessibilité et mesure finale
**Goal**: Le site envoie les en-têtes de sécurité et une CSP qui ne cassent rien, corrige l'accessibilité mobile sans changer l'identité visuelle, et atteint Lighthouse mobile >= 90 mesuré
**Depends on**: Phase 18 et Phase 19 (la CSP doit couvrir le chargement de scripts final ; la mesure Lighthouse porte sur le site complet)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, A11Y-01, A11Y-02, A11Y-03, PERF-07
**Success Criteria** (what must be TRUE):
  1. Les réponses du site envoient `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` et une `Permissions-Policy` minimale
  2. Une CSP est en place et, dans le navigateur, la réservation, l'admin, Google Maps, GTM/analytics, Sentry et Supabase fonctionnent sans violation bloquante
  3. Les contrastes signalés par Lighthouse sont corrigés sans changement visible de l'identité visuelle ; les zones cliquables mobiles font au moins 48 px ; les `aria-label` correspondent au texte visible
  4. Lighthouse mobile >= 90 sur /fr et /en, mesuré sur le site final avec CSP et correctifs a11y (base 72, LCP 3,8 s, TBT 680 ms), rapport conservé
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 18. Vitesse mobile | build orchestré (sans plans GSD) | Code livré, PERF-02/04/05 partiels | 2026-11-09 |
| 19. SEO on-page | build orchestré (sans plans GSD) | Code livré ; ONP-04/05/11 complets (de/sv publiés après validation du propriétaire 2026-11-10) ; ONP-09 partiel (« Frédéric » gardé, décision propriétaire) | 2026-11-10 |
| 20. Sécurité, accessibilité et mesure finale | build orchestré (sans plans GSD) | SEC et A11Y livrés (A11Y-02 partiel) ; PERF-07 non atteint en local | 2026-11-09 |

---
*Roadmap v1.2 créée le 2026-11-09. Historique : `.planning/milestones/`.*
