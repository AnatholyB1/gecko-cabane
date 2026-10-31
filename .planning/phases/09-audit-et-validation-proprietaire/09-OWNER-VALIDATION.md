# Feuille de validation du propriétaire (AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04)

**À remplir par le propriétaire.** Cocher `[x]` pour accepter la proposition, ou écrire la modification dans la colonne « Votre décision ». Cette feuille, renseignée et datée, est la validation écrite exigée avant la phase 10.
Détail et justifications : `09-AUDIT.md`, `09-NAVIGATION-CIBLE.md`, `09-BRIEF-DESIGN.md`, `09-TEST-IMPACT.md`, `09-USAGE-QUESTIONNAIRE.md`.

Nom : ______________________  Date : ____ / ____ / 2026  Signature ou message de confirmation : ______________________

## 1. Verdicts par page (AUDIT-01)

| OK | Page | Verdict proposé | Votre décision (si différente) |
|----|------|-----------------|--------------------------------|
| [ ] | Accueil `/admin` | SIMPLIFIER : devient « Aujourd'hui » (arrivées, couverts sur 40, à confirmer) | |
| [ ] | Réservations `/admin/reservations` | SIMPLIFIER : on retire le placement en salle, liste dense, actions en un tap | |
| [ ] | Tables `/admin/tables` | **SUPPRIMER** (votre décision déjà prise ; les tables restent en base) | |
| [ ] | Carte, liste `/admin/menu` | FUSIONNER en un seul écran « Carte » | |
| [ ] | Carte, page `/admin/menu/[pageId]` | FUSIONNER + SIMPLIFIER (boutons monter / descendre au lieu du glisser-déposer) | |
| [ ] | Horaires `/admin/hours` | FUSIONNER dans « Site public » | |
| [ ] | Annonce `/admin/announcement` | FUSIONNER dans « Site public » | |
| [ ] | Paramètres `/admin/settings` | FUSIONNER dans « Site public » > Capacité, sans le mot « table » | |
| [ ] | Avis `/admin/avis` | SIMPLIFIER dans « Réputation » (tableau de clics et modèles WhatsApp gardés) | |
| [ ] | KPI `/admin/kpi` | GARDER dans « Réputation » (libellés TEST / live inchangés) | |
| [ ] | Connexion `/admin/login` | GARDER (nouveau style) | |
| [ ] | Inscription `/admin/signup` | SUPPRIMER après définition d'un processus d'invitation | |

## 2. Décisions à prendre (AUDIT-01, suite)

| # | Question | Options | Votre choix |
|---|----------|---------|-------------|
| D1 | **Totaux d'avis saisis à la main** (page Avis). Le rapport KPI donne déjà le total Google automatiquement ; il ne donne pas le nombre d'avis TripAdvisor (seulement le rang). Personne d'autre ne les lit dans le code (à confirmer pour les lecteurs externes). | A : retirer la saisie (la table reste en base) · B : ne garder que le total TripAdvisor · C : tout garder | |
| D2 | **Ajouter un nouvel admin** : aujourd'hui par le développeur (compte Supabase + ligne `gecko_admins`). Processus proposé : invitation par email depuis Supabase, puis ajout de la ligne ; pas d'écran d'invitation dans l'admin. | Accepter / autre processus : ________ | |
| D3 | **Retirer dès la phase 10 la route `POST /api/auth/signup`** (non utilisée, appelle directement la création de compte dans la base partagée avec le portfolio). Vérifier aussi dans Supabase (Authentication, Providers) que « Allow new users to sign up » est désactivé. | Oui / Non | |
| D4 | **Supprimer définitivement une réservation** : conserver derrière une confirmation, ou ne proposer que « Annuler » ? | Conserver / Annuler seulement | |
| D5 | **Ancienne adresse `/admin/tables`** après suppression | 404 / redirection vers `/admin/reservations` | |
| D6 | **Vue « semaine » et « toutes »** des réservations | Retirer (jour + recherche) / Garder | |
| D7 | **Révocation de la lecture publique** des tables `gecko_table*` (ACC-01, phase 17) : exige votre accord et la certitude qu'aucune autre application du projet Supabase partagé ne les lit | Accord / Pas maintenant (dette notée) | |
| D8 | **« Complet ce soir »** (fermer la réservation en un tap, ACC-03) : modèle à décider plus tard ; ne bloque pas les phases 10 à 16 | Garder pour la phase 17 / Abandonner | |
| D9 | **Envoi du questionnaire** (AUDIT-04) par WhatsApp à la cheffe, aux serveurs et à vous-même | J'envoie moi-même / J'autorise l'envoi par ______ / Pas d'envoi | |
| D10 | **Hors service pour les mises en ligne** de la refonte (12h-22h Krabi) et validation sur preview avant chaque fusion | Accord / autre règle : ________ | |

## 3. Navigation cible (AUDIT-02)

| OK | Élément | Proposition | Votre décision |
|----|---------|-------------|----------------|
| [ ] | Entrées de premier niveau | Aujourd'hui · Réservations · Carte · Site public · Réputation (5 entrées, 2 niveaux au plus) | |
| [ ] | Niveau 2 | Site public : Horaires, Annonces, Capacité · Réputation : Avis, KPI · Carte : pages en onglets | |
| [ ] | URL | Aucune URL existante ne change (sauf `/admin/tables` et `/admin/signup` supprimées) ; `/admin/kpi` conservée car écrite dans les emails du rapport | |
| [ ] | Bouton « + Réservation » | Présent sur toutes les pages | |
| [ ] | Déconnexion | Un seul bouton, dans l'en-tête | |

## 4. Brief de design (AUDIT-02)

| OK | Élément | Proposition | Votre décision |
|----|---------|-------------|----------------|
| [ ] | Direction | Outil de travail sobre, « luxe discret » | |
| [ ] | Palette | Fond ivoire, texte vert très sombre, vert jungle `#0C3C2D` pour les actions, laiton rare (assombri `#7F5F08` pour le texte) | |
| [ ] | Typographie | Sans-serif Inter, chiffres tabulaires | |
| [ ] | Thème | Clair uniquement | |
| [ ] | Cibles tactiles | 44 px minimum, 48 px pour confirmer / annuler / no-show | |
| [ ] | Pas de décor du site public | Pas de Cinzel / Cormorant, pas de dégradé, pas d'emoji comme icône | |

## 5. Impact sur les tests (AUDIT-03)

| OK | Élément | Proposition | Votre décision |
|----|---------|-------------|----------------|
| [ ] | Principe | Chaque commit reste vert (le build lance les tests). 4 tests sont réécrits en même temps que le code, 2 autres demandent une décision technique en phase 11 | |
| [ ] | Décision technique reportée | Où placer les composants d'admin (exclure `src/components/admin/` du test « pas de français accentué » ou les ranger ailleurs). Décision laissée au développeur en phase 11 ; il vous en informera | |

## 6. Usage réel (AUDIT-04)

| OK | Élément | État |
|----|---------|------|
| [ ] | Questionnaire validé pour envoi | |
| [ ] | Réponse de la cheffe reçue | |
| [ ] | Réponse d'au moins un serveur reçue | |
| [ ] | Qui saisit les totaux d'avis, et quand (réponse C1) | |
| [ ] | Comment on ajoute un admin aujourd'hui (réponse C3) | |

Si aucune réponse n'est reçue avant la phase 10, cochez ici pour avancer avec les verdicts par défaut de la section 1 : [ ]

## 7. Validation globale

- [ ] Je valide les verdicts de la section 1 (avec les modifications écrites ci-dessus).
- [ ] Je valide la navigation cible (section 3).
- [ ] Je valide le brief de design (section 4).
- [ ] J'autorise le lancement de la phase 10 (suppression de la gestion de salle).

Commentaires libres :

______________________________________________________________________________

______________________________________________________________________________
