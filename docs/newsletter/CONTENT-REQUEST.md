# Contenu du guide gourmand et de la recette

Mise à jour du 2026-10-29 : le propriétaire a autorisé un contenu issu du web. Le guide (9 lieux) et la recette sont donc déjà rédigés dans `guide-content.json` et `recipe-content.json`, avec leurs sources dans `SOURCES.md`. Rien n'est vérifié sur place.

Ce qui reste utile de votre part :

- relire les 9 lieux et corriger ce que vous savez faux ou périmé (horaires, prix, points de départ) ;
- ajouter vos propres adresses (nom, catégorie, adresse ou lien Maps, une phrase dans vos mots, photo facultative dans `docs/newsletter/photos/`) : schéma `{ name: {fr, en}, category, address: {fr, en}, mapsUrl, why: {fr, en}, photo }` ;
- faire tester la recette par la cheffe, ou la remplacer par la sienne (alors seulement la lui attribuer) ;
- le nom du réseau WiFi et son mot de passe sont relevés sur place et saisis dans `.env.local` / Vercel, jamais dans ce dépôt ;
- formats d'impression : insert d'addition 100 x 60 mm, carte WiFi A6 portrait ;
- DE et SV : après la relecture de la phase 6.

Après chaque modification : `node scripts/generate-newsletter-print.mjs`.
