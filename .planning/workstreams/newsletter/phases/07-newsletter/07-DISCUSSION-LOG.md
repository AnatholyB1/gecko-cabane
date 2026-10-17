# Phase 7: Newsletter - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-17
**Phase:** 7-Newsletter
**Areas discussed:** Brevo ↔ Supabase sync and double opt-in; Sequences and J+1/J+3 triggers; Collection points; Segments and Guide gourmand

---

## Brevo ↔ Supabase sync and double opt-in

| Question | Options | Selected |
|----------|---------|----------|
| Source of truth | Supabase ledger + Brevo copy / Brevo only / You decide | Supabase ledger + Brevo copy |
| Double opt-in | Own email via Resend / Native Brevo DOI / You decide | Own email via Resend |
| Existing reservation consents | One-time confirmation email / Direct import / Leave out | One-time confirmation email |
| Unsubscribe | Brevo link + webhook / Own signed route only | Brevo link + webhook |

## Sequences and J+1 / J+3 triggers

| Question | Options | Selected |
|----------|---------|----------|
| Engine | Brevo automations / Vercel cron + Brevo API / You decide | Brevo automations |
| Visit date and collision with review email | Reservation date, review email first / Sign-up date only / Merge | Reservation date, review email first (newsletter shifted to J+2) |
| 1 email/month cap and seasonal timing | Brevo cap + date workflows / Coded guard | Brevo cap + date workflows |
| Content and languages | FR/EN now, DE/SV after review / All four marked to review | FR/EN now, DE/SV after review |

## Collection points

| Question | Options | Selected |
|----------|---------|----------|
| Exit pop-up | Desktop exit intent + mobile bottom sheet / Time-based only / You decide | Desktop exit intent + mobile bottom sheet |
| Bill QR | Dedicated /newsletter?src=qr page / Footer form with param | Dedicated /newsletter?src=qr page |
| WiFi portal | Hosted portal / Defer / I know the router | **Free text:** "we cant do captive portail its a wifi and we give the, the password" |
| NEWS-03 adaptation | /wifi page with password + optional sign-up / Printed QR next to password / Drop NEWS-03 | /wifi page with password + optional sign-up |

**Notes:** No captive portal possible; the password-protected WiFi is handled by a QR/card leading to /wifi.

## Segments and Guide gourmand

| Question | Options | Selected |
|----------|---------|----------|
| Country and resident/tourist | Phone prefix + optional resident tick / Vercel geo for everyone / Ask both fields | Phone prefix + optional resident tick |
| Last visit date | Nightly job from honoured reservations / Only on admin 'completed' | Nightly job |
| Guide gourmand | Claude drafts FR/EN, owner supplies picks, static PDF / Signed Storage link | Static PDF in public/ |

## Claude's Discretion

Schema details, signed-link format, route names, Brevo sync module structure, i18n keys, signup-rate measurement, UI layouts, WiFi password storage.

## Deferred Ideas

Real captive portal; coded monthly cap; admin subscriber view; DE/SV sequences and guide; merging newsletter J+1 with the review email.
