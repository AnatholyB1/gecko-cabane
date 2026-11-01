---
status: complete
quick_id: 261101-scj
commits: [b2f427c, f4cfa78, 8a122a6]
---

# Quick 261101-scj - Horaires dynamiques : summary

## Fait
- JSON-LD : jours fermes en 00:00-00:00 ; exceptions de `gecko_special_hours` (60 prochains jours, y compris les fermetures « Complet ce soir » qui y sont stockees avec `close_time` 16:00 ou `is_open=false`) en `OpeningHoursSpecification` avec `validFrom`/`validThrough`. Fonction pure `mapSpecialHours`, lecture `getSpecialHours` (cle anon, RLS public deja en place via la migration 007, tag `opening-hours`). `specialOpeningHoursSpecification` non utilise.
- Cache : `special-hours` (POST, DELETE) et `service-closure` (POST, DELETE) appellent `revalidateTag(OPENING_HOURS_TAG, 'max')`.
- Texte visible : `footer.openHours`, `footer.lastOrder`, `about.kitchenClose` interpoles (`{open}`, `{close}`), phrases des guides romanticDinner et whereToEat via `{hoursSentence}`, HoursDisplay sans heure en dur. fr, en, de, sv.
- Tests : `tests/hours-dynamic.test.ts` (nouveau), `tests/seo-jsonld.test.ts` et `tests/service-closure.test.ts` mis a jour.

## Decisions
- Si la semaine n'est pas uniforme (7 jours ouverts, meme plage) ou illisible, le texte sans heure `hoursText.varies` remplace les phrases a heure, plutot qu'une heure fausse ; la ligne « derniere commande » de HoursDisplay est masquee dans ce cas.
- Format d'heure par langue : fr 22h, en 10pm, de 22 (+ « Uhr » dans le message), sv 22 (+ « kl. » dans le message).
- Les docs de relecture `docs/ph6/review/{de,sv}` suivent les nouvelles valeurs (le test `review-docs` exige une ligne par cle).

## Laisse volontairement
`src/utils/newsletter-emails.ts`, `newsletter-campaign.ts` (22h00 / 10:00 pm dans les emails), `src/app/api/mcp/route.ts` (description d'outil), `src/app/admin/(app)/kit/KitClient.tsx`, `DEFAULT_CLOSE` (`site-logic.ts`), `KITCHEN_CLOSE` / `SERVICE_CLOSE` (regles de reservation) : hors du perimetre demande (messages, pages, HoursDisplay).

## Verification
Voir le rapport final : vitest (7 fichiers en echec avant et apres, paquet `@base-ui/react` absent), eslint 0 erreur, tsc sans nouvelle erreur, `npm run build` bloque par le meme paquet manquant.
