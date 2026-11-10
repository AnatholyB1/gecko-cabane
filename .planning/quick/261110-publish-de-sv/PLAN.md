# Quick 261110 : publier les versions de/sv de getting-here-from-ao-nang et wine-belgian-beer-krabi

Décision du propriétaire (2026-11-10, conversation Claude Code, message « Les fichiers sont relu c'est validé », sans correction) : les textes DE/SV du fichier de relecture sont validés.

## Étapes
1. `scripts/translation-scope.json` : deux entrées de fichier (préfixes de page + metas).
2. `node scripts/generate-review-docs.mjs de|sv` : 4 nouvelles fiches signées (format existant), fiches existantes non modifiées.
3. `src/utils/seo.ts` : PUBLISHED_PAGES des deux pages en fr/en/de/sv ; privacy inchangée (fr/en).
4. Tests : publication à 4 langues (porte de publication, hreflang, sitemap, switcher, nav des guides, noindex).
5. Vérification : build, `next start` (port 3103), curl des 8 URLs, Chromium sans erreur console.
6. Mise à jour REQUIREMENTS (ONP-04/05/11), ROADMAP, DEPLOY-CHECKLIST-v1.2, STATE.

Hors périmètre : privacy de/sv, autres textes, CSP/en-têtes, push, déploiement.
