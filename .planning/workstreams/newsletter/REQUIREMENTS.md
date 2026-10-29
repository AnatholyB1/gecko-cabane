# Requirements (workstream: newsletter): Gecko Cabane

**Source:** `.planning/REQUIREMENTS.md` (filtré sur la phase 7). Échéance P1 : 1er novembre 2026 pour les exigences [P1].

## v1 Requirements

### Newsletter (NEWS)

- [x] **NEWS-01**: Les contacts sont synchronisés avec Brevo avec double opt-in, lien de désinscription et consentement horodaté (PDPA, RGPD)
- [x] **NEWS-02** (N4): Un formulaire en pied de page et un pop-up de sortie (une fois par visiteur, pas en plein écran sur mobile) collectent email et langue ; le taux d'inscription est mesuré
- [~] **NEWS-03** (N2): Un portail captif WiFi propose email + consentement, ou un accès sans inscription
- [~] **NEWS-04** (N3): Un QR sur l'addition mène à une inscription (recette du curry de crabe) séparée du lien d'avis Google
- [~] **NEWS-05** (N5): Le « Guide gourmand de Krabi Town » (PDF) est envoyé par email après confirmation
- [~] **NEWS-06**: Les séquences bienvenue, après-visite J+1, pendant séjour J+3, retour en octobre et saison verte (mai à octobre) fonctionnent, 1 email/mois maximum hors séquences
- [x] **NEWS-07**: Les contacts sont segmentés par langue (FR/EN/DE/SV), pays, résident ou touriste, date de dernière visite


Légende : `[x]` code livré et testé ; `[~]` code livré, mais le livrable dépend d'une action du propriétaire (voir `phases/07-newsletter/OWNER-CHECKLIST.md`). NEWS-03/04/05 : PDF et supports d'impression absents (contenu propriétaire). NEWS-06 : séquences à activer dans Brevo (07-11). NEWS-01/02/07 : `[x]` = code et tests ; rien n'est encore appliqué en production.
