# Phase 15 : correctifs des findings d'audit

Branche `fix/p15-audit` (base `milestone/v1.1` b685cc4, puis `milestone/v1.1` refusionné avant rapport). Date 2026-10-31.
Sources : `15-REVIEW.md`, `15-SECURITY.md`, `15-AUDIT-VERIFY.md`. Contrainte tenue : `src/app/api/reservations/**`, le PUT, la machine à statuts, `src/utils/resend*`, le cron J+1 et les KPI ne sont pas modifiés (comparaison de contenu avec c6bc779 dans `tests/p15-audit-fixes.test.ts`).

Commits : A = `5032b47` (sécurité), B = `51012a2` (interface), C = `e4863cb` (CSS zoom 200 %).

## Corrigés

| Finding | Disposition | Commit |
|---|---|---|
| HAUTE `use-reservation-actions.ts` : `busy` retiré avant la fin du refetch, second tap = second PUT = second email | Logique extraite dans `action-controller.ts` (pur, testé). Verrou synchrone par ligne dès le tap (dialogue de confirmation compris) ; la ligne reste occupée jusqu'à la FIN du rechargement (`refetch` renvoie maintenant une promesse `true/false`, plafonnée à 20 s). Après un PUT réussi le statut est appliqué localement (`withStatus`) jusqu'à des données fraîches : même si le rechargement échoue, l'ancien statut n'est plus affiché et une action déjà appliquée est ignorée. Échec du rechargement : ligne libérée, toast « statut enregistré, liste non actualisée ». | B |
| MOYENNE `NewReservation.tsx` : fermeture pendant l'envoi, échec sans retour, saisie perdue | Échap, fond, croix et « Fermer » ignorés pendant l'envoi (croix désactivée). Échec : bandeau (amené dans la vue) + toast d'erreur, saisie conservée. Saisie non vide : dialogue « Abandonner cette réservation ? / Continuer la saisie ». | B |
| MOYENNE `TodayView.tsx` : aucun rafraîchissement | `useAutoRefresh` : rechargement chaque minute et au focus / visibilité (écart minimal 5 s, suspendu pendant une action de statut). Les données restent affichées (pas d'écran de chargement, `aria-busy` seulement sans données), l'état local (carte dépliée) est conservé, les requêtes obsolètes sont annulées par `useAdminQuery`. | B |
| MOYENNE `ReservationRow.tsx` : focus clavier perdu | `aria-disabled` au lieu de `disabled` (`Button` ignore le clic quand `aria-disabled`), et le focus est rendu à la ligne (`tabIndex=-1`) si le bouton pressé disparaît. | B |
| MOYENNE (M1) doublon des « en attente » | Carte « à confirmer » limitée à 3 lignes + « Voir les N autres » (`aria-expanded`) ; les en attente ne sont plus répétées dans « Arrivées du jour » (note explicative). Mesure 390 px, 10 en attente : début de « Arrivées du jour » 2498 px avant, 1496 px après ; page 3640 px puis 1888 px. Jauges à 0/40 sans réservation (l'état vide passe dans la section arrivées). | B |
| BASSE libellés de jauge vs coupure 16 h | « Déjeuner · avant 16h » / « Dîner · dès 16h », dérivés de `SERVICE_SPLIT_MINUTES`. Le créneau 11h30 est couvert par le libellé « avant 16h » (colonnes du graphique inchangées : choix « renommer »). | B |
| BASSE `aria-valuenow` > `aria-valuemax` | `aria-valuenow` borné, `aria-valuetext` « 54 sur 40 » porte le vrai pic. | B |
| BASSE Hier / Aujourd'hui / Demain périmés | Horloge partagée `useNow` (minute + focus) ; `key={initialDate}` sur la page. Mesuré : 23:59:20 puis +61 s, « Aujourd'hui » devient « Hier ». | B |
| BASSE débordement à 195 px | `min-width: 0`, grille des cartes `minmax(0,1fr)`, ligne en une colonne sous 260 px, graphique horaire défilant. Les contenus de page tiennent à 195 px. Reste 69 px venant du shell (en-tête + barre de navigation basse, phase 12), hors périmètre. | B, C |
| BASSE `mailto:` | `mailtoLink` : validation stricte (refuse `? & , % ; : < > " ' \` et espaces) puis `encodeURIComponent` ; sinon texte sans lien. | B |
| BASSE `history.replaceState(null…)` | Passe `window.history.state`. | B |
| SÉCURITÉ redirection ouverte login admin (`login/actions.ts`, `api/auth/login/route.ts`) | `safeAdminRedirect` : chemin interne `/admin…` seulement (refuse `//evil`, `https://`, `\`, `@`, contrôles, `%5C`), sinon `/admin`. | A |
| SÉCURITÉ `auth/callback` `next` | `safeNextPath` : un seul `/` en tête, ni `@`, ni `\`, ni schéma, sinon `/admin`. 50 cas d'attaque dans `tests/safe-redirect.test.ts`. | A |
| TESTS creux | `tests/reservation-actions.test.ts` (14 cas : double clic, second tap pendant le rechargement, ligne occupée, annulation de dialogue, échec puis Réessayer, refetch en échec / rejeté / muet) ; `tests/p15-audit-fixes.test.ts` : comparaison de contenu avec `git show c6bc779:<chemin>` de `src/app/api/reservations/**`, `cron/**`, `kpi/**`, `resend*`, `review-invitations`, `kpi-*` (+ aucun fichier ajouté, PUT sans `allergies`) ; sauté si le commit n'existe pas (clone superficiel). Test de ligne occupée mis à jour (`aria-disabled`). | A, B |
| BASSE migration 019 sans retour | Note de rollback en commentaire SQL (pas exécutée). | B |

## Documenté seulement (non codé)

- **PUT n'accepte pas `allergies`** : lacune fonctionnelle, API figée. Une allergie saisie à la création n'est pas modifiable ensuite. Décision produit : ajout additif validé (500 car., `string|null`) après levée du gel. Verrouillé par un test (PUT sans `allergies`).
- **`GET /api/auth/logout`** déconnecte par GET (CSRF de déconnexion, impact nul sur les données) : retirer le GET ou le limiter à POST (hors périmètre gelé, à décider).
- **`GET /api/settings` public** fait `select('*')` : sélectionner seulement les clés du site public, ou passer en admin (la vue Aujourd'hui lit `max_covers` par cette route).
- **Rollback migration 019** : voir le commentaire en tête de `supabase/migrations/019_reservation_allergies.sql` (`drop column if exists allergies`, destructif, exporter avant, redéployer le code avant de supprimer la colonne).
- **RSV-06** : `15-UAT.md` reste à exécuter par le propriétaire (emails réels, cron J+1, KPI, base réelle, migration 019 appliquée).
- Basses non traitées : `completed` exclu du pic horaire (identique au SQL public, voulu), noms en `h3` au niveau des heures, libellé « sera envoyé » du dialogue d'annulation, date d'en-tête (`TopBar`) rendue serveur, sondes de stabilité `kpi-admin-wiring`.

## Vérifications

Navigateur : Chromium headless, Playwright hors dépôt (`gecko-pw-f15`), route de test temporaire hors matcher (`/gcm-p15/*`, supprimée, non commitée), API simulée par `page.route`, serveur dev sur 3115 lancé depuis une copie hors du dossier `.claude` (Turbopack échoue sur `next/font/google` dans le worktree imbriqué : artefact d'environnement).

- Double tap : confirmer, rechargement simulé à 4 s, second tap sur Terminer / Confirmer pendant le rechargement : 1 seul PUT (`{id:1,status:"confirmed"}`), ligne `aria-busy` pendant le rechargement puis libérée.
- Rechargement en échec (GET 500) : ligne libérée, statut « Confirmée » affiché, 1 PUT, plus de bouton Confirmer.
- PUT en échec puis Réessayer : message en ligne, 2 PUT au total, message effacé.
- Focus : Entrée sur Confirmer, le focus est sur l'`article` de la ligne (pas `body`).
- Aujourd'hui, 10 en attente à 390 px : avant 2498 px / après 1496 px ; 3 lignes + « Voir les 7 autres » ; arrivées sans doublon.
- Rechargement automatique : +61 s = 1 GET, focus = 1 GET, carte dépliée conservée (10 lignes), aucun écran de chargement.
- 0 réservation : deux jauges `0 / 40`, `aria-valuemax=40`. Dépassement : `aria-valuenow=40`, `aria-valuetext="54 sur 40"`.
- Zoom 200 % (195 px) : plus de contenu de page qui déborde ; 69 px restants dus au shell.
- Nouvelle réservation : Échap et fond ignorés pendant l'envoi, croix désactivée, après échec bandeau + toast, saisie conservée, Échap avec saisie : dialogue de confirmation, « Continuer la saisie » garde le formulaire, « Abandonner » le ferme ; saisie vide : fermeture directe sans confirmation.
- Minuit Krabi : 23:59:20 « Aujourd'hui » puis 00:00:21 « Hier ».

Gate (worktree) : `npx vitest run` 126 fichiers, 1970 tests passés, 1 ignoré avec `--maxWorkers=3` ; `npx tsc --noEmit` 0 erreur ; `npm run lint` 0 erreur, 2 avertissements préexistants ; `npx next build` (variables publiques factices, depuis une copie hors `.claude`) réussi.

## Non prouvé

RSV-06 entier (emails, cron J+1, KPI, vraie base, RLS, migration 019 appliquée), authentification réelle, iOS / Android (`type=date`), lecteur d'écran, comportement du dialogue de confirmation imbriqué avec un lecteur d'écran. Les chiffres de navigateur viennent d'une API simulée.

Instabilité connue, non liée : `tests/admin-nav-single-source.test.ts` (phase 12) échoue de façon intermittente avec la suite complète en pleine parallélisation (un cas différent à chaque fois, 3 échecs sur 3 avec tous les workers après la fusion de `milestone/v1.1`, vert avec `--maxWorkers=3` et seul). À traiter côté phase 12.
