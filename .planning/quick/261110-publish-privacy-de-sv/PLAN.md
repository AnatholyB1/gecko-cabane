# Quick 261110 : publier la politique de confidentialité de/sv

Décision du propriétaire (2026-11-10, conversation Claude Code, message « Provacy valide, tu peux ajouter puis push » : « Privacy validé ») : la politique de confidentialité DE et SV (53 clés, section 5 de `RELECTURE-DE-SV.md`) est validée, sans correction.

## Étapes
1. `scripts/translation-scope.json` : entrée `privacy` (pageKey `/privacy`, préfixe `privacy`, metas incluses).
2. `node scripts/generate-review-docs.mjs de|sv` : 2 nouvelles fiches signées ; fiches existantes restaurées intactes.
3. `src/utils/seo.ts` : `/privacy` en fr/en/de/sv (PUBLISHED_PAGES et contentLocales).
4. Tests : porte de publication, slugs/noindex/sitemap, switcher, réciprocité hreflang affirment 4 langues.
5. Vérification : build, `next start` (3103), curl des 4 URLs, Chromium sans erreur console.
6. DEPLOY-CHECKLIST-v1.2, REQUIREMENTS, STATE.

Hors périmètre : autres textes ou pages, push, déploiement. Cache de la page (`s-maxage` d'un an, génération statique) conservé.
