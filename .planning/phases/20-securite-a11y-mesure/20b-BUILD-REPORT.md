# 20b BUILD REPORT (SEC-05 CSP)

Branche phase/20b-csp. Module `src/utils/csp.ts` (`buildCsp`), branché dans `next.config.ts` `headers()` par une règle `/:path*` distincte (les 4 en-têtes de 20a sont intacts). Règle wifi étendue à `/:locale(fr|en|de|sv)/wifi`. Tests : `tests/csp.test.ts`.

## Politique finale (appliquée, pas Report-Only)
```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
font-src 'self' data:; connect-src 'self'; frame-src https://www.google.com; manifest-src 'self'; object-src 'none';
base-uri 'self'; form-action 'self'; frame-ancestors 'self'
```
+ `upgrade-insecure-requests` uniquement si `VERCEL=1` (évite de casser un `next start` en http local). + `'unsafe-eval'` uniquement si `NODE_ENV !== 'production'` (next dev). Jamais en production.

## Compromis script-src 'unsafe-inline'
Pages publiques SSG/ISR (phase 18) : un nonce par requête les rendrait dynamiques. Hash impossible : Next App Router injecte des scripts inline d'hydratation (`self.__next_f.push(...)`) différents par page et par build. Choix : `'unsafe-inline'`, sans `unsafe-eval`. Les blocs JSON-LD sont des données, hors CSP. L'inventaire ne montre aucun besoin d'eval (grep vide, aucune violation en prod). `style-src 'unsafe-inline'` : attributs `style={{}}` React et @font-face inline de next/font.

## Inventaire et justification des origines
- Scripts : Next (self + inline), Plausible via proxy `/gcm/js/script.js` (self, init inline Script), Sentry bundlé. Pas de GTM/gtag (grep vide).
- connect-src 'self' : Sentry via `tunnelRoute: /monitoring` (aucun ingest direct), Plausible `/gcm/api/event`, `/api/*`. Le client Supabase navigateur (`utils/supabase/client.ts`) n'est importé par aucun composant ni page : pas d'origine Supabase. Resend/serveur : hors CSP.
- Fonts : next/font/google auto-hébergées. Images : next/image locales (pas de remotePatterns), data:/blob: par prudence.
- frame-src https://www.google.com : iframe Google Maps (`output=embed`), monté après clic (MapEmbed). Les sous-ressources de l'iframe relèvent de la CSP de Google, pas de la nôtre.
- Liens wa.me, tel:, Google Maps (liens) : navigation, hors CSP. Formulaires : tous vers `/api` ou server actions, `form-action 'self'`.
- frame-ancestors 'self' : cohérent avec X-Frame-Options SAMEORIGIN de 20a.

## Wifi
curl sur `next start` : /fr, /en, /de, /sv `/wifi` renvoient tous `Cache-Control: private, no-store` (avant : de/sv seulement par le rendu dynamique par défaut).

## Vérification navigateur (Playwright 1.65 chromium headless, iPhone 14 et 1440x900, `next start -p 3105`, build avec `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID=pa-test`)
Réseau externe coupé (abort), `/gcm/*` et `/monitoring` interceptés (aucun appel à plausible.io ni Sentry), `www.google.com` simulé. Pages : /fr /en /de /sv /fr|de|sv/menu /fr/newsletter /fr/wifi /fr/review /fr/privacy /fr/inexistant (404) /admin/login (page seule, aucun identifiant).
- `securitypolicyviolation` / erreurs console CSP : **0** sur toutes les pages, deux viewports.
- Contrôle positif : script, iframe et fetch vers evil.example injectés sur /fr sont bien bloqués (3 violations attendues) : la CSP est active.
- Plausible : script `/gcm/js/script.js` chargé sur toutes les pages publiques (id factice). Sentry : erreur client déclenchée, POST sur `/monitoring` observés sans violation. Carte : iframe google.com/maps montée après clic (/en 2 viewports, /fr mobile). Formulaire de réservation : ouvert et champ rempli, non envoyé. Popup newsletter : s'ouvre sur desktop (exit-intent), 0 violation, non soumis.
- Seule erreur console restante : 404 attendu sur /fr/inexistant.

## Non prouvé
- Google Maps réel (iframe simulée, seul frame-src est exercé), Plausible réel (proxy rewrite vers plausible.io non exercé : réponse simulée), Sentry réel (POST interceptés, jamais reçus par Sentry).
- Popup newsletter en mobile (déclenchement 45 s ou scroll non obtenu dans le test) : même composant, aucune violation sur la page. Envoi réel d'une réservation/inscription : non fait par consigne.
- `upgrade-insecure-requests` et comportement sur Vercel (pages en cache CDN) non vérifiés. Safari/Firefox non testés.
- Les en-têtes de pages de metadata (opengraph-image) non testés en navigateur.

## Remarque environnement
Un `next start -p 3105` résiduel d'un autre worktree (agent-ad19afcb...) occupait le port ; arrêté par PID (30860 et son parent npx 46360). Build en worktree imbriqué : Turbopack déduit la racine `C:\gecko-cabane` et échoue sur next/font ; contourné en ajoutant temporairement `turbopack.root` (retiré avant commit).
