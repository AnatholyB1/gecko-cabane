# Phase 3 — Launch log

## Approval request

Prepared 2026-10-17. Nothing below has been applied to production yet.

### 1. Migration 013 (production database)
- Adds column `is_gluten_free` (boolean, default false) to `gecko_menu_items`. No dish is marked gluten-free.
- Adds one empty, inactive menu page "Vins & bières belges" (slug `vins-bieres-belges`).
- Additive only; nothing deleted; the live site keeps working. Applied BEFORE the code deploy.

### 2. English landing page copy (`/en/french-restaurant-krabi`)
Source: `messages/en.json` namespace `frenchRestaurant`, `meta.frenchRestaurant*`. Claims to confirm as true:
- Run by "Chef Jariya and her French husband"; "40 seats"; "closed on Tuesdays"; phone +66 81 958 5945.
- Address: 1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000.
- Dish descriptions (bourguignon "braised in red wine with carrots and onions", velouté "finished with cream", chicken in cream sauce, massaman "mild and fragrant").
- "We pour French wines and a selection of Belgian beers" (not live on /menu until the real list is entered).

### 3. Home rating line
- EN "Google rating 4.7 / 5 · 1,062 reviews" / FR "Note Google 4,7 / 5 · 1 062 avis". Plain text, no schema `aggregateRating`.

### 4. Allergy line on /menu
- EN "Allergies: please ask our team for advice." / FR "Allergies : demandez conseil à notre équipe."

### 5. Deploy
- `git push origin master` → Vercel production, after `npm run build` passes.

## Owner approval

Recorded 2026-10-17 (owner replies in session):
- Migration 013 on production: approved
- Landing page copy and claims (section 2): approved as written
- Home rating line and allergy line: approved (no corrections)
- Production deploy: approved ("i approve next wave")
