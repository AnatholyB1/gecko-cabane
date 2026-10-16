# Phase 3: Carte HTML et pages d'atterrissage clés - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-17
**Phase:** 3-Carte HTML et pages d'atterrissage clés
**Areas discussed:** Wines & Belgian beers, Gluten-free & data model, /menu structure & language, Home + french-restaurant page

---

## Wines & Belgian beers

| Option | Description | Selected |
|--------|-------------|----------|
| You give me the list | Names, producers, sizes, prices supplied by the owner; nothing invented | ✓ |
| Build the section, fill it later | Structure hidden until items entered in admin | |
| Placeholder from public info | Risk of false claims | |

**User's choice:** Owner supplies the list.
**Notes:** DB check on 2026-10-17: no Belgian beers, no wines (only Champagne and Crémant/Vouvray by the glass).

| Option | Description | Selected |
|--------|-------------|----------|
| New menu page "Vins & bières belges" | 5th gecko_menu_pages entry | ✓ |
| Categories under "Boissons" | Less visible anchor | |
| You decide | | |

**User's choice:** New menu page.

---

## Gluten-free & data model

| Option | Description | Selected |
|--------|-------------|----------|
| New is_gluten_free column | Migration + admin checkbox + picto | ✓ |
| Parse allergens text | Fragile, safety risk | |
| Skip for now | Deviates from MENU-01 | |

**User's choice:** New column.

| Option | Description | Selected |
|--------|-------------|----------|
| Chef Jariya tags, Claude prepares sheet | Nothing flagged until confirmed | ✓ |
| Only tag a verified short list | | |

**User's choice:** Chef Jariya tags.

---

## /menu structure & language

| Option | Description | Selected |
|--------|-------------|----------|
| French dish names, EN UI only | Matches phase 2 D-12, no DB change | ✓ |
| Add EN name/description columns | Large scope | |
| EN categories only | | |

**User's choice:** French dish names, UI translated.

| Option | Description | Selected |
|--------|-------------|----------|
| One long page with anchored sections | Everything in initial HTML | ✓ |
| Tabs | Less crawlable | |

**User's choice:** Anchored sections.

| Option | Description | Selected |
|--------|-------------|----------|
| Teaser with link to /menu | No duplicate content | ✓ |
| Keep full MenuDisplay on home | Duplicate content risk | |

**User's choice:** Teaser.

---

## Home + french-restaurant page

| Option | Description | Selected |
|--------|-------------|----------|
| Light versions, Phase 5 upgrades | Google rating as text, no aggregateRating | ✓ |
| Only reuse what exists | | |

**User's choice:** Light versions.

| Option | Description | Selected |
|--------|-------------|----------|
| Authentic French cuisine by a Franco-Thai couple | | ✓ |
| Date-night / gastronomic focus | Overlaps PAGE-03 | |

**User's choice:** Authentic French cuisine, Franco-Thai couple.

| Option | Description | Selected |
|--------|-------------|----------|
| Use the 4 dish photos + chef + exterior | | ✓ |
| Wait for new photos | | |

**User's choice:** Existing photos.

| Option | Description | Selected |
|--------|-------------|----------|
| FR /menu and home now; FR french-restaurant in Phase 6 | | ✓ |
| Ship FR french-restaurant now too | | |

**User's choice:** FR landing page in Phase 6.

---

## Claude's Discretion

Component structure, anchor nav styling, section order, meta texts, i18n keys, migration numbering, exact `hasMenu` JSON-LD shape, navigation links.

## Deferred Ideas

- name_en / description_en columns — evaluate in Phase 6
- MENU-03, CONV-01/02/03, aggregateRating — Phase 5
- FR french-restaurant, romantic-dinner, wine-belgian-beer — Phase 6
