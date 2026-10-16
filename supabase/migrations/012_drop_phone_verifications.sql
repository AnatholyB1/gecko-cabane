-- 012_drop_phone_verifications.sql
-- Apply ONLY after the OTP-free code is deployed - phase 1 plan 01-11; D-02.
-- The SMS/OTP mechanism was removed; no deployed code reads this table.
-- No CASCADE: nothing else depends on it, and other gecko_ tables must never be touched.

drop table if exists public.gecko_phone_verifications;
