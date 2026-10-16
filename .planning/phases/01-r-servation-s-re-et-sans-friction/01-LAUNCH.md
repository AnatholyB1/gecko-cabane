# 01-LAUNCH - Phase 1 production launch log (plan 01-10)

Date: 2026-10-16
Status: DEPLOYED and smoke-tested. Human phone check (Task 3) is PENDING (owner).
No secret or webhook URL appears in this file (names and actions only).

## Owner approvals

The owner gave ONE blanket approval in the session ("fais ce que tu peux toi meme; j'approuve le reste; j'approuve tes actions"). It was NOT an item-by-item review of the text or settings. Items as resolved:

1. Privacy text: approved as written (reservations kept 24 months, marketing consent until withdrawn, anti-abuse hashes 2 days; contact and phone as in `messages/fr.json` / `messages/en.json`). A legal review of /fr/privacy and /en/privacy (PDPA B.E. 2562 / GDPR) is still advisable.
2. `last_reservation_time` = `21:30` (kitchen closes 22:00; matches the old form maximum). Applied on production with one upsert on `gecko_restaurant_settings` (columns: key, value, description, updated_at; pkey on key), after a read-only inspection (rows before: `max_covers=40`, `table_block_duration_minutes=120`). Re-select after: `last_reservation_time|21:30`, other two rows unchanged.
3. WhatsApp +66 81 958 5945: cannot be verified by Claude. Recorded as ASSUMED ACTIVE - OWNER TO CONFIRM.
4. Webhooks: current n8n URLs kept (renamed to RESA_HOOK_URL / RESA_VALIDATION_HOOK_URL). Rotation is STILL RECOMMENDED because the old URLs were exposed through NEXT_PUBLIC_ variables (visible in earlier client bundles). Only the owner can create new URLs in n8n; then replace the two Vercel env values and redeploy.
5. Vercel production env changes and production deploy: approved.

## Extra prerequisite: migration 010 (grants)

`supabase/migrations/010_revoke_default_grants.sql`: pure REVOKE (idempotent):
- `revoke truncate, references, trigger on gecko_reservations, gecko_marketing_consents from anon, authenticated`
- `revoke all on gecko_rate_limits from anon, authenticated`
- select/insert/update/delete on `gecko_reservations` and `gecko_marketing_consents` deliberately kept for `authenticated` (admin UI works through the authenticated session under RLS; admin consents policy needs SELECT).

Applied on production like 008/009: `psql -v ON_ERROR_STOP=1 -1 -f` (exit 0, two REVOKE), then `supabase migration repair --status applied 010` ("Migration history repaired"). `db push` not used (26 foreign versions in the shared project, untouched). No scratch DB exists anymore (deleted); acceptable because the migration is a pure revoke and cannot lose data. `tests/migrations.test.ts`: 6 passed, no change needed.

Read-only grant check on production (information_schema.role_table_grants):

| table | role | before | after |
|-------|------|--------|-------|
| gecko_rate_limits | anon, authenticated | all 7 | none |
| gecko_reservations | anon | REFERENCES, TRIGGER, TRUNCATE | none |
| gecko_reservations | authenticated | all 7 | DELETE, INSERT, SELECT, UPDATE |
| gecko_marketing_consents | anon | all 7 | DELETE, INSERT, SELECT, UPDATE |
| gecko_marketing_consents | authenticated | all 7 | DELETE, INSERT, SELECT, UPDATE |

Follow-up (not done, outside the stated scope): anon still holds DML on `gecko_marketing_consents`; RLS is enabled with no anon policy so nothing is readable or writable, but `revoke all ... from anon` on that table would be cleaner.

## Env change log (names only)

Vercel project `gecko-cabane-restaurant`, environment production:
- ADDED (sensitive): RESA_HOOK_URL, RESA_VALIDATION_HOOK_URL (values from `.env.local`, piped via stdin)
- ADDED (sensitive): RATE_LIMIT_SECRET (32 random bytes hex, generated locally, piped, also appended to `.env.local`, which is gitignored)
- ADDED: NEXT_PUBLIC_WHATSAPP_NUMBER (66819585945)
- REMOVED from production: NEXT_PUBLIC_RESA_HOOK_URL, NEXT_PUBLIC_RESA_VALIDATION_HOOK_URL
- Listing after change confirms the four new names present and the two NEXT_PUBLIC_RESA_* absent in production.
- Note: the value of the new RESA_* vars comes from `.env.local`; the old production NEXT_PUBLIC_ values could not be read back to compare.

## Gate and deploy

- `npx vitest run`: 17 files, 148 tests passed.
- eslint on the 30 src/tests files changed in this phase: clean. (`npm run lint` globally has 7 pre-existing errors in untouched files, not addressed.)
- `npm run build`: passed. A first attempt failed only on stale generated types in gitignored `.next/dev` (from the dev server); removed that directory and rebuilt.
- Repo remote: origin (GitHub AnatholyB1/gecko-cabane); Vercel project is git-connected (previous production deployment source = git, branch master). `git push origin master` (4ef6722..364a261, 47+1 commits). `.planning/config.json` (pre-existing local modification), `.dev-server.log` and `.env*` were not committed.
- Deployment: commit 364a261, state READY, target production, deployment host `gecko-cabane-restaurant-6o8sxifyi-anatholyb1s-projects.vercel.app`, served at https://geckocabanerestaurant.com. No rollback needed.

## Smoke tests (production)

No real reservation was submitted (would send real emails).

| id | check | result |
|----|-------|--------|
| a | GET /api/reservations?phone=%2B66812345678 | 401 PASS |
| b | POST /api/reservations body `{}` | 400 `{"code":"too_fast"}` (fill-time check runs before schema validation) PASS |
| b2 | POST with old timestamp and empty name | 400 `invalid_fields` PASS |
| b3 | POST non-JSON body | 400 `invalid_body` PASS |
| b4 | POST honeypot field filled | 201 fake `{id:0,status:pending}`, no DB/email path PASS (expected) |
| c | POST /api/verify/send | 404 PASS |
| d | bundle scan: /fr and /en HTML + 15 chunks | `NEXT_PUBLIC_RESA`: 0; n8n host: 0; webhook path: 0 PASS |
| e | /en/privacy contains "Privacy policy"; /fr contains `wa.me/66819585945`; /en HTML has no OTP/verification-code text; /fr 200 | 1 / 1 / 0 PASS |
| f | `vercel logs --level error --since 30m` | no logs found (no errors) PASS (CLI log window only; Sentry not inspected) |

Not covered by these tests: the full successful booking path, emails, WhatsApp on a real phone, the 60-second criterion. See below.

## Human verification

STATUS: PENDING - to be done by the owner. NOT performed by Claude; nothing below has passed yet.

Etapes (a faire sur un telephone, avec un vrai email) :

1. Ouvrir https://geckocabanerestaurant.com/en sur le telephone et lancer un chronometre quand la page est chargee.
2. Aller au formulaire de reservation : le selecteur de pays doit afficher Royaume-Uni (+44). Remplir nom, un numero mobile UK ou francais, votre email, un samedi, une heure, 2 personnes ; laisser la case newsletter decochee. Envoyer. Arreter le chrono sur l'ecran "Request received" : moins de 60 secondes, aucun code demande.
3. Verifier la boite mail : un email anglais "reservation request" arrive en moins d'une minute.
4. Dans /admin/reservations, la reservation en attente apparait ; la confirmer : un email anglais de confirmation arrive. Puis annuler/supprimer la reservation de test.
5. Recommencer une fois sur /fr en cochant la case : pays pre-selectionne France (+33). Dans Supabase (ou demander a Claude) une ligne `gecko_marketing_consents` existe avec source `reservation_form` et une date.
6. Appuyer sur le bouton rond vert WhatsApp (en bas a droite) sur /fr et /en : WhatsApp ouvre une discussion avec +66 81 958 5945 et un message pre-rempli dans la langue de la page ; quand le bouton d'envoi est visible sur mobile, le bouton WhatsApp est cache et ne le recouvre jamais.
7. Ouvrir /en/privacy depuis le lien de consentement : s'ouvre dans un nouvel onglet, entierement en anglais.

Aussi a confirmer par le proprietaire : le numero WhatsApp est actif ; decision sur la rotation des URLs n8n ; relecture juridique de la page confidentialite.

Resultats (a remplir) : temps mesure ____ s ; email de demande EN ____ ; email de confirmation EN ____ ; ligne de consentement ____ ; WhatsApp fr/en ____.
