# D2 — Critique des maquettes

Méthode : revue des captures aux 3 viewports contre le contrat, plus mesures automatiques (0 violation, voir `D2-DESIGN-CONTRACT.md` §10). Les skills de critique/audit n'ont pas été exécutés comme outils séparés : seul `shape` a été chargé, et l'entretien de découverte a été remplacé par le brief fourni. Cette critique est donc une auto-revue, à confronter à un regard extérieur.

## Ce qui fonctionne
- Premier écran 390 : jauges et premier « Confirmer » visibles sans défiler (bas à 838 px sur 844).
- Statuts lisibles sans couleur : icône + libellé ; capacité par hachures + icône + nombre.
- Notes, occasion et allergie visibles sans ouvrir ; un seul bouton plein par ligne.
- Mêmes composants du téléphone au bureau (la grille de ligne change, pas le contenu).

## Défauts connus des maquettes (à ne pas reporter tels quels)
- Liste mobile longue : chaque ligne fait 130 à 200 px (cible 44 px, 3 boutons empilés). Pas de ligne compacte sur téléphone ; un repliage par service n'est pas maquetté.
- Pas de swipe ni de raccourcis clavier ; pas d'annulation (undo) après « Absent » ou « Terminer ».
- Une journée à 40+ réservations n'a pas été simulée : longueur de page à valider.
- Polices chargées depuis Google dans les maquettes ; en production, `next/font`.
- Les captures pleine page montrent la barre basse au milieu (artefact de capture).

## Questions ouvertes (5 max)
1. **« Complet ce soir » : quelle portée et quel modèle ?** Dîner seul (18h-22h) ou journée ? Réglage par date ou drapeau sur la capacité ? Les maquettes supposent : dîner du jour, réversible, réservations existantes conservées. Décision ACC-03 (phase 17), à trancher avant d'implémenter.
2. **Allergies : champ dédié ou texte libre ?** Le modèle n'a que `occasion` et `admin_notes`. La maquette affiche une pastille « Allergie » ; sans colonne, il faut soit une détection par mots-clés (fragile, risque de faux négatifs sur un sujet de sécurité alimentaire), soit un champ `allergies` (migration non destructive) saisi dans les formulaires public et manuel. Quelle option ?
3. **Que veut dire « couverts réservés sur 40 » ?** Les maquettes affichent le pic simultané par service (cohérent avec 40 couverts à la fois et le blocage de 120 min), avec le total du jour en petit (49). Si la cheffe veut le total du jour contre 40, le chiffre perd son sens dès qu'il y a deux services. Confirmer.
4. **Libellé de `no_show` : « Absent » ou « Non présenté » ?** « Absent » tient sur un bouton de 44 px ; l'admin actuel dit « Non présenté » (badge) et « Absent » (bouton). Les serveurs préfèrent-ils « No-show » ?
5. **Un seul tap pour « Absent » suffit-il ?** Le contrat impose un dialogue pour Annuler (email client) mais aucun pour « Absent », qui exclut pourtant la réservation de l'avis J+1 et des KPI. Faut-il un toast « Annuler l'action » pendant 5 s, ce qui exigerait une transition inverse que `PUT /api/reservations` ne prévoit pas ?
