# Phase 8 - Correctifs des audits

Branche `fix/p8-audit` (base `milestone/v1.0-phase8`). Commits: 36be1dd (cron), ed791ba (collecte/email/doc/tests), fdb58c4 (typage). Chaque finding a ete verifie dans le code avant correction.

## Corriges

| Finding | Decision | Commit |
|---|---|---|
| B-01 gabarit hors try apres claim | Rendu du gabarit AVANT la claim: une exception donne 500 sans claim, semaine renvoyable. Erreur du update de liberation verifiee et capturee. | 36be1dd |
| B-02 relance au lundi suivant | Entrees cron supplementaires lundi 02:00 et 04:00 UTC (vercel.json + test). Restent dans la fenetre `shouldSendNow` (>= 08:00 Krabi), idempotentes grace a la claim `report_sent_at`. Le nombre de crons passe de 4 a 6, compatible avec un plan non Hobby (deja 4 entrees, dont des horaires multiples); `?send=1` reste le rattrapage manuel au-dela. | 36be1dd |
| B-03 cle d'idempotence / corps different | Si une lecture (alerts + narrative) est deja stockee sur la ligne, elle est reutilisee: relance = meme corps, meme cle, pas de second appel IA. Cle inchangee. Limite: une saisie manuelle faite entre l'echec et la relance ne regenere pas la lecture. | 36be1dd |
| W-01 mois / snapshot derives de `now` | Mois derive de `week.end`; snapshot et delta ecrits uniquement pour la semaine qui vient de finir (`previousWeek(now)`), sinon delta null + `partial`, snapshot non ecrit. | ed791ba |
| W-02 mois non consecutifs / re-run | Ecart de mois > 1 => null + `partial`. Un re-run n'ecrase plus le snapshot deja stocke (trio snapshot/mois/delta conserve). | ed791ba |
| W-03 `Math.max(0, ...)` | Delta brut negatif (remise a zero) => null pour l'ensemble; delta nul legitime reste 0. Delta documente (approximation lundi-lundi). | ed791ba |
| W-04 erreur de lecture `existingRow` | Echec ferme: Sentry + 500, aucune collecte ni appel Bright Data. | 36be1dd |
| W-05 / F-06 ecrasement par null | `preserveExistingValues`: une valeur null ne remplace pas une valeur existante non nulle; statut de source precedent conserve. | ed791ba |
| W-08 claimError => skipped | Repond 500 (visible du monitoring). | 36be1dd |
| W-11 URL TripAdvisor refusee consomme la tentative | `configured` teste `isAllowedTripadvisorUrl`. | ed791ba |
| W-13 faux Supabase / tests | Faux collecte: filtres appliques et journalises; faux route: erreur de lecture, de claim, de liberation, exception du gabarit. Tests ajoutes: B-01, B-02/B-03 (meme cle et meme corps, 1 appel IA), changement de mois via `collectDbKpis`, mois saute, remise a zero, semaine ancienne, bornes de semaine, F-02, F-03, F-04, F-05, W-04, W-05, vercel.json. | ed791ba, 36be1dd |
| F-02 note manuelle | N'apparait que dans le rapport TEST (proprietaire); absente du live. | ed791ba |
| F-03 Bearer | SHA-256 des deux valeurs + `timingSafeEqual`. | 36be1dd |
| F-04 `select('*')` consentements | Colonnes minimales (`id, email, consent, consented_at, confirmed_at, confirmation_sent_at`); l'email reste necessaire au regroupement, seul le compteur sort. | ed791ba, fdb58c4 |
| F-05 TripAdvisor payant | Appel uniquement pour la semaine precedente courante (`skipPaid` sinon, valeur existante conservee). | 36be1dd |
| W-06 latence GSC | Documente dans `docs/kpi/KPI-SETUP.md` (clics du lundi partiels). Le code n'est pas modifie. | ed791ba |
| F-10 test Bearer faux avec dry&send | Ajoute. | 36be1dd |

## Reportes (non corriges)

| Finding | Raison |
|---|---|
| F-01 `sendDefaultPii: true` (sentry.*.config.ts) | Preexistant, hors perimetre phase 8. A signaler au proprietaire: a traiter AVANT la bascule live KPI-08. |
| W-06 (partie code: alerte `gsc_clicks_drop` sur semaines partielles, null si 0 jour couvert) | Hors liste demandee; doc seulement. |
| W-07 test consomme la semaine avant live | Comportement documente, pas de changement (decision produit: envoi live seulement apres 2 rapports TEST, KPI-08). |
| W-09 saisie manuelle apres coup, PUT partiel, course insert (F-07) | Hors fichiers autorises par la tache a part `kpi/route.ts` non cite dans la liste; decision D-03 a realigner avec le proprietaire. |
| W-10 motif TripAdvisor `#N of M` | Necessite un echantillon reel (A4), pas disponible sans appel externe. |
| W-12 page admin `previous` | `src/app/admin/kpi/page.tsx` hors perimetre autorise. |
| W-14 libelles/contrat d'erreur | Changement de contrat, hors demande. |
| I-01..I-09 | Non critiques; I-04 (Bearer) et I-09 (note manuelle) sont couverts par F-03 et F-02. I-05, I-06, I-07, I-08 reportes. |
| F-08, F-09 | Info, aucun correctif requis / doc seulement. |

## Non prouve

Aucun test contre Resend, Supabase, Search Console, Bright Data ou Claude reels (pas d'appel externe). La relance Resend avec meme cle est prouvee uniquement par construction (meme corps), pas contre l'API. Migration 018 toujours non appliquee (voir 08-VERIFICATION.md). Traçabilite REQUIREMENTS/ROADMAP non touchee.
