# D4 : critique et audit des maquettes

Méthode : passage scripté (débordement, 14 px, 44 px, contraste, axe-core, 102 combinaisons page x largeur) puis relecture visuelle des captures 390 / 768 / 1440. Les skills `critique` et `audit` n'ont pas été exécutés en workflow complet ; la grille ci-dessous reprend leurs critères.

## Constats traités pendant la conception

| Constat | Correction |
|---|---|
| Première passe : 102 pages sur 102 avec anomalie (lien de marque 34 px, bascule mot de passe 42 px, note de maquette hors landmark, régions défilantes non focusables, `dl` invalide, landmarks dupliqués) | Marque 44 px, bascule 44 px, note en `aside` nommé, tableaux `tabindex=0` + `aria-label` uniques, `dl` corrigée, en-tête de marque en `header`. Dernier passage : 0 anomalie. |
| Table et cartes de semaine visibles ensemble sur grand écran (`display` écrasé par `.weeks`) | `!important` ciblé sur la bascule mobile. |
| Icône d'avis seule sur sa ligne sur mobile (flex-wrap) | Le retour à la ligne ne s'applique qu'aux avis qui portent une action. |
| Écarts KPI : la couleur seule exprimait favorable / défavorable | Flèche + signe + valeur ; favorable / défavorable en texte lecteur d'écran. |

## Points forts

- Hiérarchie nette : un titre display par page, filet laiton de 48 px, chiffres de synthèse en display, le reste sobre.
- Le garde-fou est impossible à manquer et ne dépend pas de la couleur (pastille `TEST`, compteur, phrase de règle).
- Aucun envoi sans dialogue ; l'action sûre (« Annuler ») reçoit le focus initial.
- Aucune ombre, aucune carte imbriquée, aucun emoji, aucun dégradé.

## Faiblesses connues (non corrigées)

1. La page KPI est longue (garde-fou, envoi, historique, détail, formulaire) : environ 4 000 px à 1440. Un détail de semaine en panneau latéral ou en route dédiée la raccourcirait, mais ajoute de la navigation.
2. Le tableau KPI desktop défile horizontalement dès 768 px (9 colonnes). Une première colonne figée améliorerait la lecture ; non faite.
3. La coquille de navigation est factice (D1). Les maquettes ne prouvent pas l'intégration avec l'en-tête réel ni le bouton « + Réservation ».
4. Cormorant Garamond est remplacé par Georgia dans les captures (pas de réseau) : l'allure finale sera un peu plus fine.
5. Pas de mode sombre : hors périmètre v1.1.
6. Les critères de mot de passe (12 caractères) dépassent le minimum actuel de Supabase : à confirmer côté configuration Auth.

## Questions ouvertes (5 maximum)

1. **Source de la note moyenne et de la répartition.** Le code ne stocke aujourd'hui que le total d'avis et la note minimale de la semaine. Faut-il les collecter (Places / Search Console), les saisir, ou ne pas les afficher ? Sans réponse, la zone « Note et totaux » reste étiquetée « exemple » dans les maquettes et masquée en production.
2. **Passage en live depuis l'admin.** Le design interdit tout bouton live (réglage serveur seulement, même après le 2026-11-16). Le propriétaire accepte-t-il de garder ce réglage hors de l'interface, ou veut-il un interrupteur confirmé par saisie du mot « live » après le 2026-11-16 ?
3. **Mot de passe oublié.** Aucun parcours n'existe. Le lien est dessiné sur la connexion car l'invitation introduit déjà un écran « choisir un mot de passe » réutilisable. À inclure en phase 17, ou à retirer de la maquette ?
4. **Droits des invités.** L'invitation donne un accès administrateur complet (tout ou rien, comme `gecko_admins` aujourd'hui). Faut-il prévoir un rôle limité (réservations seulement) pour du personnel de salle ?
5. **Confirmation de l'alerte note <= 3.** Le code envoie aujourd'hui l'email d'alerte à l'enregistrement sans confirmation. Le contrat ajoute un dialogue. Le propriétaire valide-t-il ce changement de comportement, ou préfère-t-il l'avis en ligne seul ?
