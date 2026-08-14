-- M15: Switch autopay to token-based recurring payments
-- Adds Razorpay customer/token columns and per-user charge scheduling.
-- The old autopay_subscription_id column is kept for existing subscribers (backward compat).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_token_id    TEXT,
  ADD COLUMN IF NOT EXISTS next_charge_at        TIMESTAMPTZ;

-- Index so the hourly cron query (next_charge_at <= NOW, autopay_status=active) is fast
CREATE INDEX IF NOT EXISTS profiles_next_charge_at_idx
  ON profiles (next_charge_at)
  WHERE autopay_status = 'active' AND razorpay_token_id IS NOT NULL;

COMMENT ON COLUMN profiles.razorpay_customer_id IS 'Razorpay customer ID (cust_xxx) used for tokenized recurring charges';
COMMENT ON COLUMN profiles.razorpay_token_id    IS 'Razorpay recurring payment token (token_xxx) stored after first charge completes';
COMMENT ON COLUMN profiles.next_charge_at        IS 'UTC timestamp of next scheduled charge; advanced by 24h after each successful or failed charge attempt';
