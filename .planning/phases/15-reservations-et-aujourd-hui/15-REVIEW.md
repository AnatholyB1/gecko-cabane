# Phase 15 - Revue de code (passe A)

Branche `audit/p15-review` (milestone/v1.1, HEAD a399cdf). Date 2026-10-31. Lecture seule sur le code.

## Verdict
Livrable solide : API figee respectee (aucun fichier `src/app/api/reservations*`, `resend.ts`, cron touche), parite SQL de disponibilite correcte, migration 019 additive. Pas de critique. Une haute (double PUT possible = double email), cinq moyennes.

## Gate (re-execute)
- vitest : 1780 passes / 1 echec / 1 saute (121 fichiers). L'echec est `tests/admin-shell.test.ts` NAV-02, timeout 5000 ms sous charge (build lance en parallele, 5648 ms) ; passe seul (19/19). Le rapport annonce 1705 passes et 3 echecs : chiffres non reproduits.
- tsc --noEmit : 0 erreur. eslint : 0 erreur, 3 avertissements (le rapport en annonce 5).
- next build (variables publiques factices) : OK ("Compiled successfully"), routes /admin et /admin/reservations presentes.

## Findings (SEV | fichier:ligne | probleme | correctif)

HAUTE | src/components/admin/reservations/use-reservation-actions.ts:36-48 | `finally` retire `busy` des que le PUT repond, alors que `onChanged()` (refetch) n'est ni attendu ni suivi : la ligne montre l'ancien statut avec ses boutons actifs jusqu'au retour du GET (et sans fin si le refetch echoue, donnees perimees conservees). Un second tap renvoie un PUT. PUT /api/reservations n'est pas idempotent : chaque `confirmed`/`cancelled` renvoie un email client (route.ts:324-347) et reecrit confirmed_at/cancelled_at. | Garder la ligne occupee jusqu'a la fin du refetch (refetch qui renvoie une promesse) ou appliquer le statut localement (optimiste) ; a defaut desactiver l'action deja appliquee.

MOYENNE | src/components/admin/reservations/NewReservation.tsx:109,114 | `onOpenChange={setIsOpen}` autorise Echap/fond/Fermer pendant le POST. Le formulaire est demonte : sur echec, `setBanner` part dans le vide, aucun toast, la saisie est perdue. Meme perte sur Fermer/Echap accidentel d'un long formulaire. | Ignorer la fermeture pendant `pending` ; toast d'erreur de secours ; confirmer la fermeture si le formulaire est modifie.

MOYENNE | src/components/admin/reservations/TodayView.tsx:53-58 | Aucun rafraichissement automatique des reservations : seul `now` tourne (60 s). Une page "Aujourd'hui" ouverte pendant le service ne voit ni les reservations publiques entrantes, ni les "a confirmer", ni la capacite. | Refetch sur `visibilitychange`/focus et a chaque tick ; afficher l'heure de derniere mise a jour.

MOYENNE | src/components/admin/reservations/ReservationRow.tsx:136-149 | Le bouton qui a le focus passe `disabled` puis est remplace (statut change, `key={a.to}`) : le focus clavier retombe sur body apres chaque action, aucune gestion de focus ; seule annonce : le toast. | `aria-disabled` pour le bouton presse (Button le fait deja avec `loading`) et restaurer le focus sur la ligne ou la suivante apres succes.

MOYENNE | tests/reservations-ui.test.ts:222-262 ; aucun test de `use-reservation-actions.ts` | Double clic, ligne occupee, echec + Reessayer, annulation de dialogue, fermeture pendant POST ne sont couverts que par rendu statique ou `readFileSync(...).toContain('<TodayView')`. Le test "aucun fichier gele touche" ne verifie que `resend.ts` sans "allergies" : creux. La HAUTE ci-dessus n'est attrapee par aucun test. | Tester le hook (deux `run` successifs, refetch en attente) ; remplacer le test "gele" par un diff/hash de `src/app/api/reservations` et `src/utils/resend.ts` contre c6bc779.

MOYENNE | tests/admin-shell.test.ts:54 | Timeout 5000 ms sur import dynamique a froid : echoue dans la suite complete des que la machine est chargee (reproduit), malgre le commit "longer timeout". `npm run build` (gate vitest) devient intermittent. | Timeout en 3e argument de `it` ou `testTimeout` global 20000 ; precharger en `beforeAll`.

BASSE | TodayView.tsx:51,60 | Libelles "Dejeuner 12h-15h" / "Diner 18h-22h" contredisent `SERVICE_SPLIT_MINUTES` = 16:00 (15h30 compte dejeuner, 17h diner). | Libelles "avant 16h" / "des 16h", derives de la constante.
BASSE | today.ts:79 vs 124 | "Couverts occupes par heure" exclut `completed` : marquer Terminee fait baisser le creneau (identique au SQL public, donc voulu, mais non signale). | Phrase d'aide ou compter `completed` pour l'heure en cours.
BASSE | TodayView.tsx:73 | `role="meter"` : `aria-valuenow` (pic) peut depasser `aria-valuemax` (saisie manuelle sans controle de capacite) : ARIA invalide. | `Math.min(peak, max)` + texte du vrai pic.
BASSE | TodayView.tsx (Arrivals) + ReservationRow.tsx:77 | Noms de client (h3) au meme niveau que les heures (h3). | Nom en h4.
BASSE | ReservationsView.tsx:35 | `today = krabiTodayYmd()` calcule au rendu, non rafraichi apres minuit Krabi (raccourcis Hier/Aujourd'hui/Demain) ; `useState(initialDate)` ignore un changement de `?date=` sur composant monte. | Horloge partagee ; `key={initialDate}`.
BASSE | NewReservation.tsx:71-75 | `history.replaceState(null, ...)` ecrase l'etat interne du routeur Next. | Passer `window.history.state` ou `router.replace`.
BASSE | actions.ts:27-30 | "Un email d'annulation sera envoye" : le PUT n'envoie que si Resend est configure, best-effort, erreurs avalees. | "sera envoye si possible".
BASSE | TopBar.tsx:21 | `now = new Date()` rendu serveur : date d'en-tete non rafraichie apres minuit. | Composant client avec horloge partagee.
BASSE | supabase/migrations/019_reservation_allergies.sql | Non appliquee : formulaire manuel avec allergies = 500 tant que non appliquee (documente). Additive (`add column if not exists`, nullable, check <= 500 coherent avec validateur et maxLength) ; RLS inchangee (politique admin 007 couvre la colonne). Pas de retour documente. | Ajouter en commentaire `alter table public.gecko_reservations drop column allergies;`.

Total basses : 9.

## Sondes propres (verifiees)
- Parite SQL : `slotUsedCovers` = `abs(delta)/60 < v_block`, statuts pending+confirmed, parsing max/bloc `^\s*\d+\s*$` sinon 40/120 (migration 008:95-111), `hasCapacity` = `used + party <= max`.
- Fuseau Krabi : `bangkokNow` (Intl Asia/Bangkok, h23), plus de date UTC ; dates formatees par `Date.UTC`, sans parsing local ; `toMinutes` tolere `HH:MM:SS` ; `addDaysYmd` sans fuseau. Minuit : l'URL change, la requete repart (cle url+tentative, AbortController, reponses obsoletes ignorees).
- Pic simultane : intervalle semi-ouvert [debut, debut+bloc), sondes aux debuts ; 12:00 et 14:00 non simultanes.
- API figee : aucun diff sur `src/app/api/reservations` ni `resend.ts` ; corps PUT/POST/DELETE/GET construits par `requests.ts` ; `allergies` omis si vide ; la route manuelle fait `...parsed.value` donc persiste `allergies` ; cron avis J+1 (`REVIEW_ELIGIBLE_STATUSES = confirmed, completed`) et KPI non touches ; le texte "Absent : pas d'invitation d'avis" est exact.
- Transitions UI <= ce que PUT accepte ; pas de "Retablir" ; Annuler/Absent via `useConfirm` (focus initial sur l'action non destructrice).
- Erreurs : echec PUT laisse la ligne inchangee + alerte en ligne + Reessayer + toast ; notes : saisie conservee ; formulaire manuel : echec garde la saisie tant que le dialogue reste ouvert.
- Accessibilite : noms accessibles par ligne, contacts tel/WhatsApp (`noopener noreferrer`), cibles 44 px (36 px seulement souris fine >= 1024), statut jamais par la couleur seule (badge texte, icones + libelles, texte masque des creneaux), dialogue base-ui avec focus pris/rendu.
- React Compiler : pas de mutation d'etat au rendu, refs mutees dans callbacks/effets, un effet asynchrone dans `useAdminQuery`, lint propre.
- Telephone : `toE164` rejette le texte libre, ne devine aucun pays. Migration : check 500 caracteres >= longueur JS (pas de faux rejet).
- Shell : `NewReservationLink` garde un href valide (`?nouvelle=1`) et ouvre le dialogue global sans quitter la page.
