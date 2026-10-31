# Phase 15 : Réservations et Aujourd'hui (interface), CONTEXT

Date : 2026-10-31. Branche `phase/15-ui` (depuis `milestone/v1.1`, tête « merge: phase 12 shell and navigation »). Exigences : TDY-01, TDY-02, RSV-01 à RSV-05 (RSV-06 = UAT propriétaire, voir `15-UAT.md`).
Références : `D2-DESIGN-CONTRACT.md`, maquettes `today*`, `reservations*`, `manual-form*`, logique P15a (`krabi-time`, `reservation-status`, `today`, `phone-links`).

## Décisions du propriétaire appliquées
- « Couverts sur 40 » = pic simultané du service (total du jour en petit) ; max lu des réglages (`/api/settings`), jamais codé en dur.
- `no_show` affiché « Non présenté », bouton « Absent » AVEC dialogue de confirmation, pas de « Rétablir ». Le helper P15a avait `needsConfirm: false` pour Absent : passé à `true` (une ligne + son test).
- « + Réservation » en en-tête, dialogue global ouvrable depuis toute page ; `?nouvelle=1` reste valide (le lien de l'en-tête est un vrai `<a href>` qui ouvre le dialogue).
- Toast en haut sous l'en-tête (surcharge de position dans `reservations.css`).
- Lignes mobiles compactes (détails repliés), « à confirmer » non répété (carte dédiée sans badge ; badge « En attente » en liste).
- « Complet ce soir » : phase 17. Emplacement vide `data-slot="acc-03-complet-ce-soir"`, aucun contrôle.
- Allergies : colonne `allergies text` (migration 019, additive, NON appliquée), affichée quand présente ; champ au formulaire manuel + validateur (additif). Formulaire public inchangé.

## Contrainte forte : API figée
`src/app/api/reservations/**`, PUT, machine à statuts, emails, cron J+1 : non modifiés (un test lit le source des routes : aucune occurrence d'`allergies`). L'interface envoie les mêmes requêtes ; `requests.ts` est la seule source des corps, prouvée identique à une transcription littérale de l'ancienne page (`tests/reservations-ui-payloads.test.ts`). Seule différence d'en-tête : `adminFetch` ajoute `Accept: application/json`.
Allergies côté API : seul `src/utils/manual-reservation.ts` (validateur, hors dossier de route) change, de façon additive : la clé `allergies` n'est présente que si renseignée, sinon la valeur validée est identique à l'ancienne ; la route manuelle insère `...parsed.value`, donc inchangée. Ordre de déploiement : migration AVANT le code.

## Architecture
`src/components/admin/reservations/` : `TodayView`, `ReservationsView`, `ReservationRow`, `ReservationDetails`, `NewReservation` (fournisseur + dialogue + lien d'en-tête), `ManualReservationForm` (déplacé depuis `reservations/`), `use-reservation-actions`, `actions`, `requests`, `reservations.css` (importé par les composants ; `admin.css` non modifié). Logique pure : `src/utils/reservation-list.ts`. Pages : `/admin` = TodayView, `/admin/reservations` = ReservationsView (date initiale = aujourd'hui à Krabi, calculée côté serveur). Fetch : `adminFetch` / `useAdminQuery` ; confirmations : `useConfirm` (plus de `confirm(` natif ici ; cliquet mis à jour). Lignes responsives par `@container` (la colonne « Aujourd'hui » est étroite même à 1440).

## Fichiers partagés touchés (ajouts localisés)
- `shell/TopBar.tsx` : le `<Link>` « + Réservation » devient `<NewReservationLink>` (mêmes classes, href, libellés).
- `AdminProviders.tsx` : `NewReservationProvider` sous `ConfirmProvider`.
- `nav.ts` : un commentaire. `types/database.ts` : `allergies?: string | null`.
- `tests/admin-ui-confirm.test.ts` : entrée `reservations/page.tsx` retirée du cliquet. `tests/reservation-status.test.ts` : Absent demande confirmation.
- Surcharge du Toast (en haut) dans `reservations.css` : s'applique à toutes les pages admin (le CSS est chargé par le fournisseur).
- Ajout probable de conflit au merge : `tests/admin-ui-confirm.test.ts` (BASELINE) si d'autres builders retirent leurs entrées ; migration numéro 019 si un autre builder en crée une.

## Déviations / limites
- Vues « Semaine » et « Tout » de l'ancienne page supprimées (le contrat D2 ne prévoit qu'un jour à la fois + recherche).
- Source / origine / badges d'avis passent dans « Détails ». Les badges d'avis (classes `text-xs`, 12 px) sont réécrits en pastilles 14 px.
- Meta (source · langue · téléphone) masquée sur colonne < 600 px pour tenir la densité ; elle reste dans Détails.
- Échecs de tests préexistants sur ce poste Windows : 2 tests de `admin-shell.test.ts` lisent `admin.css` avec des `\n` et échouent car le fichier est en CRLF (autocrlf) ; verts avec LF (vérifié), donc verts en CI/Vercel. `admin-nav-single-source.test.ts` est instable en suite complète (un test différent échoue une fois sur deux : isolation `vi.doMock`), vert isolé, sans rapport avec cette phase.
