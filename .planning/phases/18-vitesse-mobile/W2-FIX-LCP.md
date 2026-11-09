# W2-FIX-LCP : PERF-07, LCP et score Lighthouse mobile

Branche `fix/w2-lcp` (base `milestone/v1.2` 710075b). Design et textes inchanges. **Cible 90 sur /fr et /en : non atteinte en local avec la mesure par defaut ; cause du palier identifiee et prouvee ; un seul changement conserve (image du gecko, -36 Ko).**

## 1. Methode de mesure (et pourquoi elle varie)

- Build `next build` avec un faux serveur de donnees (reponse `[]`, port 3108, arrete apres le build), `.env.sentry-build-plugin` ecarte pendant le build, `turbopack.root` temporaire (retire). Serveur : `next start -p 3108` (PID propre, tue par PID). Verrou machine pris par moi pour toute la serie. Chromium 158 / Lighthouse 13.6, mobile, throttling **simule** par defaut (Slow 4G, CPU x4), 5 passes par page, page d'echauffement non comptee, `/monitoring` bloque, trace et JSON complets conserves (`--output=json` equivalent via l'API : `r.lhr` + `r.artifacts.Trace`). Scripts : `.planning/phases/18-vitesse-mobile/w2-lcp-tools/` (w2-lh, w2-build, w2-stub, w2-delay-server, w2-insp, w2-exp ; Lighthouse et Playwright sont installes hors depot).
- Machine : 16 CPU logiques, benchmarkIndex Lighthouse 1900-2300 (stable), pas de charge parasite relevee (verrou).

### Cause de la distribution bimodale (prouvee)

Lighthouse simule le LCP a partir d'un graphe : tous les noeuds reseau terminees avant l'instant LCP **observe** et leur evaluation CPU y entrent (code `FirstContentfulPaint.getFirstPaintBasedGraph`). En local, LCP observe = 0,34 a 0,6 s (presentation du premier cadre en headless) ; le bundle principal (`249166…js`, 401 Ko brut / 125 Ko gzip : runtime Next, React DOM, coeur Sentry) arrive en 20 ms et s'evalue en ~100 ms **avant** ce LCP. Il entre donc dans le graphe : 123 Ko + 4 x son temps CPU + les polices (162 Ko) + le CSS => LCP simule 4,7-5,1 s, score 71-78 (« mode lent »). Si la livraison des scripts depasse l'instant LCP observe (reseau reel, ou a-coup machine), le bundle sort du graphe : LCP simule 2,3 s, score 88-97 (« mode rapide »). Constats :

- Master et final : `/fr` passes 92/73/72/71/76 puis 76/74/78/75/74 ; la passe a 92 a un `scripts fini a 859 ms` (a-coup) contre ~100 ms dans les autres. Les « 92-93 » et « 96-98 » des mesures precedentes sont des passes du mode rapide (ou une page distante, ou les scripts arrivent apres le premier affichage).
- Preuve par diagnostic (jamais un resultat revendique) : serveur local qui livre les `/_next/static/chunks/*.js` avec 700 ms de retard (`w2-delay-server.mjs`). Resultat : 10 passes sur 10 en mode rapide, LCP 2,30-2,34 s sur toutes les passes (au lieu de 4,7-5,1), score /fr 91 (81-95), /en 90 (88-94) ; apres changement 92 (90-97) / 91 (88-94). La variabilite restante est le TBT (209-668 ms).
- Throttling **applique** (devtools, pas simule, LCP reellement mesure) : /fr 79 (78-79), /en 79 (77-80), LCP 2,6 s (= FCP), TBT 535 ms, tres stable. Le LCP reel est donc ~2,6 s sur 4G lente avec CPU x4, TBT ~535 ms (le score 79 vient du TBT).
- LCP observe en local = 0,5 s, element = logo « GECKO CABANE » (`<p class="font-cinzel-decorative">`), phase « element render delay » 90 % simule / 21 % observe. Le chemin critique reel : HTML 36 Ko gzip (TTFB 10-25 ms local), 1 CSS bloquant 12,5 Ko, 5 polices preloaded 162 Ko (haute priorite, en concurrence avec le CSS), JS en `async` basse priorite. Cinzel Decorative = 16 Ko (une seule face latin, 700) : ce n'est pas la police qui retarde le LCP (le texte s'affiche avec la police de secours a taille ajustee, un seul candidat LCP, CLS 0). L'hypothese « swap de police » de l'audit est **refutee** : la cause est le graphe simule du bundle JS.

## 2. Changements essayes, avec chiffres (build, 5 passes, mediane et plage)

| Essai | /fr | /en | Verdict |
|---|---|---|---|
| Reference (milestone) | 73 (71-92), LCP 5,05 s, TBT 351 | 74 (73-78), LCP 4,86 s, TBT 360 | |
| `experimental.inlineCss` | 70 (67-74), TBT 479 | 72 (69-74) | **Rejete** : Next recopie le CSS 3 fois (HTML 36 -> 72 Ko gzip, RSC inclus). |
| Polices `preload: false` (4 familles) | 78 (76-78), LCP 4,96, TBT 181 | 77 (76-78) | **Rejete** : FCP simule 0,92 -> 2,13 s (les polices passent derriere le CSS dans la chaine critique), CLS 0 -> 0,012 ; le « gain » de TBT est un artefact (la fenetre TBT commence au FCP, les longues taches du bundle sortent de la fenetre). Ce serait tricher. |
| Sentry client retire (experience, non commitee) | 80 (79-85), LCP 4,37, TBT 250 | 80 (77-82) | **Gain potentiel documente, decision proprietaire** : meme sans aucun Sentry le palier reste ~80 en mode simule local. Non commite. |
| `content-visibility: auto` sections sous le pli | mode rapide 94/93 ; mode simule 77/76 | | **Rejete** : ancres decalees (ex. `#hours` 792 px au lieu de 1022 px du haut apres saut, `#reservation` +106 px), diff pixel important en capture. Risque sur le CTA « Reserver ». Piste a revoir seulement avec des tailles intrinseques mesurees par section et par langue. |
| **Image du gecko 503x800 (49 Ko) -> 136x216 (13,5 Ko)** (`public/gecko-mark-sm.png`, 2 `<img>` de `page.tsx`) | 75 (74-78), LCP 4,69, TBT 341 | 74 (70-78), LCP 4,74, TBT 365 | **Conserve** : -36 Ko reels (octets images /fr 85 363 -> 49 413 ; total Lighthouse 671 -> 636 Kio), affiche 45x72 px (3x = 216 px). Score dans le bruit (le noeud est une image basse priorite hors du graphe LCP). |

Avant/apres du changement conserve, toutes methodes :

| Methode | /fr avant -> apres | /en avant -> apres |
|---|---|---|
| Simule par defaut, 5 passes | 73 (71-92) -> 75 (74-78) | 74 (73-78) -> 74 (70-78) |
| Throttling applique, 3 passes | 79 -> 79 (LCP 2,63 -> 2,60 s) | 79 -> 79 (2,64 -> 2,61 s) |
| Diagnostic scripts +700 ms, 5 passes | 91 (81-95) -> 92 (90-97) | 90 (88-94) -> 91 (88-94) |

Ces ecarts sont du bruit, sauf les octets (-36 Ko, exacts).

## 3. TBT

Taches longues (trace) : `EvaluateScript` du bundle principal 102 ms reels (x4 = 408 ms simules, ce seul poste fait ~350 ms de TBT), puis 10 `FunctionCall` d'hydratation de 5 a 16 ms. `NewsletterPopup` est deja differe (chunk 8,9 Ko apres idle) ; `FloatingContact`, `AttributionCapture`, `PlausibleScript` pesent quelques Ko et ne dominent aucune tache longue : les differer n'aurait pas d'effet mesurable et risquerait de perdre l'attribution. **Sentry : non differe, non desactive.** Gain potentiel mesure (experience) : TBT 351 -> 250 ms, score +7 en mode simule, au prix de la perte des erreurs et transactions avant l'init ; decision proprietaire.

## 4. /fr/menu : +22 Ko gzip vs master (cause)

Scripts telecharges sur `/fr/menu` (mobile, networkidle, stub vide) : 17 fichiers / 270 652 o gzip contre /fr 15 fichiers / 264 868 (master 13 fichiers / 242 482). Le menu **n'importe pas** plus de JS que l'accueil (son jeu de scripts est un sous-ensemble de celui de /fr). Le surplus est du prefetch `<Link>` : depuis que les pages sont statiques (SSG), Next prefetche en entier les routes liees. Sur le menu, le lien « Reserver » (`/#reservation`) et le logo prefetchent l'accueil, ce qui charge le chunk `ReservationForm` (12,9 Ko gzip), plus le chunk popup lazy (8,9 Ko), plus 2 petits chunks de route (5,8 Ko) = ~28 Ko. Sur master les pages etaient dynamiques : le prefetch ne chargeait que la limite de chargement. Ce trafic est de basse priorite, apres le LCP, sans effet sur LCP/TBT mesures. Non corrige volontairement : le supprimer reviendrait a retirer le prefetch du CTA principal (navigation instantanee vers l'accueil). Piste : `prefetch={false}` sur les liens secondaires, notamment le selecteur de langue qui prefetche les 3 autres langues du menu (`/sv/menu`, `/de/menu`, `/en/menu`, ~12 requetes `_rsc`) ; fichier `LanguageSwitcher.tsx` appartient a `fix/w2-core`, non touche.

## 5. Non regression

- Captures pleines pages (iPhone 14 et 1440, apres defilement complet, animations coupees, popup masque) /fr, /en, /fr/menu avant/apres : /fr iPhone 267 px de 56 M (0,0005 %), 1440 22 px (0,0001 %), /en idem, /fr/menu 0 px : toutes sous 0,1 %. Seul le gecko change (reechantillonnage Lanczos).
- Gecko : 45,3 x 72,0 px (hero) et 22,7 x 36,0 px (pied), comme avant ; 6 champs du formulaire de reservation, 3 liens de langue, 0 erreur console/page. Popup newsletter : code non modifie, non redeclenche ici (delais longs), a rejouer au besoin.
- `check:build-output` : voir gate ci-dessous.

## 6. Ce qui reste non atteignable / non prouve

- ≥ 90 local en mode simule par defaut : **non atteignable de facon reproductible** sans retirer du JS : meme sans Sentry, 80. Le bundle (runtime Next + React DOM = ~190 Ko gzip) entre toujours dans le graphe de LCP quand il arrive avant le premier affichage observe, ce qui est systematique sur `localhost`. Sans tricher sur la mesure, le local donne 73-75 (mode lent), 79 en throttling applique, 90-92 seulement quand les scripts arrivent apres le premier affichage.
- Non prouve : le score reel en ligne (CDN, HTTP/2, latence) ; il devrait ressembler au « mode rapide » (88-97, TBT variable) mais cela doit etre mesure sur l'URL publique (PageSpeed Insights). Non mesure : Plausible actif.
- Pistes restantes : differer l'init Sentry (decision proprietaire, +7 simule), tailles intrinseques par section pour `content-visibility` (risque ancres), sous-ensemble de Cinzel Decorative (-14 Ko, hors graphe de score), `prefetch={false}` sur liens secondaires.
