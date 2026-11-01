# Phase 15 : VERIFICATION (exigence -> preuve)

Date : 2026-10-31. Gate final : `npx vitest run` (1705 passés, 3 échecs préexistants/instables expliqués dans 15-CONTEXT.md), `npx tsc --noEmit` 0 erreur, `npm run lint` 0 erreur (5 avertissements préexistants), `npx next build` OK.

## Exigence -> test

| Exigence | Preuve |
|---|---|
| TDY-01 arrivées par heure, couverts sur `max_covers`, à confirmer en un tap | `tests/reservations-ui.test.ts` (« max_covers vient des réglages », pas de `40` dans TodayView, `computeToday(rows, settings)`) ; `tests/today.test.ts` (P15a : pic, total, regroupement) ; navigateur : jauge dîner = pic recalculé indépendamment (33), `aria-valuemax=40` lu des réglages, titre « 3 à confirmer », Confirmer en un tap, premier écran 390 : bas des jauges 473 px, bas du premier Confirmer 711 px (<= 844) |
| TDY-02 capacité par créneau 12h-21h cohérente avec la disponibilité publique | `tests/today.test.ts` (parité avec le prédicat SQL) ; navigateur : 10 colonnes avec texte masqué « N couverts sur 40 à Hh », icônes d'alerte >= 30 et 40, hachures |
| RSV-01 statuts en un tap via `nextActions` | `tests/reservations-ui.test.ts` (actions par statut, Absent/Annuler avec dialogue, pas de « Rétablir », « Non présenté ») ; `tests/reservation-status.test.ts` ; navigateur : PUT émis `{"id":5,"status":"confirmed"}`, annulation et Absent via `alertdialog`, focus initial « Garder la réservation », Échap rend le focus au bouton |
| RSV-02 liste dense, date, recherche, filtres, états | `tests/reservations-ui.test.ts` (`matchesQuery` accents/téléphone local, filtres, compteurs, groupes Déjeuner/Dîner, synthèse) ; navigateur : recherche et puces sans requête réseau (0 requête), navigation par jour (`GET ?date=`), états vide / aucun résultat / chargement / erreur avec barre de date conservée, 4 lignes entières visibles à 390 |
| RSV-03 `tel:` et WhatsApp, occasion/allergies/notes visibles | `tests/reservations-ui.test.ts` (hrefs `tel:+66…`, `https://wa.me/…`, `target=_blank`, aria-label avec nom, pas de lien pour numéro invalide, tags visibles) ; navigateur : cibles >= 44 px |
| RSV-04 « + Réservation » global | `tests/reservations-ui.test.ts` (TopBar, AdminProviders, `?nouvelle=1`, formulaire déplacé, validation client) ; `tests/admin-shell.test.ts` (href conservé) ; navigateur : ouverture depuis Aujourd'hui, Réservations et jour vide, focus piégé (Tab x25), Échap rend le focus à « + Réservation », date par défaut = jour affiché, échec d'ajout : saisie conservée + bandeau, succès : toast + liste rechargée, `?nouvelle=1` ouvre puis retire le paramètre |
| RSV-05 boutons désactivés pendant la requête, heures de Krabi | `tests/reservations-ui.test.ts` (3 boutons `disabled`, `aria-busy`, libellé « Clôture… », heure brute `19:30:00 -> 19:30`) ; `tests/krabi-time.test.ts` (P15a) ; `tests/reservations-ui-payloads.test.ts` (pas de `Date`) ; navigateur : ligne `aria-busy`, tous ses boutons `disabled`, « Confirmation… », autres lignes actives ; page par défaut = `krabiTodayYmd()` côté serveur |
| API et emails figés (preuve d'identité des payloads) | `tests/reservations-ui-payloads.test.ts` : PUT statut/source/notes, DELETE, GET jour, POST manuel comparés octet pour octet à la transcription littérale de l'ancien code ; corps réellement émis par `adminFetch` (mocké) ; aucun `JSON.stringify`/`fetch` dans les composants ; routes sans `allergies` ; validateur : corps existant donne la même valeur (mêmes clés) |
| Allergies (additif) | migration 019 (non appliquée) ; `tests/reservations-ui-payloads.test.ts` (clé omise si vide, ajoutée en dernier sinon, `Allergies invalides`) ; `tests/migrations.test.ts` (séquence) |
| DSN-06 `useConfirm` | `tests/admin-ui-confirm.test.ts` (cliquet : `reservations/page.tsx` retiré) |
| RSV-06 emails, cron J+1, KPI | NON prouvé ici : `15-UAT.md` |

## Mesures navigateur (Chromium headless 1.64, `next build` + `next start` port 3105, API simulée)
44 contrôles scriptés, 44 OK. Pour Aujourd'hui et Réservations à 390, 768, 1440 (et la feuille de saisie à 390) : débordement horizontal 0 ; cibles interactives < 44 px : 0 ; texte < 14 px : 0 sauf les 5 libellés de la barre de navigation (12 px, exception E1 acceptée par le propriétaire, shell P12) ; focus clavier : contour plein 2 px ; `prefers-reduced-motion` : transition de la feuille <= 0,001 s ; aucune erreur console hors les 500 injectés. Captures : `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-p15\shots` (hors dépôt). Comparaison aux maquettes D2 : mêmes blocs et ordre (jauges, à confirmer, capacité, arrivées ; dialogue de saisie ; états), icône + libellé pour chaque statut, jetons `--adm-*`.

## Proxy de test : ce qu'il ne prouve pas
Une route temporaire `/gcm-p15/*` (préfixe `gcm`, hors matcher du middleware) montait le vrai shell et les vrais composants sans garde admin, avec `page.route('**/api/**')` simulant l'API en mémoire. **Retirée avant commit** (aucun fichier `gcm-p15` dans le dépôt ; le build final ne la liste pas). Elle ne prouve pas : les vrais emails (Resend), le vrai cron J+1 et KPI, la vraie base et RLS, l'authentification/garde admin, ni les polices réelles en production ni iOS/Android (`type=date`, `type=time`). Le temps de Krabi des tests est l'horloge de la machine.

## UAT propriétaire (RSV-06)
À renseigner après exécution de `15-UAT.md` (hors service 12h-22h Krabi).

## UAT propriétaire (RSV-06), passée le 2026-11-02 à 01h40-01h55 heure de Krabi (hors service)

Environnement : serveur local (`next dev`, branche `milestone/v1.1`) branché sur la VRAIE base (projet `portfolio`), session admin du propriétaire dans Chrome, emails réels envoyés par Resend à `anatholyb@gmail.com`. Migrations 019-022 appliquées avant. Lignes de test `TEST UAT 1..5` supprimées par SQL à la fin (14 réservations avant et après).

| Étape | Résultat | Preuve |
|---|---|---|
| A1 « + Réservation » WhatsApp, sans email | OK | ligne créée (3 nov 19:30, 2 couverts, `allergies` null), aucun email envoyé |
| A2 réservation depuis le site public, avec email | OK | statut `pending`, email « Votre demande de réservation — Gecko Cabane » reçu (en attente de confirmation) |
| A3 Confirmer (1 tap) | OK | 1 seul PUT + 1 GET de rechargement ; 1 seul email « Réservation confirmée — Gecko Cabane » |
| A4 Annuler avec email | OK | dialogue : « Un email d'annulation sera envoyé à … » ; 1 seul email « Réservation annulée — Gecko Cabane » |
| A4 Annuler sans email | OK | dialogue : « Aucun email ne sera envoyé : aucune adresse n'est renseignée » ; aucun email |
| A5 Terminer, Absent | OK | aucun email ; dialogue d'Absent : « Il ne recevra pas l'invitation à laisser un avis le lendemain » |
| C1/C2 recomptage | OK | en-tête de liste : 5 réservations/10 couverts, puis 4/8, 3/6 après chaque annulation ; conforme à la base |
| B cron d'avis J+1 | NON PASSÉ (volontairement) | le lancer à la main aurait envoyé de vraies invitations à tous les clients éligibles d'hier ; à observer au cron normal de 11h Krabi |
| C3 capacité refusée à 33+8 | NON PASSÉ | nécessite de remplir 33 couverts ; la règle est couverte par `tests/today.test.ts` (parité 20 000 cas avec le SQL de 008) |
| C4 KPI du lundi | NON PASSÉ | aucun cron KPI lancé |
| D ergonomie téléphone | NON PASSÉ | écran de bureau seulement (pas de vrai téléphone) |
| 17a « Complet ce soir » de bout en bout | NON PASSÉ | le bouton agit sur la date du jour et le site public réel : à tester à un moment choisi |

Constats : (1) après « Confirmer », les boutons Terminer/Absent/Annuler apparaissent à l'endroit où se trouvait « Confirmer » (le curseur se retrouve sur « Absent ») : un double tap rapide ouvrirait le dialogue d'Absent, qui demande confirmation ; pas d'erreur possible sans second geste. (2) Une réservation ancienne a une date aberrante `70902-02-01` (non liée à l'UAT, non modifiée). (3) Aucune erreur dans la console du navigateur.
