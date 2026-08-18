-- M16: Add Referral System
-- Adds a unique referral code to each profile and a reference to the user who referred them.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create an index to quickly count how many people a user has referred
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx
  ON profiles (referred_by);

-- Backfill existing users with a generated referral code
-- We'll use a combination of the first 4 letters of their name (uppercased, alphanumeric only) and a short hash of their ID
UPDATE profiles
SET referral_code = 
    UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE(name, 'USER'), '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 4)) || 
    UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 4))
WHERE referral_code IS NULL;
