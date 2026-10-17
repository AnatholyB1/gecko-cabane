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


