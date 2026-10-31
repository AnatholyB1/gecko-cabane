# Phase 16 : Réputation (Avis et KPI), CONTEXT

Date : 2026-10-31. Branche : `phase/16-reputation` (depuis `milestone/v1.1`, tête « merge: phase 12 shell and navigation »). Exigences : REP-01, REP-02, REP-03.
Références : `D4-DESIGN-CONTRACT.md` (§3.1, 3.2, 9), prototypes `reputation-*.html`, `09-AUDIT.md`, `09-TEST-IMPACT.md`, `12-CONTEXT.md`.

## Décisions du propriétaire (2026-10-31)
Direction « luxe discret » ; note moyenne et répartition MASQUÉES (aucune collecte réelle, aucun chiffre inventé) ; passage en live = réglage serveur, aucun bouton « Passer en live » ; dialogue de confirmation avant l'enregistrement qui déclenche l'alerte (note minimale <= 3) ; saisie manuelle des totaux GARDÉE et redessinée ; toast en haut.

## Décisions de mise en oeuvre
- **D-01** `src/components/admin/reputation/` : `ReputationView` (titre « Réputation », segments, panneau), `KpiPanel`, `ReviewsPanel`, `Notice`, `kpi-guard.ts` (logique pure). `/admin/reputation?vue=avis|kpi`, `/admin/avis` et `/admin/kpi` rendent le MÊME composant (les deux dernières URL, liens d'emails, répondent toujours). Segments = liens GET (`aria-current`), jamais un envoi.
- **D-02** Garde-fou : bandeau toujours visible (pastille `TEST`/`live`, « Rapports TEST envoyés : N / 2 », phrase de passage en live, phrase de garde). Mode affiché = mode du dernier rapport réellement envoyé, TEST par défaut (l'API ne renvoie pas le mode serveur). Panneau « Passage en live » : 3 conditions, pastille « live verrouillé », aucun bouton.
- **D-03** Alerte note <= 3 : `submitManualEntry` appelle `confirm` AVANT `save` (règle identique au serveur : note basse nouvelle ou modifiée). Dialogue `useConfirm` (focus initial sur Annuler). L'API et le cron ne changent pas.
- **D-04** KPI : tableau de 7 indicateurs (en-têtes courts), détail de semaine avec les 15, alerte critique remontée en haut de page, états chargement / vide / erreur P11, toasts (`useToast`).
- **D-05** Avis : bande de synthèse = totaux saisis et écarts du mois (pas de note moyenne ni de répartition), suivi mensuel, saisie manuelle des totaux (validation entier côté client), évolution, messages WhatsApp repliés.
- **D-06** `review-badges` : ajout du champ `tone` (neutral/info/warn/ok), `className` Tailwind conservé car `reservations/page.tsx` (phase 15) le lit encore ; test passé sur `tone`.

## Écarts assumés
- **Pas de bouton « Envoyer un rapport TEST »** (prototype D4) : aucune route admin ne l'offre (le rapport part du cron protégé par `CRON_SECRET`, qui ne doit jamais atteindre le navigateur) et les routes ne doivent pas changer. Le panneau l'explique. À arbitrer si le propriétaire veut ce bouton (demande une route serveur dédiée).
- Pas de TripAdvisor automatique : la saisie manuelle reste la seule source.
- Port 3116 au lieu de 3106 : 3106 était déjà occupé par le serveur d'un autre worktree (non arrêté).

## Fichiers partagés touchés (ajouts localisés)
- `src/app/admin/admin.css` : bloc « RÉPUTATION » en fin de fichier (classes `.adm-rep-*`), toast ancré en haut (override du bloc Toast, vaut pour toute l'admin), défilement des tableaux larges ; fichier converti en LF (la copie de travail était en CRLF, ce qui cassait `admin-shell.test.ts`).
- `src/app/admin/(app)/nav.ts` : champ `inPageSegments` sur Réputation ; `SectionTabs.tsx` ne rend pas d'onglets pour cette section (segments dans la page) ; `tests/admin-shell.test.ts` mis à jour en conséquence.
- `src/components/admin/DataTable.tsx` : prop optionnelle `scrollLabel` (région focalisable défilante).
- `src/utils/review-badges.ts` : champ `tone` (voir D-06).
