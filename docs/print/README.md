# Supports d'impression — tunnel d'avis

QR code et supports imprimables qui envoient les clients vers `https://geckocabanerestaurant.com/review?src=qr`.
Générés localement par `scripts/generate-review-print.mjs` (hors ligne, aucun service tiers).

## Fichiers

| Fichier | Contenu |
|---------|---------|
| `review-qr.svg` | QR vectoriel seul (correction d'erreur M, marge de 4 modules, `#0D1F17` sur blanc) |
| `review-addition-insert.pdf` | Insert addition : format fini 100 x 60 mm, QR à gauche, texte FR/EN/DE à droite |
| `review-chevalet-a6.pdf` | Chevalet de table : feuille 105 x 296 mm (deux faces A6 de 105 x 148 mm), pli à 148 mm |

## Géométrie

- Fond perdu : 3 mm sur les quatre côtés ; traits de coupe 0,25 pt hors du fond perdu (marge de 8 mm autour du format fini).
- Zone de sécurité : 5 mm à l'intérieur du format fini.
- Chevalet : la ligne de pli est un filet doré pointillé 0,25 pt dans la marge uniquement (hors format fini). La face B est tournée de 180 degrés pour se lire à l'endroit une fois pliée.
- Taille minimale du QR : 28 mm (insert) et 36 mm (chevalet), marge blanche incluse.
- Insert : pour que FR + EN + DE tiennent dans la zone de sécurité, les textes sont réduits à 55 % de l'échelle typographique prévue (titre environ 8,8 pt, corps environ 6 pt). Si le rendu papier est trop petit, passer à un format plus grand ou ne garder que les titres sur l'insert.
- Papier suggéré : couché mat 300 g pour le chevalet, 170 à 250 g pour l'insert. Conversion CMJN laissée à l'imprimeur.

## Régénérer

```bash
node scripts/generate-review-print.mjs
```

URL encodée : `https://geckocabanerestaurant.com/review?src=qr`

## Texte allemand — à relire

Le texte allemand doit être relu et validé par la propriétaire avant impression (D-17). Il n'est pas signalé sur le visuel.

- Titre : « Eine Bewertung hilft uns sehr »
- Corps : « Scannen Sie den Code, um eine Bewertung bei Google oder TripAdvisor zu hinterlassen. Danke, dass Sie diesen Moment mit uns geteilt haben. »

Statut : DE relu et validé le 2026-10-17 (réponse du propriétaire : « every thing approved »). Aucun relevé séparé du scan du QR n'a été fourni par le propriétaire.

## Avant le tirage

- Scanner une épreuve imprimée ou affichée à l'écran avec un iPhone et un Android avant de lancer l'impression.
- Aucune contrepartie ne peut être proposée en échange d'un avis (D-18).

## Supports newsletter (phase 7)

Générés par `scripts/generate-newsletter-print.mjs` (hors ligne). Le script refuse de tourner si le guide ou la recette sont vides.

| Fichier | Contenu |
|---------|---------|
| `newsletter-addition-insert.pdf` | Insert d'addition 100 x 60 mm, FR + EN, QR vers `https://geckocabanerestaurant.com/newsletter?src=qr`. Aucun mot sur les avis : support séparé de l'insert d'avis. |
| `wifi-table-card.pdf` | Carte WiFi A6 portrait, QR vers `https://geckocabanerestaurant.com/wifi?src=wifi`. Le mot de passe n'est jamais imprimé : il peut changer sans réimpression. |
| `newsletter-qr.svg`, `wifi-qr.svg` | QR vectoriels (mêmes réglages que l'avis). |

Les PDF du guide et de la recette sont dans `public/` (`guide-gourmand-krabi-town-{fr,en}.pdf`, `recette-curry-crabe-{fr,en}.pdf`) ; contenu et sources dans `docs/newsletter/` (`SOURCES.md`). Les versions DE et SV attendent la relecture de la phase 6. Les bandes image des emails sont générées par `scripts/generate-email-bands.mjs` dans `public/email/`.

Régénérer : `node scripts/generate-newsletter-print.mjs`. Scanner une épreuve avec un iPhone et un Android avant tirage.
