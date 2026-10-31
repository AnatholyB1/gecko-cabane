# D1 — Critique des maquettes (auto-critique, avant validation du propriétaire)

Méthode : relecture des rendus à 390, 768 et 1440, mesures scriptées (`renders/measures.json`, 40 combinaisons), détecteur d'anti-patterns `impeccable`. Le skill d'audit complet n'a pas été exécuté séparément : ses contrôles techniques (débordement, texte, cibles, contraste, focus, mouvement réduit) sont couverts par le script.

## Ce qui fonctionne
- Le lien actif se lit sans effort aux trois formes de navigation (pastille pleine verte, fond plein vert) et ne repose pas sur la couleur seule.
- L'accueil n'est pas une grille de cartes identiques : le lead « Aujourd'hui » plein vert, puis 4+2 et 3+3 colonnes ; les cartes sont des liens uniques, sans carte imbriquée.
- Les statuts sont toujours icône + libellé ; tout le texte mesuré est >= 4,74:1, les cibles >= 44 px (36 px souris seulement >= 1024 px).

## Défauts trouvés et corrigés pendant la production
Lien de marque de 32 px (cible), débordement horizontal des horaires à 768, laiton à 3,8:1 sur le vert, contour des champs à 2,89:1 sur ivoire (porté à 3,43:1), légende du tableau étranglée en mobile, surtitre au-dessus des titres et placeholder rayé (signalés par le détecteur, supprimés), titre de page rejeté à droite sur ordinateur.

## Défauts connus restants
- Étiquettes de navigation mobile/tablette à 12 px (exception E1).
- Sur ordinateur, l'accueil laisse beaucoup d'espace vide sous les cartes : voulu pour D1, mais « Aujourd'hui » (D3) devra le remplir.
- Les formulaires d'horaires occupent beaucoup de hauteur sur téléphone (7 jours × 2 champs) : un résumé « Tous les jours 12:00 à 22:00 » avec « Personnaliser » serait plus rapide (à trancher en D2).

## Questions ouvertes (5 max)

1. **Barre du bas : 5 entrées à 12 px ou 4 entrées à 14 px ?** À 14 px, « Réservations » et « Aujourd'hui » ne tiennent pas dans 72 px. Option A (maquettée) : 5 entrées, libellés 12 px. Option B : 4 entrées (Aujourd'hui, Réservations, Carte, Site public) et « Réputation » dans le menu du compte, car c'est la plus rarement ouverte par la cheffe. Quelle option, sachant que la cheffe consulte les avis depuis son téléphone ?

2. **Faut-il fusionner « Aujourd'hui » et « Réservations » ?** La recherche proposait une seule entrée « Aujourd'hui/Réservations ». Les maquettes en gardent deux (vos cinq entrées). Si la liste dense de réservations devient l'écran d'accueil du service, la barre du bas passe à 4 entrées sans exception de taille. Gardez-vous deux entrées distinctes (service du jour / historique et recherche) ?

3. **Inter pour l'interface, Cormorant seulement pour les titres de page : validé ?** Inter est choisie pour ses chiffres tabulaires et ses diacritiques ; Cormorant donne la touche « luxe » mais seulement en grand (28 à 34 px) et jamais dans les données. Un titre en Cormorant 600 sur ivoire est lisible (13,6:1) mais fin sur un téléphone en plein soleil : préférez-vous 700 ou tout en sans-serif sur mobile ?

4. **Le fond ivoire reste-t-il l'unique fond de l'admin, sans mode sombre ?** Le détecteur d'anti-patterns classe l'ivoire en « palette crème par réflexe ». Les jetons imposés le fixent ; je le conserve. Un serveur travaillant en salle tamisée le soir demanderait-il un mode sombre, ou la luminosité de l'écran suffit-elle ?

5. **Où vit « + Réservation » sur téléphone ?** Maquetté : bouton plein dans l'en-tête, visible sur toutes les pages (action la plus fréquente pour la saisie téléphonique). Alternative : bouton flottant en bas à droite, plus près du pouce mais qui masque la fin des listes. Quel emplacement convient aux serveurs sur tablette (le bouton reste en haut à droite à 768 px) ?
