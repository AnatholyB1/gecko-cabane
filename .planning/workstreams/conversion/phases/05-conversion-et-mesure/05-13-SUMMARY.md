# 05-13 — Avis ajoutés et vérification finale — SUMMARY

**Statut :** Task 1 terminée ; Task 2 (preview) **non faite**.

## Task 1 — avis ajoutés (commit b4f7a06)
`SOCIAL_PROOF.reviews` contient les 3 avis ; test de fidélité (texte, prénom, pays, lien retrouvés dans `REVIEW-CANDIDATES.md`) ; `aggregateRating` 4,7 / 1 062 émis. 604 tests, `tsc`, lint (0 erreur) et `npm run build` OK. `whitespace-pre-line` ajouté pour conserver les paragraphes.

## Task 2 — vérification sur preview : NON FAITE
Elle exige d'appliquer les migrations 015/016 en production et de pousser la branche (preview Vercel). Rien n'a été appliqué ni poussé.

### Mesure PageSpeed (SEO-08) — cible NON atteinte en local
API PageSpeed : HTTP 429 (quota) avant et après, donc pas de baseline production. Mesure locale Lighthouse 12 mobile (simulate, `next start` sur un poste de dev chargé, donc bruitée) :

| Essai | Score | LCP | FCP | TBT |
|---|---|---|---|---|
| initial | 71 | 5,7 s | 1,4 s | 280 ms |
| Sentry Replay/Profiling différés (annulé) | 61 | 5,3 s | 1,1 s | 730 ms |
| bruit SVG désactivé (annulé) | 60-63 | 5,5 s | 1,5-2,2 s | 470-770 ms |

L'élément LCP est un SVG botanique décoratif (opacité 0,07) avec ~2,2 s de « element render delay » : le thread principal est saturé (script ≈ 1 à 1,7 s, style/layout ≈ 0,8 à 1 s). Les deux leviers testés (Sentry différé, filtre de bruit) n'ont rien amélioré et ont été annulés. Pistes non testées : polices (4 familles Google), animations `gc-float` sur les décors, taille du bundle client (≈ 170 Ko, 46 % inutilisé). **SEO-08 reste ouvert** ; à remesurer sur la preview (CDN, poste propre).

## Restant pour le propriétaire
Voir `OWNER-CHECKLIST.md` (migrations, variables Vercel, Plausible, LINE, photo du couple, texte DE, brouillon confidentialité) puis les 9 étapes de vérification de la preview du plan 05-13.

## Mise à jour 2026-10-18 — preview Vercel (propriétaire : « approved » → branche `ws/conversion` poussée)

Preview non-production, lien d'accès temporaire ; **aucune migration appliquée, aucune variable modifiée**.

### Mesures Lighthouse 12 mobile (simulate) sur la preview
| Build | Score | LCP | TBT | Élément LCP |
|---|---|---|---|---|
| 21c740f | 59 / 66 | 4,8 / 4,4 s | ≈ 780 ms | SVG décoratif botanique |
| 5b0d7b8 (SVG en ligne + Replay/Profiling Sentry retirés) | 79 / 69 / 64 | 4,4 / 4,4 / 4,5 s | 200 / 560 / 710 ms | `<h1>` (police) |

Amélioration réelle mais **cible non atteinte** (≥ 85, LCP < 2,5 s) et très variable d'un essai à l'autre. Le LCP est maintenant le titre : « element render delay » ≈ 2 à 2,6 s (CSS bloquant + 5 polices préchargées ≈ 158 Ko + hydratation ≈ 400 ms + chunk Sentry/React ≈ 170 Ko). Pistes restantes : réduire/différer les polices (4 familles), alléger l'hydratation (ReservationForm, widgets client), ne charger Sentry client qu'au besoin. **SEO-08 reste ouvert.** Le Replay et le Profiling Sentry côté client ont été retirés (décision technique à valider par le propriétaire).

### Vérifications fonctionnelles sur la preview (HTTP, sans compte)
- `/fr`, `/en`, `/fr/menu`, `/fr/review` : 200.
- `/fr` : les 3 avis (David C, Jean-Louis305, Swen S) sont dans le HTML ; JSON-LD Restaurant avec `aggregateRating` 4,7 / 1062 ; « Comment venir », « Afficher la carte », « Itinéraire », ligne PromptPay présents.
- `/fr/review?src=qr` : liens `/api/review/go?t=google|tripadvisor&src=qr` ; le lien Google répond 302 vers `search.google.com/local/writereview` ; formulaire « Un souci ? » présent.
- `/admin/avis` : redirigé vers le login (garde admin OK).
- **Non vérifié** : email « Un souci ? » reçu, comptage en base (migration 016 non appliquée), création/source de réservation (migration 015 non appliquée), événements Plausible (compte non créé), bouton LINE (URL non définie), rendu visuel mobile, carte chargée au clic.
