-- 014_review_invitations.sql
-- Phase 4 (REV-02/REV-03, D-06, D-13, D-14).
-- Apply to production BEFORE deploying code that reads review_* columns (plan 04-07).
-- review_token is the opaque `rid` of the review link: gecko_reservations.id is an
-- enumerable integer, so it must not be exposed (RESEARCH, refines D-14).
-- gen_random_uuid() fills existing rows with distinct values when the column is added.
-- No backfill of *_sent_at on purpose: fake send dates would show false "Invitation
-- envoyee" badges. The D-07 window (service dates 1-3 days old) bounds the first-run
-- exposure, and reminders require a recorded invite.
-- No status migration (D-01): confirmed reservations count as honored by default.
-- No new policy: the table has no anon policy and default grants were revoked in 010.

alter table public.gecko_reservations
  add column if not exists review_token uuid not null default gen_random_uuid(),
  add column if not exists review_email_sent_at timestamptz,
  add column if not exists review_reminder_sent_at timestamptz,
  add column if not exists review_clicked_at timestamptz;

create unique index if not exists idx_gecko_reservations_review_token
  on public.gecko_reservations (review_token);

create index if not exists idx_gecko_reservations_review_scan
  on public.gecko_reservations (reservation_date)
  where status in ('confirmed', 'completed');
