---
quick_id: 261101-scj
description: Horaires dynamiques - une source de verite pour le texte visible et le schema JSON-LD
mode: quick
---

# Quick 261101-scj - Horaires dynamiques

Source de verite : `gecko_opening_hours` (hebdomadaire) et `gecko_special_hours` (exceptions, y compris
les fermetures « Complet ce soir » qui y sont stockees), lues avec la cle anon et le RLS public, cache
`unstable_cache` sous le tag `opening-hours`. Aucune migration, aucune ecriture, aucune nouvelle colonne.
Reference : `.claude/skills/seo-geo-backlinks/SKILL.md` sections 1 et 2.

## Hors perimetre
`aggregateRating` / `social-proof.ts`, meta descriptions, actions externes, push, deploiement.

## Task 1 - Schema JSON-LD
- Files: `src/utils/seo.ts`, `src/utils/opening-hours.ts`, `src/utils/hours-text.ts`, `src/components/RestaurantJsonLd.tsx`, `src/app/[locale]/french-restaurant-krabi/page.tsx`, `tests/seo-jsonld.test.ts`
- Action: `mapOpeningHours` emet les jours fermes en `00:00`-`00:00` (option `includeClosed:false` pour le texte visible) ; `mapSpecialHours` (pure) produit une `OpeningHoursSpecification` datee (`validFrom`/`validThrough`) pour les 60 prochains jours ; `getSpecialHours` (meme tag) ; pas de `specialOpeningHoursSpecification`.
- Verify: `npx vitest run tests/seo-jsonld.test.ts`
- Done: le JSON-LD contient jours fermes et exceptions datees.

## Task 2 - Cache
- Files: `src/app/api/special-hours/route.ts`, `src/app/api/service-closure/route.ts`, `tests/service-closure.test.ts`
- Action: `revalidateTag(OPENING_HOURS_TAG, 'max')` apres chaque ecriture reussie, comme `/api/hours`.
- Verify: `npx vitest run tests/service-closure.test.ts`
- Done: toute ecriture d'horaire ou de fermeture rafraichit le schema et le texte.

## Task 3 - Texte visible
- Files: `messages/{fr,en,de,sv}.json`, `src/app/[locale]/page.tsx`, `src/components/seo/SeoLandingPage.tsx`, `src/components/HoursDisplay.tsx`, `docs/ph6/review/{de,sv}/*.md`, `tests/hours-dynamic.test.ts`
- Action: `footer.openHours`, `footer.lastOrder`, `about.kitchenClose` en `{open}`/`{close}` ; phrases des guides via `{hoursSentence}` (`hoursText.dailyKitchenUntil`, repli sans heure `hoursText.varies` si la semaine n'est pas uniforme ou illisible) ; HoursDisplay sans heure en dur (repli `hours.unavailable`) ; test anti-heure en dur sur `messages/*.json`.
- Verify: `npx vitest run`, `npm run lint`, `npx tsc --noEmit`
- Done: plus aucune heure litterale dans `messages/*.json` ni dans HoursDisplay.

## must_haves
- truths: l'heure de derniere commande = `close_time` ; pas de colonne ni de migration ; jour ferme = 00:00/00:00 ; exceptions datees avec validFrom/validThrough ; tag unique `opening-hours`.
