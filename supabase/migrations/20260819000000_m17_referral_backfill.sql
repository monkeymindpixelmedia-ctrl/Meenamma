-- M17: Make referral setup safe to re-run after older deployments.
-- The original referral migration referenced the old `name` column; the
-- canonical profile field is `display_name`.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx
  ON public.profiles (referred_by);

UPDATE public.profiles
SET referral_code =
  UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE(display_name, 'USER'), '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 4)) ||
  UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 4))
WHERE referral_code IS NULL;
