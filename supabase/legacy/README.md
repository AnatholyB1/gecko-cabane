# Legacy migrations (do not apply)

`001`-`006` were the original migrations. They create **unprefixed** tables
(`reservations`, `opening_hours`, ...) and, in `004_reservations.sql`, a public
`FOR SELECT USING (true)` policy on reservations (customer PII). They never matched
the production database, which uses `gecko_`-prefixed tables in a Supabase project
shared with another app.

They are kept for history only and must never be applied. The real schema is
reproduced by `supabase/migrations/007_gecko_baseline.sql`.
