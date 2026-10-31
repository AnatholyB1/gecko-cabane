# Phase 15 : audit passe C (vérification par les objectifs)

Date : 2026-10-31. Branche `audit/p15-verify` sur `milestone/v1.1` (a399cdf). Rien de `15-VERIFICATION.md` n'est repris sans mesure.

## Gate (exécuté)
`npx vitest run` : 121 fichiers, 1781 passés, 1 ignoré, 0 échec. `npx tsc --noEmit` : 0 erreur. `npm run lint` : 0 erreur, 3 avertissements préexistants. `npx next build` : OK. (Les 3 échecs que 15-VERIFICATION signalait ne se reproduisent pas.)

## Méthode et limites du proxy
Routes temporaires `/gcm-p15/today` et `/gcm-p15/reservations` (préfixe `gcm`, hors matcher), vrai shell et vrais composants, sans garde admin, API simulée par `page.route` (Playwright installé hors dépôt). Supprimées, non commitées. Horloge simulée par `context.clock`. Le proxy ne prouve pas : Resend, cron, vraie base et RLS, authentification, polices réelles hors Chromium, iOS/Android (`type=date`), lecteurs d'écran.

## Exigence -> verdict
| Exigence | Verdict | Preuve |
|---|---|---|
| TDY-01 arrivées, couverts/40, à confirmer | VERIFIED (réserve M1) | 390 px, 14 réservations : bas des jauges 473 px, bas du premier Confirmer 742 px (<= 844) ; `aria-valuemax` lu des réglages ; arrivées par heure présentes mais à 1666 px du haut |
| TDY-02 créneaux 12h-21h | VERIFIED (réserve L1) | 10 colonnes, texte masqué « N couverts sur 40 à Hh » ; parité avec le prédicat SQL de la migration 008 relue (statuts pending/confirmed, `abs(...) < v_block`) ; `tests/today.test.ts` |
| RSV-01 statut en un tap | PARTIAL | PUT `{id,status}` émis, double clic = 1 seul PUT ; mais un second tap après succès, pendant le rechargement, émet un 2e PUT identique (H1) |
| RSV-02 liste dense, date, recherche | VERIFIED | 390 : 1 ligne entière au premier écran (3 à 768 et 1440), 0 débordement, recherche sans requête, états vide / chargement 4 s / erreur 500 puis « Réessayer » rétabli |
| RSV-03 tel: et WhatsApp | VERIFIED | cibles >= 44 px à 390/768/1440, aria-label avec le nom, tests de href |
| RSV-04 « + Réservation » global | VERIFIED | ouverture au clavier, focus sur le premier champ, Échap rend le focus au lien |
| RSV-05 boutons désactivés, heure de Krabi | VERIFIED | 00:30 Krabi (= 17:30 UTC la veille) : date du 31 et GET `?date=2026-10-31` ; bascule à minuit pendant que la page est ouverte : passe au 1er novembre et recharge ; ligne `aria-busy`, boutons désactivés pendant la requête |
| RSV-06 UAT | HUMAN_NEEDED | `15-UAT.md` complet et exécutable (A emails, B cron J+1, C couverts/KPI, D téléphone, nettoyage, hors 12h-22h, prérequis migration 019). Non exécuté |

## Mesures (390 / 768 / 1440, Aujourd'hui et Réservations, 0 / 1 / 14 / 60 réservations)
Débordement horizontal 0 partout. Cibles < 44 px : 0 (les inputs radio de 20 px sont couverts par leur label de 48 px). Texte < 14 px : 0 sauf 5 libellés de la barre de navigation à 12 px (exception E1 acceptée). Focus clavier : contour plein 2 px sur tous les arrêts, ordre = ordre visuel, alertdialog avec focus initial « Garder la réservation », Échap rend le focus au bouton d'origine. `prefers-reduced-motion` : durées 1e-6 s ; sans la préférence 0,12 à 0,26 s. Zoom 200 % : OK à 320 et 720 px de large CSS ; à 195 px (390 px a 200 %) débordement de 69 px sur les deux pages. Réseau lent (4 s) : état de chargement annoncé `aria-busy` ; échec GET : erreur + Réessayer ; échec PUT : message en ligne « La réservation n'a pas été modifiée » + Réessayer. Console : 0 erreur. 60 réservations à 390 : page de 8684 px.

## Écarts aux maquettes D2
Mêmes blocs, même ordre, jetons identiques. Écarts : 0 réservation, la maquette garde les jauges, le code ne montre que l'état vide ; la date du jour dans la page « Réservations » n'est pas rafraîchie à minuit (pas de minuteur).

## Findings
- HAUTE | src/components/admin/reservations/use-reservation-actions.ts:57 | `busy` est vidé dans `finally` avant la fin du rechargement : la ligne reste affichée avec ancien statut et boutons actifs (mesuré : 2 PUT `confirmed` identiques). Le PUT n'a pas de garde d'idempotence (src/app/api/reservations/route.ts:288-347) : un double tap envoie deux emails de confirmation ou d'annulation | garder la ligne occupée jusqu'à la fin de `onChanged()` (attendre le refetch) ou mettre à jour la ligne localement ; option serveur : n'envoyer l'email que si le statut change.
- MOYENNE (M1) | src/components/admin/reservations/TodayView.tsx:130-166 | les réservations en attente apparaissent deux fois (carte « à confirmer » puis « Arrivées ») ; avec 10 en attente à 390 px la carte occupe 1700 px et « Arrivées du jour » démarre à 2605 px | limiter la carte à 3 lignes avec « Voir les N autres » ou ne pas répéter les en attente dans les arrivées.
- MOYENNE | src/components/admin/reservations/TodayView.tsx:118 | 0 réservation : aucune jauge ni capacité (la maquette montre 0/40) ; la cheffe ne voit pas « 40 libres » | afficher les jauges à 0.
- BASSE (L1) | src/utils/today.ts:34 | `SLOT_HOURS` commence à 12 : le créneau public 11:30 n'a pas de colonne propre et le libellé « Déjeuner 12h-15h » l'exclut alors qu'il compte au service | ajouter 11h ou renommer.
- BASSE | src/components/admin/reservations/ReservationsView.tsx:47 | `krabiTodayYmd()` calculé au rendu sans minuteur : Hier/Aujourd'hui/Demain périmés après minuit | réutiliser le minuteur de TodayView.
- BASSE | reservations.css | à 195 px de large (zoom 200 % sur 390 px) débordement horizontal de 69 px (`.rv-gauges`, `.rv-datebar`) ; correct à 320 px | `min-width: 0` / retour à la ligne.

## Non prouvé
RSV-06 entier (emails, cron J+1, KPI, base réelle), migration 019 appliquée, RLS et garde admin, iOS/Android (`type=date`/`time`), lecteur d'écran, polices réelles, comportement quand `/api/settings` échoue (non simulé).
