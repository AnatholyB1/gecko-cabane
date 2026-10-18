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
