# Checklist de déploiement v1.2 (actions humaines ou après accord du propriétaire)
- [x] Relecture humaine DE/SV : H1, metas et pages getting-here / wine-belgian-beer (ONP-11) : **validée le 2026-11-10** par le propriétaire (conversation Claude Code, « Les fichiers sont relu c'est validé », aucune correction fournie) ; pages de/sv publiées (quick 261110-publish-de-sv)
- [x] Politique de confidentialité DE/SV (`/de/privacy`, `/sv/privacy`) : validée par le propriétaire et publiée le 2026-11-10 (message « Provacy valide, tu peux ajouter puis push », aucune correction ; quick 261110-publish-privacy-de-sv)
- [ ] Déploiement : uniquement sur demande explicite du propriétaire ; rien n'est poussé
- [ ] Après déploiement : `x-vercel-cache: HIT` au 2e appel sur /fr /en /de /sv (PERF-02) ; Lighthouse mobile en ligne ≥ 90 (PERF-07)
- [ ] Après déploiement : Rich Results Test sur Restaurant et Menu (ONP-07) ; Search Console : soumettre le sitemap mis à jour
- [ ] Après déploiement : vérifier qu'aucune violation CSP n'apparaît (console) sur réservation, Maps, Plausible, admin
- [ ] Variables d'environnement : comparer les `process.env.X` du code aux variables Vercel avant mise en ligne
- [x] Accord propriétaire : page FR vin/bière belge (l'accord du 2026-10-18 portait sur l'EN) : **validé le 2026-11-09, source : validé par le propriétaire en conversation** (accord alcool, texte FR tel quel, aucun changement de code)
- [x] Feuilles de validation DE/SV pour les 12 phrases modifiées (ONP-09) : couvertes par la validation du propriétaire du 2026-11-10 (relecture de `RELECTURE-DE-SV.md`), anciennes fiches non éditées ; les pages de/sv getting-here et wine-belgian-beer sont publiées (indexables, sitemap, hreflang) depuis cette validation (voir « Décisions du 2026-11-09 » : le document de relecture est prêt)
- [x] Décision propriétaire 2026-11-09 : les phrases « son mari français, Frédéric » (about.story1, frenchRestaurant.story1, romanticDinner chef p1, about.couplePhotoAlt) sont **gardées telles quelles**
- [ ] Étendre la règle no-store du wifi à de/sv (risque de cache public après B18)
- [ ] **PERF-07 en ligne** : mesurer PageSpeed Insights mobile sur /fr et /en après déploiement ; en local la médiane est 73-75 et dépend de la machine (le score monte à 90+ quand les scripts arrivent après l'instant LCP, comme sur un vrai réseau, non revendiqué)
- [x] Décision propriétaire 2026-11-09 : Sentry côté client **gardé tel quel** (on mesure en ligne d'abord ; le gain potentiel ~+7 points Lighthouse reste à rouvrir après mesure)
- [x] (publiée le 2026-11-10, voir en tête) Privacy DE/SV : décision du 2026-11-09 = traduction préparée, **activation après relecture** juridique et native (voir ci-dessous). Constat : `/de/privacy` et `/sv/privacy` affichent déjà le brouillon DE/SV des fichiers de messages (commit 7757601, 53 clés), pas le repli EN ; pages noindex, cache d'un an
- [x] Décision propriétaire 2026-11-09 : H1 de `/menu`, `/wifi`, `/review` rendus descriptifs dans les 4 langues (appliqué, commit a77c301, clés `menuPage.title`, `wifi.title`, `review.title`)

## Décisions du 2026-11-09

- [x] Page FR vin/bière belge : validée par le propriétaire en conversation (accord alcool), date 2026-11-09.
- [x] Mari Frédéric : garder tel quel.
- [x] Sentry : garder tel quel (on mesure en ligne d'abord).
- [x] H1 de `/menu`, `/wifi`, `/review` : appliqués. fr « Menu franco-thaï à Krabi Town » / « Wi-Fi du restaurant Gecko Cabane » / « Votre avis sur Gecko Cabane » ; en « French-Thai Menu in Krabi Town » / « Gecko Cabane Restaurant Wi-Fi » / « Your review of Gecko Cabane » ; de « Französisch-thailändische Speisekarte in Krabi Town » / « WLAN im Restaurant Gecko Cabane » / « Ihre Bewertung von Gecko Cabane » ; sv « Fransk-thailändsk meny i Krabi Town » / « Wifi på restaurang Gecko Cabane » / « Din recension av Gecko Cabane ». Les H1 DE/SV sont dans le document de relecture.
- [x] Privacy DE/SV : traduction préparée dans `.planning/phases/19-seo-on-page/RELECTURE-DE-SV.md` (section 5, relecture juridique et native obligatoire) ; aucune clé ajoutée aux fichiers de messages ; activation (ou retour en 404/repli) seulement après validation du relecteur.
- [x] Relecture DE/SV : fichiers créés (`RELECTURE-DE-SV.md`, `RELECTURE-DE.csv`, `RELECTURE-SV.csv` dans `.planning/phases/19-seo-on-page/`).
- [x] Relecture par le propriétaire : fichiers relus et validés le 2026-11-10, aucune correction fournie ; les pages de/sv getting-here et wine-belgian-beer sont publiées (indexables, sitemap, hreflang). La privacy DE/SV a été validée et publiée séparément le 2026-11-10.
- [ ] Ticket à part : débordement horizontal du `SiteHeader` sur les sous-pages à 390 px (préexistant, jusqu'à 469 px pour /de/menu) ; sélecteur de langue 25-27 px de large
- [ ] `GET /api%2Fhours` répond 500 (bruit Sentry, aucun accès ouvert) ; `revalidateTag(..., 'max')` sert l'ancienne page au premier visiteur après une modification admin
- [ ] Après déploiement : vérifier Google Maps réel sous la CSP (`frame-src https://www.google.com` ; une redirection vers `maps.google.com` serait bloquée), Plausible (variable `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` + redéploiement : les rewrites sont figés au build), Sentry via `/monitoring`
- [ ] Le build lit la vraie base Supabase en lecture seule (clé anon) comme tout build du dépôt

## Poussé et vérifié en ligne (2026-11-10, master 614dfbb)
- [x] PERF-02 : `x-vercel-cache: HIT` au 2e appel sur /fr /en /de /sv /fr/menu, aucun `set-cookie`
- [x] PERF-07 : Lighthouse mobile en ligne (3 passes) : /fr 96-97, /en 95-98 ; accessibilité, SEO, bonnes pratiques 100 ; LCP 1,2-1,6 s, TBT 160-250 ms, CLS 0 (base : 72)
- [x] CSP, Permissions-Policy, Referrer-Policy et HSTS reçus en production ; pages de/sv (getting-here, wine-belgian-beer, privacy) en 200 ; /de/nope en 404 ; sitemap à 32 URLs
- [ ] Restent à contrôler à la main : Google Maps réel sous la CSP (clic sur la carte, console), Plausible (variable + redéploiement), Sentry via /monitoring, Rich Results Test (Restaurant, Menu), soumission du sitemap à Search Console
