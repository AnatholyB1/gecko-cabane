# Demande de contenu — Guide gourmand, recette et supports imprimés

Ce que Claude ne peut pas inventer (D-17) et dont nous avons besoin pour générer les PDF.
Aucun lieu, ingrédient ou étape ne sera écrit sans votre réponse.

## 1. Guide gourmand de Krabi Town (8 à 12 adresses)

Pour chaque lieu :

- nom du lieu ;
- catégorie : marché / street food / café / bar / plage / activité ;
- adresse ou lien Google Maps ;
- une phrase qui dit pourquoi vous le recommandez, dans vos mots ;
- optionnel : une photo (à déposer dans `docs/newsletter/photos/`).

Dites aussi si Gecko Cabane doit apparaître dans le guide.

Schéma attendu dans `guide-content.json` (champ `places`) :

```json
{ "name": "", "category": "", "address": "", "mapsUrl": "", "why": { "fr": "", "en": "" }, "photo": "" }
```

## 2. Recette du curry de crabe de la cheffe Jariya

- ingrédients avec quantités (pour 2 ou pour 4) ;
- étapes de préparation ;
- conseils de la cheffe ;
- optionnel : une photo.

## 3. WiFi

Le nom du réseau (SSID) et le mot de passe ne sont écrits ni dans ce fichier ni dans le dépôt.
Le mot de passe est saisi dans les variables d'environnement au lancement (plan 07-10) : la carte
imprimée ne contient qu'un QR vers `/wifi?src=wifi`, donc le mot de passe peut changer sans réimprimer.

## 4. Formats d'impression à valider

- Insert d'addition : 100 x 60 mm (comme l'insert d'avis), séparé de l'insert d'avis.
- Carte WiFi de table : A6 portrait.

## 5. Langues

Le guide et la recette sont en FR et EN. Les versions DE et SV viennent après la relecture de la phase 6.
