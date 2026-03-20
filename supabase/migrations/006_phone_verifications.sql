-- Phone verification tokens — issued after a successful Twilio Verify check.
-- OTP generation, rate-limiting and expiry are managed by Twilio Verify.
-- No public RLS policies: rows are accessed exclusively via service role key.

CREATE TABLE IF NOT EXISTS phone_verifications (
  id               SERIAL PRIMARY KEY,
  phone            VARCHAR(30)              NOT NULL,
  -- UUID issued after Twilio confirms the OTP is correct
  verified_token   TEXT                     NOT NULL UNIQUE,
  -- Token is consumed (set to NULL) when the reservation is created
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pv_token ON phone_verifications(verified_token);
CREATE INDEX IF NOT EXISTS idx_pv_expires ON phone_verifications(token_expires_at);

-- No public read/write: service role key only
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
