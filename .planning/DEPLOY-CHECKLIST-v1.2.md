# Checklist de déploiement v1.2 (actions humaines ou après accord du propriétaire)
- [ ] Relecture humaine DE/SV : H1, metas et pages getting-here / wine-belgian-beer (ONP-11) avant mise en production
- [ ] Déploiement : uniquement sur demande explicite du propriétaire ; rien n'est poussé
- [ ] Après déploiement : `x-vercel-cache: HIT` au 2e appel sur /fr /en /de /sv (PERF-02) ; Lighthouse mobile en ligne ≥ 90 (PERF-07)
- [ ] Après déploiement : Rich Results Test sur Restaurant et Menu (ONP-07) ; Search Console : soumettre le sitemap mis à jour
- [ ] Après déploiement : vérifier qu'aucune violation CSP n'apparaît (console) sur réservation, Maps, Plausible, admin
- [ ] Variables d'environnement : comparer les `process.env.X` du code aux variables Vercel avant mise en ligne
- [ ] Accord propriétaire : page FR vin/bière belge (l'accord du 2026-10-18 porte sur l'EN) ; feuilles de validation DE/SV à refaire pour les 12 phrases modifiées (ONP-09) ; les pages de/sv getting-here et wine-belgian-beer sont noindex et hors sitemap tant qu'elles ne sont pas relues
- [ ] Décision propriétaire : les phrases « son mari français, Frédéric » (about.story1, frenchRestaurant.story1, romanticDinner chef p1, about.couplePhotoAlt) contredisent-elles la présentation par la cheffe Jariya ?
- [ ] Étendre la règle no-store du wifi à de/sv (risque de cache public après B18)
