---
phase: 04-tunnel-d-avis-et-fiche-google
verified: 2026-10-17T00:00:00Z
status: gaps_found
score: 4/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "La fiche Google Business Profile est à jour (catégories, attributs, lien de réservation, carte, 20 photos), après accord du propriétaire (OPS-01, SC5)"
    status: failed
    reason: "Postponed by the owner pending Google Business Profile account access. Dossier prepared, nothing applied. Public listing inspected read-only: single 'Thai restaurant' category, no reserve button, no menu link, no owner description."
    artifacts:
      - path: ".planning/phases/04-tunnel-d-avis-et-fiche-google/04-GBP-DOSSIER.md"
        issue: "Proposal only (status: reporté); categories, attributes, links, description, photos not applied to the live profile"
    missing:
      - "Owner obtains GBP access, then apply: primary French restaurant; secondary Thai, Fusion, Wine bar; confirmed attributes; reservation + menu links; description"
      - "About 13 more real recent photos from the owner to reach 20"
      - "Plan 04-03 (still unchecked in ROADMAP) closed once applied"
human_verification:
  - test: "Observe the first scheduled cron run (next 11:00 Krabi) and open /admin/reservations"
    expected: "Badge 'Invitation envoyée le ...' appears (dry run predicted 1 invitation, 0 reminders); email arrives with /review?rid=...&src=email link"
    why_human: "Only ?dry=1 was exercised; the real send and email rendering are unobserved. Vercel plan (Hobby vs Pro) not checked, so exact 11:00 timing is unconfirmed"
  - test: "Scan the printed or on-screen QR (docs/print) with an iPhone and an Android"
    expected: "Opens geckocabanerestaurant.com/review?src=qr and both buttons open the review window"
    why_human: "Owner reported 'phone test ok' for the buttons but gave no separate QR scan report; print proof is at ~6 pt body on the 100x60 insert"
---

# Phase 4: Tunnel d'avis et fiche Google Verification Report

**Phase Goal:** Chaque client honoré est invité à laisser un avis Google ou TripAdvisor, et la fiche Google est optimisée pour la haute saison
**Verified:** 2026-10-17
**Status:** gaps_found
**Re-verification:** No, initial verification

## Observable Truths

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|--------------------|--------|----------|
| 1 | /review, /avis, /bewertung show two buttons (Google then TripAdvisor) and open the review window on mobile | VERIFIED (with note) | `src/app/[locale]/review/page.tsx` renders Google `<a>` before TripAdvisor `<a>`, noindex; alias routes in `src/app/{review,avis,bewertung}/route.ts`; live probes in 04-LAUNCH.md (307 aliases, Google link before TripAdvisor); owner "phone test ok". Note: /bewertung lands on /en/review since DE/SV map to EN (D-08), the DE page arrives in phase 6 |
| 2 | Admin marks a reservation honored or no-show; honored by default unless cancelled | VERIFIED | `no_show` status button and filter in `src/app/admin/reservations/page.tsx` (lines 14, 352, 451), allowed in `src/app/api/reservations/route.ts`; `REVIEW_ELIGIBLE_STATUSES = ['confirmed','completed']` makes non-cancelled/non-no-show honored by default; admin badges and no-show deadline in `review-badges.ts` |
| 3 | Honored reservation gets J+1 11h Krabi Resend email in its language with /review?rid=...&src=email, one J+5 reminder if not clicked | VERIFIED (real send unobserved) | `review-invitations.ts` (Krabi UTC+7 windows, invite -3..-1, remind -7..-5, skip if clicked/already reminded); cron route claims row atomically, Resend idempotencyKey, releases on failure; Bearer CRON_SECRET fails closed; `vercel.json` `0 4 * * *` = 11:00 Krabi; click marks `review_clicked_at` in review page; migration 014 applied to prod; live probes cron 401/401, dry run invite 1 / remind 0. Real send pending first run (human item) |
| 4 | QR to /review?src=qr with FR/EN/DE texts ready to print for bill and table tent | VERIFIED | `docs/print/review-qr.svg`, `review-addition-insert.pdf`, `review-chevalet-a6.pdf`, generator script, `tests/review-print.test.ts`; README records DE validated by owner. QR scan on devices not separately reported (human item) |
| 5 | Google Business Profile up to date (categories, attributes, booking link, menu, 20 photos), after owner approval | FAILED | Deliberately postponed; only the dossier exists (04-GBP-DOSSIER.md). Nothing applied to the live profile |

**Score:** 4/5 truths verified

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/app/[locale]/review/page.tsx` | VERIFIED | Substantive, calls `markReviewClicked`, uses `googleReviewUrl`/`tripAdvisorReviewUrl` |
| `src/app/api/cron/review-invitations/route.ts` | VERIFIED | Real DB query, send, claim/release; wired via `vercel.json` |
| `src/utils/review-invitations.ts`, `review-tracking.ts`, `review-badges.ts`, `review-alias.ts`, `review-links.ts` | VERIFIED | Imported by cron, page, admin page, alias routes |
| `supabase/migrations/014_review_invitations.sql` | VERIFIED | Applied to prod (LAUNCH.md: columns, unique index, 9 distinct tokens) |
| `vercel.json` | VERIFIED | Cron registered (dashboard not inspected) |
| `docs/print/*` | VERIFIED | SVG + two PDFs present |
| `04-GBP-DOSSIER.md` | STUB for OPS-01 | Proposal only, not applied |

## Key Link Verification

| From | To | Status |
|------|----|--------|
| vercel.json cron | /api/cron/review-invitations | WIRED |
| cron -> Resend `reviewInvitationEmail` -> `/review?rid&src=email` | WIRED |
| /review page -> `markReviewClicked` -> `review_clicked_at` -> reminder skip | WIRED |
| alias routes -> middleware pass-through -> `/{locale}/review` | WIRED (live 307 probes) |
| admin reservations page -> `getReviewBadges` / no_show update | WIRED |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Test suite | `npx vitest run` | 39 files, 408 tests pass | PASS |
| Live aliases, cron auth, dry run | per 04-LAUNCH.md (not re-run by verifier) | recorded 307/401/200 | SKIP (prod calls not repeated) |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| REV-01 | SATISFIED | SC1 |
| REV-02 | SATISFIED | SC2 |
| REV-03 | SATISFIED (first real send pending) | SC3 |
| REV-04 | SATISFIED | SC4 |
| OPS-01 | BLOCKED (postponed, pending Pending in REQUIREMENTS.md) | SC5 |

No orphaned requirements.

## Anti-Patterns Found

No TBD/FIXME/XXX in phase files. No stubs in the review flow.

Warnings:
- `review.note` uses fallback copy because the "read by Jariya" claim was not confirmed (correct, honest).
- Consent: review email goes to all honored guests with transactional wording (owner kept option, legal risk accepted in LAUNCH.md item 5).
- Insert print copy ~6 pt body (owner approved proof).
- ROADMAP still shows 04-02, 04-03, 04-07 unchecked; 04-02 and 04-07 are in fact complete, 04-03 is not.

## Human Verification Required

1. First scheduled cron run: see frontmatter.
2. QR scan on iPhone and Android: see frontmatter.

## Gaps Summary

One blocker: OPS-01 / SC5 is not achieved. The owner postponed it pending Google account access; the dossier is ready and the public listing was inspected read-only. This is an external dependency, not a code defect, and does not block the review funnel (REV-01..04), which is delivered and live in production. It does matter for the 1 November high-season deadline and should be tracked as an open owner action. Not deferrable to a later phase: no later roadmap phase covers GBP categories/attributes (phase 6 covers Google posts, not profile setup).

---

_Verified: 2026-10-17_
_Verifier: Claude (gsd-verifier)_
