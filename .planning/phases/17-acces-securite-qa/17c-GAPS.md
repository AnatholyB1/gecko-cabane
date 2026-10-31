# 17c - Écarts restants (maquette -> réel, et résiduel de mesure)

Comparaison par captures à 390 et 1440 (écrans Aujourd'hui, Carte, Réputation/Avis ; maquettes D2, D3, D4). Hiérarchie, typographie
et palette conformes. Écarts non corrigés (non mécaniques ou risque de régression) :

1. En-tête mobile : la maquette affiche « Gecko Cabane / Administration » ; le réel n'affiche que le monogramme « G » sous 480 px (choix CSS du shell).
2. Aujourd'hui : la maquette ajoute les compteurs par heure au-dessus des barres, le bandeau « Complet ce soir » en état, des lignes par service
   repliables ; le réel garde les barres et le bouton « Complet ce soir ».
3. Carte : la maquette indique « N plats » par catégorie (et « 1 indisponible »), l'étiquette « Sans gluten » ; absents du réel.
4. Réputation/Avis : la maquette affichait note moyenne et répartition (chiffres d'exemple) ; volontairement absents (aucun chiffre inventé).
   La saisie Google disparaît (REP-03), remplacée par la valeur collectée en lecture seule.
5. Zoom 200 % à 195 px (hors exigence WCAG 1.4.10 qui s'arrête à 320 px) : débordements résiduels de la page Site public (ligne d'horaires,
   115 px), Annonces (31), Accès (42), Kit (33). En-tête et barre du bas : 0.
6. Kit (`/admin/kit`) : cibles 36 px à >= 1024 px avec souris (variante dense documentée, volontaire).
7. Étiquettes de nav à 12 px : exception acceptée par le propriétaire.
8. Dev uniquement : le bouton rond « N » (Next.js dev) ne figure pas en production.
