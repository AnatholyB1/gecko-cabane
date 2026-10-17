# Phase 4 — Launch log

## Pre-checks (read-only, 2026-10-17)

- `vitest run`: 39 files, 408 tests pass. `npm run build`: exit 0.
- Migration 014 unchanged since 04-04 (single commit de5e5b8). No drop/delete/truncate/update in it.
- Production `schema_migrations`: 013 applied, 014 absent.
- First-run maximum (count only, no rows read): confirmed/completed reservations with an email and a service date 1-3 days old (Krabi date 2026-10-17) = **1**.
- Vercel Production env: `CRON_SECRET` absent; `RESEND_FROM_EMAIL` present (unchanged).
- `vercel.json` cron: `/api/cron/review-invitations`, `0 4 * * *` (UTC, 11:00 Krabi).
- Vercel plan (Hobby vs Pro): not checked (affects only cron timing precision).
- Nothing written to production, Vercel or the git remote.

## Approval request

Prepared 2026-10-17. Nothing below has been applied yet.

1. **Migration 014 on the production database.** 4 additive columns on `gecko_reservations` (`review_token` uuid, `review_email_sent_at`, `review_reminder_sent_at`, `review_clicked_at`) and 2 indexes. No backfill, no status change, nothing deleted. Applied BEFORE the code deploy, in one transaction, with the phase 1/3 method (psql, then `migration repair`).
2. **Create `CRON_SECRET` in Vercel Production.** Random value, never displayed. It protects the daily cron endpoint (401 without it).
3. **Deploy master** to production: `/avis`, `/bewertung`, `/review` pages and aliases, the daily cron, admin invitation badges.
4. **First-run exposure.** At most **1** guest from the last 1-3 days would receive the J+1 email at the next 11h Krabi run. No older reservation is invited and no reminder goes out for pre-existing rows (D-07, policy from 04-04). The owner may instead ask to postpone the first run.
5. **Legal question (consent).** The review email goes to all honored guests without marketing consent, with transactional wording and one reminder maximum (D-02 default). Keep as is, or restrict to guests with a consent row (needs a quick-fix plan before deploy).
6. **Claim check.** Is "Chaque avis est lu par Jariya et son équipe." true? If not, fallback FR "Merci, c'est un vrai plaisir de vous accueillir." / EN "Thank you, it is a real pleasure to host you."
7. **Sender identity.** `RESEND_FROM_EMAIL` is unchanged.

## Owner approval

Réponse du propriétaire dans la conversation (2026-10-17), verbatim : « check everything yourself ». Interprétation (Claude) : le propriétaire délègue la vérification et autorise de poursuivre. Décisions par item :
1. Migration 014 : approuvée comme proposée.
2. CRON_SECRET : approuvé.
3. Déploiement de master : approuvé.
4. Premier envoi (au plus 1 invité) : approuvé, pas de report demandé.
5. Consentement : option recommandée conservée (email transactionnel à tous les invités honorés).
6. Mention « Chaque avis est lu par Jariya et son équipe » : non vérifiable par Claude, donc **texte de repli utilisé** (FR « Merci, c'est un vrai plaisir de vous accueillir. » / EN « Thank you, it is a real pleasure to host you. »).
7. RESEND_FROM_EMAIL : inchangé.



## Step 0 - claim fallback (2026-10-17)

Item 6 not confirmed: `review.note` swapped to the fallback strings in `messages/fr.json` and `messages/en.json`. `tests/i18n.test.ts` + `tests/review-page-wiring.test.ts`: 18 tests pass. Commit 26fbc6d (`fix(04-07)`). Consent item 5 kept as proposed (no code change).

## Production DB push

Target prod ref `ubxllsvanurkwkohzxau`, connection string held in a shell variable only (never printed). Mechanism as in 01-DB-ROLLOUT.md (`db push` unusable on the shared project).

- `psql -v ON_ERROR_STOP=1 -1 -f supabase/migrations/014_review_invitations.sql`: exit 0 (ALTER TABLE, CREATE INDEX x2).
- `supabase migration repair --status applied 014`: "Migration history repaired". History now 34 rows (013 and 014 present).
- Columns on `gecko_reservations`: `review_token` uuid NOT NULL, `review_email_sent_at`, `review_reminder_sent_at`, `review_clicked_at` (timestamptz, nullable).
- `count(*) = count(distinct review_token)` and no null token: true (9 rows).
- Indexes: `idx_gecko_reservations_review_token` (unique), `idx_gecko_reservations_review_scan` (partial).
- `relrowsecurity` on gecko_reservations: true. `has_table_privilege('anon', gecko_reservations, 'SELECT')`: false.

## Env

`CRON_SECRET` created in Vercel Production (generated 32 random bytes hex, piped from generation to `vercel env add`, never displayed); `vercel env ls production` shows the name only (Hidden Secret). Appended to gitignored `.env.local` without printing.

## Deploy & live probes

- `vitest run`: 39 files, 408 tests pass. `npm run build`: exit 0.
- `git push origin master`: b75d8e1..26fbc6d. Production deployment READY (gecko-cabane-restaurant-3cba0k1n5-anatholyb1s-projects.vercel.app).

| probe | result |
|-------|--------|
| /avis | 307 -> /fr/review |
| /bewertung | 307 -> /en/review |
| /review Accept-Language fr-FR / en-GB / de-DE | 307 -> /fr/review / /en/review / /en/review |
| /avis?src=qr&evil=1 | 307 -> /fr/review?src=qr (evil dropped) |
| /fr/review | 200, noindex present, 0 hreflang, 0 canonical, Google writereview link before TripAdvisor UserReviewEdit |
| /fr/review?rid=0000... | 200, same structure |
| /sitemap.xml occurrences of /review | 0 |
| cron without header / wrong Bearer | 401 / 401 |
| cron real Bearer, ?dry=1 | 200, counts: invite 1, remind 0 (equals Task 1 maximum of 1) |

Cron registered via `vercel.json`: `/api/cron/review-invitations`, `0 4 * * *` (dashboard not inspected). Fallback review note is live. The cron was only called with `dry=1`; the scheduled run does the real send.
