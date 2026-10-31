# Phase 13 : Site public, VERIFICATION

Date : 2026-10-31. Branche `phase/13-site-public`, `milestone/v1.1` fusionné (tête « merge: phase 14 carte »). Exigences SITE-01, SITE-02.

## Exigence -> test

| Exigence | Critère | Test Vitest | Preuve navigateur (Chromium headless, `next build` + `next start`, port 3103) |
|---|---|---|---|
| SITE-01 | Une section « Site public », 4 onglets (Horaires, Exceptions, Annonces, Capacité) | `tests/site-public.test.ts` « un écran, 4 onglets » (tablist, 4 `role="tab"`, un seul `aria-selected`, panneau `aria-labelledby`, un seul `h1`, onglets = ancres) ; `tests/site-public-logic.test.ts` « onglets » | 4 onglets x 4 largeurs rendus et mesurés |
| SITE-01 | Les anciennes URL répondent, mêmes composants | `site-public.test.ts` « anciennes adresses » (chaque page = `<SitePublic initialTab=… />`, < 12 lignes, aucun `fetch`/`useState`) ; `admin-nav-links.test.ts` (URL conservées existent) ; `admin-shell.test.ts` (sous-entrée active sur `/admin/hours`, `/admin/announcement`, `/admin/settings`) | `?tab=annonces` sans ancre -> onglet Annonces |
| SITE-01 | Horaires lundi → dimanche, données inchangées, jours modifiés, aperçu | `site-public-logic.test.ts` « horaires » (ordre, HH:MM, jour absent non inventé, `changedDays`, aperçu « (aujourd'hui) ») ; `site-public.test.ts` « Horaires » (7 jours, 7 interrupteurs à libellé texte, état propre, aperçu) | badge « Modifié », aperçu en direct, PUT `/api/hours` = 7 jours |
| SITE-01 | Exceptions : ajout, dates à venir/passées, suppression avec dialogue | `site-public-logic.test.ts` « exceptions » (validation, corps POST identique, date longue sans décalage, à venir/passées) ; `site-public.test.ts` (Loading/Error/Empty, `useConfirm`, « Supprimer cette exception ? ») | ajout, erreur de date, dialogue `alertdialog` (focus sur Annuler, Échap = annuler, focus rendu), DELETE, état vide |
| SITE-01 | Annonces : interrupteur, 5 couleurs, dates, aperçu et état | `site-public-logic.test.ts` « annonce » (corps PUT identique, validation, états Aucune / Masquée / Programmée / Affichée / Terminée aux bornes) ; `site-public.test.ts` « Annonces et Capacité » (radiogroup à 5 couleurs, aucune bannière à l'état vierge) | échec puis Réessayer, corps PUT `bg_color: blue` |
| SITE-01 | Capacité : durée d'occupation, aucun mot « table » | `site-public-logic.test.ts` « capacité » (clés `max_covers` / `table_block_duration_minutes`, bornes, message du contrat, pas ±15, frise) ; `site-public.test.ts` (libellé « Durée d'occupation d'un créneau », aucun `\btable\b` dans tout le texte affiché des 4 onglets) ; `tables-removal.test.ts` (clés + libellé + textes) | texte de la page sans « table » ; PUT `/api/settings` = 2 clés |
| SITE-01 | Mêmes API, comportement public inchangé | `site-public.test.ts` « câblage » : seules les 4 routes, via `adminFetch`, méthodes attendues, aucun `fetch` nu ; `git diff milestone/v1.1 HEAD -- src/app/api` vide | corps de requête observés (voir ci-dessus) |
| SITE-02 | Toast de succès à chaque enregistrement | `site-public.test.ts` « câblage » (chaque section émet son `toast.success`) | toast « Horaires enregistrés. » à 390 (en haut) et 1440 (bas droit), dans une région `aria-live="polite"` |
| SITE-02 | Échec : erreur lisible, saisie conservée | `site-public.test.ts` (le `catch` ne touche jamais à `setRows/setForm/setSaved/refetch` ; `SaveFailure` role `alert`, « rien n'est perdu », Réessayer) ; `site-public-logic.test.ts` « messages d'erreur » (aucun code HTTP ni anglais de l'API) | erreur 500 simulée et coupure réseau : alerte en ligne + toast d'erreur persistant (visible après 6,5 s), valeurs de tous les champs identiques avant/après, Réessayer enregistre |
| SITE-02 | États chargement / vide / erreur via composants P11 | `site-public.test.ts` (rendu : `role="status"` + `aria-busy` pour les 4 onglets ; sources : `LoadingState`, `ErrorState`, `EmptyState`) | erreur de chargement simulée : titre, « Rien n'a été modifié. », Réessayer recharge le formulaire |
| SITE-02 | Modifications non enregistrées signalées | `site-public.test.ts` « SaveBar » (propre / modifié / en cours) et « garde » (`guardTarget`, `useUnsavedGuard` monté par les 4 sections, `beforeunload`) | dialogue « Quitter sans enregistrer ? » au changement d'onglet et vers une autre page ; Rester ici garde la saisie ; Quitter abandonne ; aucune confirmation quand propre |
| SITE-02 | Plus de `confirm(` natif | `admin-ui-confirm.test.ts` (cliquet : l'inventaire est maintenant vide) ; `site-public.test.ts` (aucun `confirm(` / `alert(` / emoji dans la section) | dialogue accessible à la place |

## Compteurs

`npx vitest run` : 123 fichiers, 1837 tests passés, 1 ignoré (avant la phase : 115 fichiers). Ajoutés : `site-public-logic.test.ts` (28 tests), `site-public.test.ts` (27 tests).
`npx tsc --noEmit` : 0 erreur (avant et APRÈS `next build`, `.next` supprimé avant le build). `npm run lint` : 0 erreur (2 avertissements existants hors de la phase). `npx next build` (variables publiques factices) : OK.
Test instable déjà présent avant la phase : `tests/admin-nav-single-source.test.ts` échoue par intermittence (environ une exécution sur trois de la suite complète, jamais seul), constaté aussi sur `9264722` (tête de la phase 12) dans un worktree propre ; ce n'est pas un effet de cette phase.

## Mesures navigateur (script hors dépôt : `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-p13\verify.js`, 133 contrôles, 133 OK)

Largeurs 390, 768, 1180 (seuil de l'aperçu à droite), 1440 ; 4 onglets chacune (16 audits) :
- Débordement horizontal : 0 px partout (un badge d'aperçu de 392 px à 390 a été corrigé : `white-space: normal`).
- Cibles interactives (hors navigation du shell) : toutes >= 44 x 44 px (interrupteurs, onglets, compteurs 56 px, puces, nuanciers, boutons d'icône, champs, `summary`).
- Texte de la section : tous >= 14 px (les libellés de navigation à 12 px sont l'exception E1 de la phase 12, hors section).
- Aperçu : à droite, `position: sticky`, 360 px dès 1180 ; sous le formulaire en dessous.
- Barre d'enregistrement collante visible dans l'écran sans défiler ; sur téléphone elle est au-dessus de la barre de navigation du bas.
- Toast : en HAUT à 390 (décision du propriétaire), bas droit à 1440 ; succès dans une région `aria-live="polite"`.
- Focus clavier : flèches / Début / Fin sur les onglets (le focus suit), anneau de focus visible (>= 2 px) ; dialogues : focus initial sur « Annuler » / « Rester ici », Échap, focus rendu au déclencheur.
- Mouvement réduit : transitions des onglets à ~0 s.
- Comparaison aux prototypes `site-public-*.html` (relecture des captures 390 / 768 / 1440 : ordre, titres, onglets à icônes dès 768, interrupteur à libellé, badge « Modifié », barre collante, aperçu, frise 12 h – 22 h, alertes en ligne, dialogue) : conforme. Écarts : ajout d'un `<summary>` « Dates passées (n) » et de l'indication « Une exception déjà enregistrée à cette date sera remplacée. » (absents des maquettes).
- Erreurs console : uniquement les « Failed to load resource » des réponses 500 simulées ; aucune erreur de page.

## Méthode du proxy de test et ce qu'il ne prouve pas

Route temporaire `src/app/gcm-p13/` (préfixe `gcm` : hors du matcher du middleware, donc ni garde ni base ; layout = `AdminRoot` + `AdminShell` réels, page = `<SitePublic>`), **retirée avant tout commit** (jamais ajoutée à git). Les appels `/api/*` ont été interceptés par Playwright (`page.route`) avec des réponses simulées à état (GET, PUT, POST, DELETE, erreurs 500, requête abandonnée, réponse lente). Variables d'environnement surchargées par des valeurs factices (Supabase, Resend, Postgres, Sentry) : aucune base ni service réel touché.

Ce que ce proxy ne prouve PAS :
- La garde admin réelle (`/admin/*` redirige vers la connexion sans session) et l'autorisation des routes API (`requireAdmin`) : non exercées.
- Le comportement réel des routes API et de la base (écriture des 7 jours, upsert de date, revalidation du cache des horaires) : seules les requêtes ENVOYÉES sont vérifiées, pas leur effet ; « les modifications se reflètent sur le site public » repose sur l'absence de modification des routes API (diff vide) et des corps de requête identiques, pas sur une lecture du site public.
- La navigation réelle depuis `/admin/site` (la route de test n'est pas sous `/admin`) : l'état actif de la barre latérale, la sous-navigation avec ancres et le rendu des anciennes URL (`/admin/hours`…) sont prouvés par les tests de rendu (`admin-shell`, `site-public`), pas par le navigateur ; l'onglet initial d'une ancienne URL a été simulé par `?tab=`.
- Les mesures navigateur ont été prises sur le build précédant la fusion de `milestone/v1.1` (phases 14, 15, 16) ; les fusions n'ont modifié ni les composants de la section ni leur CSS, mais le build final n'a pas été rejoué dans le navigateur.
- Lecteur d'écran réel : la région `aria-live` et les rôles sont vérifiés dans le DOM, pas écoutés. Note : le toast Base UI (primitive P11) porte `role="alertdialog"` et `aria-hidden="true"` au moment de la mesure, dans une région polie ; c'est l'alerte en ligne `role="alert"` qui garantit l'annonce d'un échec.
- Zoom 200 %, appareils tactiles réels, iOS (pas de zoom des champs : 16 px).
