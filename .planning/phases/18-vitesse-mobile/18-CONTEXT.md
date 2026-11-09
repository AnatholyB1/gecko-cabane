# Phase 18 : contexte (décisions du 2026-11-09)
- D-01 : le middleware ne touche plus Supabase sur les pages publiques /fr /en /de /sv ; la session reste pour /admin, /api, /auth. Objectif : HTML public statique/ISR, `Cache-Control: public` (PERF-01, PERF-02).
- D-02 : trouver la cause réelle du `private, no-cache, no-store` (middleware, cookies(), headers(), fetch sans cache) et la prouver (curl sur `next start`).
- D-03 : design et textes inchangés ; polices via next/font ; script Plausible `/gcm/js/script.js` en cache long ou lazyOnload ; width/height sur toutes les images.
- D-04 : `/[locale]/wifi` reste `private, no-store` (identifiants par requête, T-07-05-03). Les pages newsletter (searchParams) restent dynamiques.
- Preuve locale : en-têtes de `next start` + build (routes marquées statiques/ISR). `x-vercel-cache: HIT` ne se prouve qu'en ligne : DEPLOY-CHECKLIST-v1.2.
