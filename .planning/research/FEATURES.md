# Feature Landscape - Admin v1.1 "Refonte de l'admin"

**Domain:** back-office d'un petit restaurant (40 couverts, sans plan de salle), 3 profils : cheffe sur téléphone, serveurs sur tablette, développeur sur ordinateur
**Researched:** 2026-10-31
**Confidence:** MEDIUM. L'audit de l'existant vient de la lecture directe de `src/app/admin/**` (HIGH). Les pratiques des produits de référence (OpenTable, Zenchef, TheFork, SevenRooms, Resy, Toast, Square) viennent de la connaissance générale du domaine et n'ont pas été re-vérifiées en ligne (MEDIUM/LOW). Les recommandations par page sont des jugements à valider avec le propriétaire, conformément à la contrainte du milestone.

## Ce que montre l'existant (constats d'audit)

- `layout.tsx` fait 11 lignes : **aucune navigation partagée**. Chaque page refait son propre en-tête avec « ← Retour au tableau de bord ».
- Le tableau de bord `/admin` est un **lanceur statique** : 8 cartes, puis les 8 mêmes liens en « Actions rapides », puis un bloc d'infos figées en dur (adresse, téléphone, « 40 places »). Aucune donnée vivante, alors que la question quotidienne est « qui vient ce soir ? ».
- Réservations (874 lignes) : filtres jour/semaine/tout, 3 compteurs, statuts, source, origine, badges avis, notes, occasion, suppression définitive, formulaire manuel. Un tiers du fichier concerne le placement en table (modale plan de salle, appels `/api/tables/*`) : à retirer.
- Avis (307 lignes) : stats de clics `/review`, **saisie manuelle des totaux Google/TripAdvisor par mois**, modèles WhatsApp. La saisie manuelle fait doublon avec le KPI, qui récupère déjà ces totaux automatiquement (Places API, Bright Data).
- KPI (404 lignes) : historique 12 semaines, détail de semaine, alertes, « Lecture et actions », saisie manuelle de la semaine. Page développeur/propriétaire, pas un outil du quotidien.
- Paramètres (173 lignes) : 2 réglages. `table_block_duration_minutes` est libellé « durée de blocage d'une **table** » alors qu'il n'y a plus de tables. `max_covers` est décrit « par service » alors qu'il s'agit de couverts simultanés.
- Horaires et annonces : deux pages qui ne font qu'une chose, « ce que le public voit sur l'ouverture du restaurant ».
- Menu : 3 niveaux (pages, catégories, plats) sur 748 lignes. La carte a 162 lignes, donc l'usage est la correction de prix ou l'indisponibilité d'un plat, pas la création.
- Aucune page pour la newsletter (journal de consentement, envois désactivés). Hors périmètre v1.1, mais la navigation doit prévoir sa place.

## Comment les outils de référence structurent le quotidien (synthèse)

Les carnets de réservation (Zenchef, TheFork Manager, OpenTable GuestCenter, Resy OS, SevenRooms) se ressemblent sur quatre points :

1. **Une seule vue d'ouverture, « le service du jour »** : liste chronologique des arrivées avec heure, nom, couvert, note, statut. Tout le reste en découle. Les tableaux de bord de ventes (Toast, Square) font de même avec les chiffres du jour en tête.
2. **Un cycle de vie court** : en attente, confirmée, arrivée/terminée, absente/annulée. Les actions sont à un geste, en ligne ou en glissement, sans modale.
3. **Les réglages de disponibilité sont séparés de l'opérationnel** : horaires, fermetures, couverts max, durée de repas vivent dans une zone « Configuration » rarement ouverte. Le jour même, on ne les touche que pour « complet » ou « fermé exceptionnellement ».
4. **Le CRM client est un second étage** (historique, tags, no-shows répétés). Les petites structures l'utilisent peu : TheFork et Zenchef le vendent surtout aux groupes.

Un point propre à Toast/Square : le mobile du patron montre des chiffres, pas des formulaires. La configuration reste sur ordinateur.

## Table Stakes

Absents, l'admin paraîtrait incomplet ou pénible pour la cheffe et les serveurs.

| Feature | Pourquoi attendu | Complexité | Dépendances / notes |
|---------|------------------|------------|---------------------|
| Navigation partagée persistante (barre latérale sur ordinateur, barre basse ou menu sur téléphone) dans `admin/layout.tsx` | Aujourd'hui chaque page refait son en-tête ; on revient toujours au tableau de bord | Faible-Moyenne | Un layout à la place de 8 en-têtes ; le layout doit éviter login/signup |
| « Aujourd'hui » comme page d'accueil : arrivées du jour par heure, couverts totaux, couverts restants vs `max_covers`, réservations en attente à traiter | C'est la question quotidienne de tout restaurateur | Moyenne | Dépend de `GET /api/reservations?date=` (existe) et `max_covers` ; calcul de couverts restants par créneau à réutiliser côté dispo plutôt qu'à réécrire |
| Liste réservations optimisée tablette/téléphone : lignes denses, actions de statut en un tap, appel/WhatsApp direct sur le numéro | Les serveurs sont sur tablette, souvent debout ; touristes avec numéros étrangers | Moyenne | Lien `tel:` et `wa.me` ; cible tactile 44 px |
| Cycle de statut allégé et lisible | Un serveur ne doit pas hésiter entre « Terminée » et « Absent » | Faible | Garder `pending → confirmed → completed/cancelled/no_show` ; **ne pas toucher** à l'enum : les e-mails J+1/J+5 en dépendent (voir plus bas) |
| Création manuelle rapide (téléphone/passage) | Réservations par WhatsApp et téléphone restent majeures à Krabi | Faible | `ManualReservationForm.tsx` existe : le garder, le rendre accessible depuis la barre de navigation (action globale « + ») |
| Navigation par date (veille/lendemain/aujourd'hui) et recherche par nom ou téléphone | Retrouver « Dupont, jeudi » sans filtrer à la main | Faible-Moyenne | Recherche côté client suffisante à ce volume |
| États chargement / vide / erreur sur chaque page | Exigé par le milestone ; aujourd'hui `loadError` n'existe pas partout, `console.error` seul dans les réservations | Moyenne (transverse) | Composants partagés du design system ; à faire une fois |
| Confirmation avant action destructive, annulation possible | Suppression définitive aujourd'hui via `confirm()` natif | Faible | Préférer « Annuler » (statut) à « Supprimer » ; réserver la suppression à l'ordinateur |
| Réglage `max_covers` et durée de repas, avec libellés corrigés | La disponibilité en dépend | Faible | Renommer « durée de blocage d'une table » en « durée d'un repas » ; clé `table_block_duration_minutes` inchangée |
| Horaires hebdomadaires + exceptions (fermeture, horaires spéciaux) | Basique ; déjà construit | Faible (existe) | Refonte visuelle seulement |
| Mise à jour de la carte : prix, disponibilité d'un plat, ajout | La cheffe change des prix et retire des plats | Moyenne (existe) | Voir recommandation menu ci-dessous |
| Responsive vrai (une colonne téléphone, deux tablette, denses ordinateur) | Objectif du milestone | Moyenne | Tailwind v4 ; breakpoints uniques |
| Accessibilité de base : contrastes, focus, libellés, `aria-live` pour les retours | Exigé ; l'existant utilise des emojis comme icônes et `✕` sans libellé | Moyenne | Remplacer les emojis par des icônes (Lucide déjà utilisé sur la carte publique) |

## Differentiators

Utiles et peu coûteux, ils font du site « la première source de réservations ». À prioriser selon la valeur, pas par défaut.

| Feature | Valeur | Complexité | Notes |
|---------|--------|------------|-------|
| Indicateur de capacité par créneau sur « Aujourd'hui » (barre 12h-22h, couverts occupés/40) | Remplace le plan de salle : ce que les serveurs veulent savoir, c'est « puis-je encore prendre 4 couverts à 20h ? » | Moyenne | Réutilise la logique `max_covers` + durée de repas ; **c'est le seul concept qui survit au retrait des tables** |
| Bouton « Complet ce soir / fermer le créneau » en un tap | Évite un appel à un développeur un soir de rush ; pratique Zenchef/TheFork | Moyenne | Écrit une exception dans `gecko_special_hours` ou un plafond ponctuel ; **dépend d'une décision sur le modèle de données** (voir Gaps) |
| Rappel ou « À confirmer » : réservations en attente depuis plus de X heures, mises en tête | Réduit le no-show et la perte de réservations | Faible | Tri et surbrillance, pas de nouveau système |
| Notes et signaux clients sur la ligne : occasion, allergies, anniversaire, retour d'un client | La cheffe prépare le service ; le champ `occasion` existe, `admin_notes` aussi | Faible | Allergies : vérifier si un champ existe, sinon utiliser `admin_notes` (ne pas créer de colonne pour v1.1) |
| Vue « semaine » compacte (couverts par jour) | Prévoir les achats et le personnel de la semaine | Faible-Moyenne | Réutilise l'API par plage de dates |
| Répartition des sources de réservation (site / WhatsApp / téléphone / passage) sur la semaine | Objectif projet : 30 % des couverts du soir via le site | Faible | Les champs `source` et `origin` existent déjà ; mini-vue en lecture sur « Aujourd'hui » ou KPI |
| Export CSV des réservations (ordinateur) | Comptable, déclaration, recoupement ; peu coûteux | Faible | Optionnel, ordinateur seulement |
| Tableau de bord KPI condensé sur l'accueil pour le propriétaire (Google 4,7, avis cette semaine) | Un seul chiffre vivant motive ; détail resté dans KPI | Faible | Dépend de la table KPI hebdomadaire (existe) |
| Prévisualisation du site public depuis l'éditeur d'annonce/horaires | Réduit la peur de publier | Faible | Lien « Voir sur le site » suffit (v1) |

## Anti-Features

À ne pas construire en v1.1.

| Anti-feature | Pourquoi l'éviter | Alternative |
|--------------|-------------------|-------------|
| Plan de salle, placement des tables, configurations de tables | Retiré par décision du milestone ; 40 couverts, deux personnes, pas de besoin de plan | Compteur de couverts par créneau |
| Migration destructive des tables `gecko_tables*` | Interdit sans accord ; la base est partagée | Laisser en base ; retirer seulement le code et les routes |
| CRM complet (fiches clients, scoring fidélité, tags multiples) | Valeur réelle pour les groupes ; coût de maintenance élevé pour deux personnes ; contraintes PDPA/RGPD | Notes libres + recherche par téléphone/e-mail |
| Gestion du personnel, plannings, paie, stocks, POS/encaissement | Hors sujet du site ; Toast/Square font cela mieux | Rien ; ne pas concurrencer le matériel de caisse |
| Pages d'analytics maison (graphes, cohortes) | Duplique Search Console, PostHog, Vercel Analytics | Le KPI hebdomadaire existant, sans l'étendre |
| Éditeur de rôles/permissions multi-niveaux | 2-3 utilisateurs ; `gecko_admins` suffit | Admin / non-admin comme aujourd'hui |
| Édition drag-and-drop des pages de menu | Coûteuse, fragile sur tablette | Boutons haut/bas, ou champ « ordre » |
| Saisie manuelle de données qu'un robot récupère déjà (totaux d'avis) | Double source de vérité, risque de divergence | Lire la valeur du KPI automatique, saisie seulement en secours |
| Envoi de messages par l'admin (SMS, WhatsApp automatisé) | Actions vers des tiers = accord du propriétaire ; coût et conformité | Bouton « Ouvrir WhatsApp » avec texte préparé (existe pour les avis) |
| Édition d'e-mails/newsletter dans l'admin v1.1 | Newsletter bloquée (07-02, 07-10, 07-11), hors périmètre | Réserver un emplacement de navigation, rien de plus |
| Éditeur WYSIWYG pour les annonces | Les annonces sont des bannières courtes | Champs texte FR/EN + dates + couleur |

## Recommandation par page : garder / simplifier / fusionner / supprimer

| Page actuelle | Verdict | Détail |
|---------------|---------|--------|
| Login / Signup | **Garder, simplifier** | Garder le login. Inscription : vérifier qu'elle ne permet pas de créer un compte ; l'accès réel est de toute façon contrôlé par `gecko_admins`. Si l'invitation se fait à la main, retirer la page publique `/admin/signup` (réduction de surface d'attaque). À valider avec le propriétaire. |
| Tableau de bord `/admin` | **Remplacer** par « Aujourd'hui » | Supprimer les cartes lanceurs, le doublon « Actions rapides », le bloc d'infos figées. La navigation passe dans le layout. L'accueil affiche le service du jour, les réservations à confirmer, la capacité par créneau. |
| Réservations | **Garder, simplifier fortement** | Retirer la modale de placement, les appels `/api/tables/*`, le badge de configuration. Remplacer les cartes volumineuses par des lignes denses. Deux niveaux : « À traiter » (en attente) et « Service du jour ». Le champ `source` éditable en liste devient un détail dans une feuille latérale (rarement modifié). Garder le bandeau d'échéance no-show 11h (Krabi) mais le reformuler : il explique un comportement réel des e-mails. Suppression définitive : déplacer dans le détail, ordinateur, avec confirmation. |
| Formulaire manuel | **Garder** | Devient action globale « + Réservation ». Même validation et même API. |
| Plan de salle (`/admin/tables`, 809 lignes) | **Supprimer** | Avec `/api/tables/*`, les types TS, les tests associés ; tables SQL laissées. Vérifier que la disponibilité publique (`max_covers` + durée) ne lit pas `gecko_table_assignments` ni les configurations (point à prouver par un test avant suppression). |
| Menu (liste de pages + éditeur de page) | **Garder, simplifier** | Fusionner les deux niveaux d'écrans en un seul écran à deux volets (ordinateur) / accordéon (téléphone). Priorité : édition en ligne d'un prix, bascule « indisponible », ajout rapide. Les actions rares (réordonner catégories, créer une page) restent sur ordinateur. |
| Horaires | **Garder, fusionner** | Fusionner avec Annonces dans une zone « Site public » ou « Ouverture & annonces ». Hebdomadaire et exceptions deviennent un seul calendrier simple avec « Fermer ce jour » en un tap. |
| Annonces | **Garder, simplifier, fusionner** | Fusionnées avec Horaires. Une annonce active à la fois avec dates de début et de fin. Retirer les options de présentation superflues si elles existent. |
| Avis | **Garder, simplifier** | Garder : statistiques de clics du tunnel, modèles WhatsApp (utilisés pour envoi manuel, conforme à la règle de non-incitation). Retirer la saisie manuelle des totaux Google/TripAdvisor si le KPI automatique les couvre (vérifier la source avant, car `gecko_review_totals` peut alimenter le rapport). Rapprocher la page des KPI : même zone « Réputation ». |
| KPI hebdomadaires | **Garder, isoler** | Page propriétaire/développeur, pas du quotidien. Placer dans « Réputation & rapports », désactiver la saisie manuelle de la semaine si non utilisée. Ne pas la refaire en profondeur : `KPI_REPORT_MODE=live` n'est pas atteint avant le 2026-11-16 ; ne rien casser dans le flux de rapport. |
| Paramètres | **Garder, réduire** | Deux réglages seulement : `max_covers` et durée du repas. Renommer, expliquer l'effet. Pas besoin d'une page à part : les mettre dans « Ouverture & capacité » à côté des horaires, qui influencent déjà la disponibilité. |

### Structure de navigation proposée (trois ou quatre entrées)

1. **Aujourd'hui** (accueil) et **Réservations** (liste, semaine, recherche, ajout)
2. **Carte** (menu)
3. **Site public** : Horaires et capacité, Annonce
4. **Réputation** : Avis, KPI (les deux regroupés)

Téléphone : barre basse à 4 entrées. Ordinateur : barre latérale. Pas de sous-niveaux de plus de 2.

## Feature Dependencies

```
Layout partagé + design system (tokens, composants, états) -> toutes les pages refaites
Suppression du plan de salle -> liste réservations simplifiée -> page « Aujourd'hui »
Compteur de capacité par créneau -> max_covers + durée de repas (conservés)
« Complet ce soir » -> décision sur le modèle (exception horaire vs plafond ponctuel) -> API de disponibilité publique
Fusion Avis/KPI -> vérifier qui lit les totaux d'avis saisis à la main
Retrait de /admin/signup -> process d'invitation d'un admin (gecko_admins)
Cycle de statuts inchangé -> e-mails J+1 et J+5 (honorée/no-show) continuent à fonctionner
```

## MVP Recommendation

Prioriser, dans l'ordre :

1. **Layout partagé + design system + états chargement/vide/erreur** (débloque tout, faible risque).
2. **Suppression du plan de salle** avec test de non-régression de la disponibilité publique.
3. **Réservations refaites** (liste dense, actions de statut, recherche, ajout global) : usage quotidien des serveurs.
4. **« Aujourd'hui »** avec capacité par créneau : valeur principale pour la cheffe sur téléphone.
5. **Fusion Horaires + Annonces + capacité**, simplification Menu, regroupement Avis/KPI.

Un seul différenciateur dans le MVP : **la capacité par créneau**, qui remplace le plan de salle.

Différer : « Complet ce soir » (modèle de données à trancher), export CSV, vue semaine, résumé KPI sur l'accueil, retrait de `/admin/signup` (valider d'abord le process d'invitation).

## Gaps et points à valider avec le propriétaire

- **Qui utilise vraiment quoi ?** Aucune télémétrie d'usage de l'admin. Avant de supprimer ou fusionner, demander à la cheffe et aux serveurs, et regarder l'historique réel (réservations créées à la main, annonces publiées, totaux d'avis saisis).
- **Disponibilité publique sans tables** : confirmer par lecture du code de `/api/reservations` et de la dispo MCP qu'aucune logique ne dépend des affectations. Test de non-régression requis.
- **Le champ `source` éditable en liste** : usage réel inconnu ; probablement utile pour attribuer WhatsApp/téléphone, à conserver mais sans prominence.
- **« Complet ce soir »** : nécessite un choix de modèle de données (hors migration destructive) ; à traiter en phase de conception.
- **Signup admin** : vérifier le flux actuel avant de le retirer.
- Les comparaisons avec OpenTable/Zenchef/TheFork/Toast/Square proviennent de connaissance générale ; elles justifient les patterns (vue du jour, cycle court, configuration séparée) mais n'ont pas été re-vérifiées sur les documentations actuelles de ces produits.

## Sources

- Lecture directe : `src/app/admin/page.tsx`, `reservations/page.tsx`, `avis/page.tsx`, `settings/page.tsx`, `kpi/page.tsx`, `hours/page.tsx`, `announcement/page.tsx`, `layout.tsx` (HIGH)
- `.planning/PROJECT.md` : contraintes et dette v1.0 (HIGH)
- Connaissance générale des interfaces de gestion de réservations et de caisses : Zenchef, TheFork Manager, OpenTable GuestCenter, Resy, SevenRooms, Toast, Square (MEDIUM/LOW, non re-vérifié en ligne)
