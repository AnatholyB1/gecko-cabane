# Questions ouvertes D1 à D4 : fusionnées et dédoublonnées

Source : les 20 questions des quatre `D*-CRITIQUE.md` (5 par tranche), regroupées en **8 décisions**. Chacune porte une recommandation et son effet. Les 3 premières sont des décisions de direction (ce que ça doit être et ressentir), les 5 suivantes des décisions métier (ce que le restaurant fait réellement).

Table de correspondance : D1-Q1 et D1-Q2 vers la décision 1 ; D1-Q5 et D3-Q1, D3-Q2, D3-Q3 vers 2 ; D1-Q3, D1-Q4 vers 3 ; D2-Q1, D2-Q3 vers 4 ; D2-Q2, D2-Q4, D2-Q5 vers 5 ; D3-Q4, D3-Q5 vers 6 ; D4-Q1, D4-Q2, D4-Q5 vers 7 ; D4-Q3, D4-Q4 vers 8.

---

## Décisions de direction

### 1. Navigation : cinq entrées à 12 px, et que voit-on en ouvrant l'admin ?
Les cinq entrées (Aujourd'hui, Réservations, Carte, Site public, Réputation) exigent des libellés de 12 px sur téléphone, sous le plancher de 14 px ; à 14 px il faudrait 4 entrées. D'autre part l'accueil actuel est un menu de cinq cartes qui répète la barre de navigation sans montrer un seul chiffre du service, et « Aujourd'hui » et « Réservations » se recouvrent en partie.
- **Recommandation** : garder **5 entrées, libellés 12 px en 600 et ink** (exception E1, icône toujours présente, cible 64 × 78 px) ; **la racine `/admin` ouvre « Aujourd'hui »** ; la grille de cinq cartes disparaît (ou ne sert que de page « Plus » sur tablette) ; garder « Aujourd'hui » (service du jour) et « Réservations » (historique, recherche) séparés, comme demandé.
- **Effet** : phase 12 : une seule source `nav.ts` inchangée, un écran de moins à construire ; l'ouverture de l'admin répond tout de suite à « comment est le service ? » ; coût : une exception d'accessibilité documentée au lieu d'un compromis sur le contenu.

### 2. Ergonomie du téléphone de la cheffe : densité, toast, « + Réservation », réorganisation
Une ligne de plat ou de réservation fait 130 à 200 px sur mobile (3 par écran) ; le toast recouvre la ligne qu'on vient de modifier ; « + Réservation » est en en-tête (maquetté) ou flottant ; le glisser-déposer tactile HTML5 ne marche pas sur iOS.
- **Recommandation** : **ligne compacte** (nom, prix ou heure, statut, une action) avec le reste derrière « Détails » et les catégories repliées sauf la dernière utilisée ; **toast en haut sous l'en-tête** ; « + Réservation » **reste en en-tête** (visible partout, pas de bouton flottant qui masque la fin des listes) ; **flèches haut/bas** à la place du glisser-déposer sur mobile ; horaires : résumé « Tous les jours 12:00 à 22:00 » avec « Personnaliser ».
- **Effet** : 6 plats par écran au lieu de 3, plus de ligne masquée, aucune dépendance au glisser ; coût : un niveau de lecture en moins sur la liste (allergènes visibles seulement dans « Détails », à valider avec la cheffe pour la sécurité alimentaire côté réservation, pas côté carte).

### 3. Ton visuel : Cormorant en 600 ou 700 sur mobile, et un mode sombre ?
Cormorant 600 à 28 px est fin au soleil sur un téléphone, et le filet laiton de 40 px est presque invisible à 390 px. L'ivoire est signalé « crème par réflexe » par le détecteur ; un serveur en salle tamisée pourrait demander un mode sombre.
- **Recommandation** : **Cormorant 700 sous 768 px** (600 au-dessus), filet laiton de 2 px (déjà appliqué) ; **pas de mode sombre en v1.1** (une seule palette, comme les jetons imposés).
- **Effet** : le « luxe discret » reste lisible sur l'appareil réel ; un seul thème à tester ; un mode sombre se rajoutera plus tard par les jetons sans refonte.

---

## Décisions métier

### 4. « Complet ce soir » et ce que veut dire « sur 40 couverts »
Faut-il fermer le dîner seul ou la journée, par date ou par drapeau de capacité ? Et le chiffre « 31 / 40 » est-il le pic simultané ou le total du jour (49) ?
- **Recommandation** : **dîner du jour seulement (18h à 22h), réversible, réservations existantes conservées**, stocké comme exception **par date** (jamais comme une capacité modifiée) ; le grand chiffre est le **pic simultané par service** (cohérent avec 40 couverts à la fois et le blocage de 120 min), le total du jour reste en petit.
- **Effet** : décision ACC-03 (phase 17) sans migration destructive ; un tap, avec confirmation ; pas de risque d'oublier de rouvrir le lendemain.

### 5. Modèle de réservation : allergies, « Non présenté / Absent » et retour en arrière
Le modèle n'a que `occasion` et `admin_notes` : la pastille « Allergie » des maquettes est donc sans source. Le statut `no_show` s'appelle « Non présenté » (badge) et « Absent » (bouton) ; un tap sur « Absent » retire la réservation de l'avis J+1 et des KPI, sans annulation possible.
- **Recommandation** : **colonne `allergies` (texte, nullable, migration non destructive)** saisie dans les formulaires public et manuel, jamais détectée par mots-clés (risque de faux négatif sur la sécurité alimentaire) ; **badge « Non présenté », bouton « Absent »** (le bouton long casse la ligne à 1440) ; **transition inverse autorisée** (Non présenté vers Confirmée, bouton « Rétablir » déjà dessiné dans D1) à la place d'un dialogue de confirmation.
- **Effet** : une migration et une règle de transition de plus dans `PUT /api/reservations` ; en échange, l'erreur de doigt n'est plus définitive et l'allergie devient une donnée fiable.

### 6. Carte publique : devise et gestion des pages
L'ancien admin affiche « € » alors que le site public est en bahts (฿). Le formulaire de pages de carte (créer, renommer, activer, slug) est-il un besoin quotidien ? Le libellé de prix alternatif (« 350 / 520 ») doit-il survivre ?
- **Recommandation** : **฿ partout** (comme `src/utils/menu.ts`) ; **page « Gérer les pages » repliée** dans le menu de la carte, slug masqué (calculé) ; **conserver `price_label`** comme champ avancé dans « Détails ».
- **Effet** : l'écran quotidien de la cheffe ne montre que prix et disponibilité ; plus de risque d'afficher une mauvaise devise ; aucune donnée existante perdue.

### 7. Réputation : note moyenne, passage en live, alerte
Le code ne stocke que le total d'avis et la note minimale de la semaine : d'où vient la note moyenne et la répartition ? Le passage en live (après le 2026-11-16) doit-il avoir un interrupteur ? L'alerte « note <= 3 » part aujourd'hui sans confirmation : faut-il le dialogue ajouté par le contrat ?
- **Recommandation** : **ne pas afficher** note moyenne et répartition en v1.1 (zone masquée en production, étiquetée « exemple » dans les maquettes) tant qu'aucune collecte automatique n'existe, et garder la **saisie manuelle des totaux** ; **le live reste un réglage serveur** (aucun bouton dans l'interface) ; **valider le dialogue** de confirmation de l'alerte (action sûre en focus initial).
- **Effet** : aucune donnée inventée à l'écran ; garde-fou de calendrier intact (aucun envoi live avant le 2026-11-16 sans accord) ; un tap de plus à l'enregistrement d'une mauvaise note, voulu.

### 8. Accès : mot de passe oublié, rôle limité, et où vit « Accès »
Aucun parcours « mot de passe oublié » n'existe (le lien est dessiné) ; l'invitation donne un accès administrateur complet ; et les cinq entrées de navigation ne contiennent pas « Accès », donc les écrans d'invitation n'ont plus d'adresse dans le menu.
- **Recommandation** : **inclure « mot de passe oublié » en phase 17** (l'écran « choisir un mot de passe » de l'invitation est réutilisable) ; **pas de rôle limité en v1.1** (tout ou rien, comme `gecko_admins`) ; **placer « Accès » dans le menu du compte** (e-mail, Voir le site public, **Accès**, Déconnexion), hors des cinq entrées.
- **Effet** : la barre de navigation reste à cinq entrées ; un seul niveau de droits à tester et à documenter ; si du personnel de salle arrive plus tard, le rôle réservations-seulement sera une évolution de `gecko_admins`, pas une refonte d'écrans.
