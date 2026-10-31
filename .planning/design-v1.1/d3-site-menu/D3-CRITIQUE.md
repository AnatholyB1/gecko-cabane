# D3 : critique et audit des maquettes

Méthode : revue de direction artistique (loi de la skill impeccable, registre produit), scan automatisé maison (147 rendus, voir contrat §9), heuristiques de Nielsen. Le détecteur `npx impeccable` n'a pas été lancé (hors périmètre : il aurait écrit hors du dossier D3 et exige le réseau) ; l'audit technique est le script `verify/run.mjs`.

## Verdict anti « IA générique »
Passable mais pas encore signé. Évité : dégradés, verre, métriques héros, grilles de cartes identiques, noir pur, liserés latéraux, emojis. Risque restant : la mise en page « carte blanche + rangées + boutons contour » est correcte et sobre, mais le luxe tient presque uniquement à la typographie serif des titres et au filet laiton ; sur 390 px le laiton est quasi invisible (1 px, 40 px).

## Score heuristique (0-4)
| # | Heuristique | Score | Constat |
|---|---|---|---|
| 1 | Visibilité de l'état | 4 | Enregistrement, enregistré, modifié, indisponible : toujours texte + icône |
| 2 | Langage du métier | 3 | « couverts », « créneau », « Disponible » ; « Libellé de prix » reste technique |
| 3 | Contrôle et liberté | 3 | Annuler, quitter-sans-enregistrer, suppression confirmée ; pas d'annulation après suppression (« Annuler » toast absent) |
| 4 | Cohérence | 3 | Une même ligne à toutes les tailles ; dépend de D1 pour Toast/Dialog |
| 5 | Prévention d'erreur | 3 | Steppers bornés, puces de durée ; prix sans garde-fou de variation (ex. 3 500 au lieu de 350) |
| 6 | Reconnaissance | 4 | Aperçu permanent, libellés explicites |
| 7 | Efficacité | 3 | Prix et disponibilité sans ouvrir de feuille ; pas de raccourci « tout marquer indisponible » |
| 8 | Minimalisme | 3 | Allergènes + drapeaux sur chaque ligne alourdissent le mobile |
| 9 | Récupération d'erreur | 4 | Saisie conservée, Réessayer, message à trois volets |
| 10 | Aide | 3 | Aides sous les champs ; pas d'aide contextuelle sur « durée d'occupation » au-delà du texte |
| | **Total** | **33/40** | Bon |

Charge cognitive : 1 échec sur 8 (la rangée de plat porte nom, description, 3 drapeaux, allergènes, prix, interrupteur, bouton : 7 éléments, au-dessus de 4). Plusieurs sont de la lecture, pas des décisions ; les décisions réelles sont 3 (prix, interrupteur, Détails).

## Points forts
1. Prix et disponibilité modifiables **dans la ligne**, sans feuille : le parcours quotidien de la cheffe tient en 2 taps.
2. États d'échec : la saisie est visible et réutilisable, le message dit ce qui est conservé.
3. Contrastes et cibles tenus par construction (0 anomalie sur 147 rendus), statut jamais par la couleur seule.

## Problèmes prioritaires
1. **[P1] Densité mobile de la carte.** Une ligne fait ~175 px à 390 px (3 plats par écran, 9 plats = ~1 800 px). Correctif possible : masquer drapeaux et allergènes sous un résumé d'une ligne (« Végétarien · Sans gluten »), ou ne les montrer qu'en Détails ; catégories repliées par défaut sauf la dernière utilisée. Commande : `/distill`, `/layout`.
2. **[P2] Toast en recouvrement.** Il masque la ligne en cours de modification (vu sur `carte--prix-echec`). Correctif : toast en haut sous la barre D1, ou décalage au-dessus de la ligne ; à trancher avec D1. Commande : `/layout`.
3. **[P2] Laiton trop discret.** Une touche rare ne doit pas être invisible : envisager le même laiton en filet 2 px sous l'onglet actif ou en puce « Aujourd'hui ». Commande : `/colorize` (avec retenue).
4. **[P2] Horaires sur mobile : 2 lignes par jour (~118 px).** Option : une ligne « 12:00 → 22:00 » tapable ouvrant deux sélecteurs d'heure, ou bouton « Appliquer à tous les jours » (non maquetté, ajout de périmètre). Commande : `/adapt`.
5. **[P3] Cadre photo absent des lignes.** L'ancien admin montrait une vignette ; ici la photo est cachée dans Détails. Acceptable tant que la cheffe ne photographie pas depuis l'admin. Commande : `/clarify`.

## Personas
- **La cheffe (390 px, doigts mouillés, lumière forte)** : cibles 44+ et contrastes OK ; risque : taper « Détails » au lieu du prix en haut de ligne (rangée prix/Détails serrée, 12 px d'écart). Prévoir 16 px d'écart minimal à l'implémentation.
- **Le propriétaire (tablette)** : tout tient, l'aperçu rassure ; le panneau latéral n'apparaît qu'à 1180 px, donc sur tablette l'aperçu est sous le formulaire (hors écran). Accepté, signalé.
- **Premier usage (nouvel arrivant)** : « Exceptions » est un mot court mais moins clair que « Horaires exceptionnels » ; l'intitulé complet figure dans le panneau.

## Observations mineures
- Titres en Georgia dans les maquettes (repli) ; l'implémentation utilisera Cormorant Garamond déjà chargée.
- Les dialogues des maquettes n'ont pas d'icône sur le bouton destructif (volontaire : le mot suffit).
- `Réorganiser` n'est pas affiché sur mobile hors du mode (bouton en en-tête >= 768 uniquement) : à prévoir dans le menu de catégorie à 390 px.

## Questions ouvertes (5 max)
1. **Densité mobile** : afficher drapeaux et allergènes en lecture sur chaque ligne (maquette actuelle, plus informatif) ou seulement en Détails (3 à 4 plats de plus par écran) ?
2. **Toast** : en bas au-dessus des barres collantes (maquette) ou en haut sous la barre D1 ? Dépend du Toast de D1 et de la présence d'une navigation basse.
3. **Réorganisation** : accepter les flèches haut/bas à la place du glisser-déposer sur mobile (le glisser-déposer tactile HTML5 ne fonctionne pas sur iOS) ?
4. **Gestion des pages de carte** (créer, renommer, activer, slug) : la cheffe en a-t-elle besoin au quotidien ? Sinon, la reléguer dans un menu « Gérer les pages » ; faut-il même garder le champ slug visible ?
5. **Devise** : confirmer que la carte est publique en bahts (฿, comme `src/utils/menu.ts`) et que l'admin doit abandonner le « € » actuel ; faut-il aussi un libellé de prix alternatif conservé (`price_label`) pour « 350 / 520 » ?
