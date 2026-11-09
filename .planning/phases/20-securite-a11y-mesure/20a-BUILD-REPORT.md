# 20a BUILD REPORT (SEC-01..04)

Branche phase/20a-headers. Ajout dans `next.config.ts` `headers()` : règle `/:path*` avec X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, X-Frame-Options SAMEORIGIN, Permissions-Policy `camera=(), microphone=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), magnetometer=(), gyroscope=(), accelerometer=()`. Pas de geolocation dans le code (grep vide), donc non listé. Pas de CSP (SEC-05, vague 2). Règle wifi conservée.

Test : `tests/security-headers.test.ts` (4 en-têtes + wifi).

## En-têtes reçus (`next start -p 3105`, curl -sI)
Les 4 en-têtes présents, valeurs identiques, sur : /fr, /en, /de, /sv, /admin/login, /api/hours, /fr/wifi, /en/wifi, /de/wifi, /monitoring (404 en local, voir ci-dessous).
Cache-Control : /fr/wifi et /en/wifi = `private, no-store` (règle conservée). /fr /en /de /sv /admin/login /de/wifi = `private, no-cache, no-store, max-age=0, must-revalidate` (rendu dynamique par défaut de Next, antérieur à ce changement). /api/hours : pas de Cache-Control.

## À signaler
- /de/wifi et /sv/wifi ne sont pas couverts par la règle `/:locale(fr|en)/wifi` : /de/wifi reçoit no-store par le rendu dynamique, mais sans garantie explicite. Non corrigé (consigne).
- Les pages publiques répondent en no-store (dynamiques) : constat, hors périmètre.

## Non prouvé
- /monitoring (tunnel Sentry) : 404 en local sur GET sans DSN/envoi réel ; l'envoi POST d'un événement Sentry n'a pas été testé.
- Images OG (/opengraph-image) non curlées ; X-Frame-Options/nosniff ne devraient pas les affecter, non vérifié.
- Aucun test navigateur (iframes tierces, Plausible, paiement) ; comportement sur Vercel non vérifié.

## Gate
vitest 140 fichiers / 2242 tests passés (1 skipped), tsc 0 erreur, lint 0 erreur (2 warnings img préexistants), build OK.
