# AUDIT v1.0 - Phase 6 (SEO pages, DE/SV, external presence)

Base: master (c12faf4). Read-only audit of src/ and messages/. Static review only: node_modules absent, so tests, tsc, lint and build were NOT run, and nothing was fetched from a live site. Format: `SEV | file:line | problem | fix`.

## Findings

### HIGH
- HIGH | src/utils/social-proof.ts:31-32,72,120 + src/utils/seo.ts:392 | Restaurant JSON-LD emits `aggregateRating` 4.7 / reviewCount 1062 as hard-coded constants, labelled "google" while the only displayed reviews are 3 TripAdvisor ones. The 1062 count is not backed by anything displayed or verifiable in the repo. Self-served LocalBusiness ratings are also outside Google review-snippet eligibility. Breaks the constraint "no unverifiable claim in schema (ratings)". | Set `SHOW_AGGREGATE_RATING=false` (one line) until count and score are verified and the same figures are visibly sourced; or drop `aggregateRating` from `buildRestaurantJsonLd`.
- HIGH | src/utils/seo.ts:32-35 (de, sv in PUBLISHED_PAGES) + docs/ph6/review/{de,sv}/*.md | DE and SV are indexed and in the sitemap on the strength of the owner's "approved" message. No named native reviewer; OWNER-CHECKLIST itself says "no native reviewer identified". The gate test (tests/i18n-publication-gate.test.ts, regex `SIGNED`) only checks that a sign-off line exists, so it cannot prove a human actually reviewed the text. Constraint "DE/SV texts reviewed by a human" is met formally, not substantively. | Get a native read of DE (and SV) before relying on it, or pull de/sv from PUBLISHED_PAGES (noindex) until then. Make the gate require a reviewer name.

### MEDIUM
- MEDIUM | src/i18n/request.ts:31 + messages/de.json, sv.json | 192 en keys are missing in de and sv, so published, indexable DE/SV pages show English for: newsletter form, popup, footer, consent text (newsletter.*, 41 keys), socialProof.*, payment.note, reviewFeedback.*, privacy.*, wifi.*, line.*. Mixed-language pages hurt DE/SV relevance, and English GDPR/PDPA consent wording shown to DE/SV users is weak for "explicit consent". The publication gate only checks the keys in `scripts/translation-scope.json`. | Translate and review newsletter.* and socialProof.* at minimum, or do not show the newsletter popup/form on de/sv until translated. Add them to the translation scope.
- MEDIUM | src/components/seo/pages.config.ts:25-30 + messages/en.json (gettingHere.*) | PAGE-05 not delivered: TRANSPORT_FACTS are all null, so the page has no prices, times or schedules (the requirement says taxi, songthaew, schedules, prices, map). OWNER-CHECKLIST says the figures were "confirmed by you (06-12)", which the code contradicts. | Either fill TRANSPORT_FACTS with the owner's figures or amend PAGE-05; correct the checklist.
- MEDIUM | messages/en.json whereToEat.sections.areas | PAGE-04 asks for "adresses". The guide names only 3 generic areas, no addresses or named venues. The weekend Walking Street claim is hedged ("usually"). | Add addresses or a verified list, or amend the requirement.
- MEDIUM | src/components/seo/pages.config.ts:79-86 | PAGE-06 "lists wines and Belgian beers": the page has 4 pairing cards and a link to /menu, with no list. It depends on the DB menu page 'vins-bieres-belges' being populated (SeoLandingPage.tsx belgianHref), and falls back to /menu if absent (unproven). | Check the menu content in production; or reword the requirement.
- MEDIUM | workstream ROADMAP.md + REQUIREMENTS.md | OPS-04 and OPS-05 are open (06-10 task 3 needs owner action). Success criterion 4 (TripAdvisor updated, NAP identical everywhere) is NOT met. Criterion 5 is met (documents prepared, nothing sent, per checklist). | Owner action required. Phase 6 cannot be marked complete.
- MEDIUM | src/app/[locale]/review/page.tsx:29 / success criterion 3 | Criterion 3 mentions "pages d'avis" in DE/SV. /de/review and /sv/review exist but are noindex and absent from the sitemap, which is correct for a private tunnel. The criterion is satisfied only if "exist" is read as "reachable". | Clarify the wording so the criterion is not read as indexed.

### LOW
- LOW | .planning/workstreams/seo-pages/phases/06-*/06-REPORT.md | Stale vs master: says "/sv noindex, no aggregateRating in JSON-LD, 19 URLs fr/en/de". Master has sv published and aggregateRating on (see the two HIGH findings). Do not rely on that report. | Replace or date it.
- LOW | src/utils/review-links.ts:46 | Dead branch (`primary === 'en'|'de'|'sv'` returns 'en') is unreachable since all four are in REVIEW_LOCALES. Stale comment in src/app/bewertung/route.ts:6 ("DE resolves to EN until published"). | Delete.
- LOW | src/app/global-error.tsx:21, src/app/not-found.tsx:7 | `<html lang="fr">` hard-coded; wrong for DE/SV/EN error pages. | Low priority.
- LOW | src/app/robots.ts | review and newsletter pages are crawlable (allow /); noindex is carried by meta robots, which is fine. Do not add a Disallow, or the noindex would be invisible. | None (informational).
- LOW | src/utils/seo.ts:95-125 | PAGES slugs: whether /en/restaurant-francais-krabi or /fr/french-restaurant-krabi respond (duplicate) depends on next-intl pathnames behaviour; not tested here. The self canonical protects against duplicate content. | Check with curl after deploy.

## Verified OK (read in code)
- Canonical: `buildPageMetadata` gives a self-referencing absolute canonical per locale and slug; `localizedPageMetadata` sets noindex,follow with no canonical or hreflang for an unpublished (page, locale). The locale layout does not set alternates (shallow-merge trap avoided).
- hreflang: `pageLanguages` is reciprocal for the published locales; x-default is fr when fr exists, otherwise the first locale (EN-only pages: en). The sitemap uses the same helper (`alternates.languages`), so sitemap and head cannot drift. The sitemap lists only PUBLISHED_PAGES x locales.
- EN-only pages (getting-here, wine) return notFound() for fr/de/sv and are not in the sitemap, so there are no thin or duplicate pages.
- Noindex on private pages: review, wifi, newsletter, newsletter/confirm, newsletter/unsubscribe (robots index:false, follow:false); /api/review/go sends X-Robots-Tag. Admin, api and auth are disallowed and guarded (middleware, RLS).
- JSON-LD validity: a single Restaurant with a stable @id; `serializeJsonLd` escapes `<`; hours come from the DB and are omitted if the read fails; no Review nodes; sameAs are owner-delegated URLs; no tripadvisor.be left in src/.
- Injection: the only dangerouslySetInnerHTML is the JSON-LD above (escaped). Page text comes from message files. Review aliases build the redirect path from a locale whitelist plus a UUID-regex rid plus allowlisted src (no open redirect); /api/review/go uses a fixed destination map.
- i18n parity fr/en: fr is missing only the 55 keys of the EN-only pages (gettingHere, wineBeer, meta.*), which are not published in fr (expected). No extra keys in any locale. ICU placeholders consistent across locales. de/sv have no untranslated long strings besides the signature and address (fine).

## Success criteria (goal-backward)
1. Four pages with title/meta/H1/booking link/nav/cross-links: MET in code (romantic, where-to-eat in 4 locales; getting-here and wine in EN). The content of getting-here (no figures) and where-to-eat (no addresses) is thin, see MEDIUM.
2. FR pages (home, french-restaurant, romantic, where-to-eat, /menu): MET (fr slugs restaurant-francais-krabi etc.); that fr is not a word-for-word translation is unproven (needs a native FR read).
3. /de and /sv with hreflang and sitemap after human review: MET formally; the review is the owner's sign-off, see HIGH.
4. TripAdvisor and NAP: NOT MET (06-10 blocked, OPS-04 and OPS-05 open).
5. Posts/replies/blogs/concierge ready, nothing sent: MET (docs/ph6/*; the checklist says nothing was sent; not independently verifiable). Google posts week 3 and the evening date are incomplete.

## Could not prove
- Tests, tsc, lint, build, rendered output (no node_modules, no dev server, no browser, no real database).
- Real behaviour of /de and /sv with Supabase (the phase report itself says these pages 500 under a dummy env).
- Native-speaker quality of FR/DE/SV copy; truthfulness of Google rating 4.7 / 1062 and of the "Travellers' Choice" badge (awarded:true, year null).
- Whether anything was sent externally (OPS documents) or published on platforms; the state of TripAdvisor, Google, Facebook.
- Live sitemap, robots and production headers.
