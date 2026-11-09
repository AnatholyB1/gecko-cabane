# Phase 20 : contexte (décisions du 2026-11-09)
- D-01 : CSP appliquée directement (pas Report-Only), vérifiée en navigateur local : réservation, admin, Google Maps, Plausible/GTM, Sentry, Supabase.
- D-02 : en-têtes SEC-01 à 04 dans next.config (vague 1, ajout isolé) ; CSP (SEC-05) après B18 (chargement final des scripts).
- D-03 : a11y sans changer l'identité visuelle ; contrastes par ajustement minimal de jetons ; cibles 48 px ; aria-label = texte visible.
- D-04 : PERF-07 mesuré en local (`next start`, Lighthouse mobile) sur le build final ; mesure en ligne après déploiement (checklist).
