-- Migration: Multi-Portal Architecture Extensions (Shopper Loyalty, Partner Earn, Student Intern Lead Gen)
-- Created: 2026-08-26

-- 1. Profiles table adjustments for payout details and updated account types
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS payout_phone text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_no text,
  ADD COLUMN IF NOT EXISTS bank_ifsc text;

-- Update account_type check constraint if present to allow new role designations
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
    CHECK (account_type IN ('normal', 'shopper', 'student', 'student_intern', 'partner_earner', 'admin'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Partner Payouts Table
CREATE TABLE IF NOT EXISTS public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  payout_method text NOT NULL DEFAULT 'upi' CHECK (payout_method IN ('upi', 'bank_transfer')),
  payout_address text NOT NULL, -- UPI ID or Bank Account No
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  utr_reference text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS partner_payouts_profile_idx ON public.partner_payouts (profile_id, status);
CREATE INDEX IF NOT EXISTS partner_payouts_status_idx ON public.partner_payouts (status);

-- 3. Lead Submissions Table (for referrals.meenamma.com / student interns)
CREATE TABLE IF NOT EXISTS public.lead_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  lead_name text NOT NULL,
  lead_phone text NOT NULL,
  lead_pincode text,
  locality text,
  interest_type text NOT NULL DEFAULT 'kudam_savings' CHECK (interest_type IN ('kudam_savings', 'fresh_fish', 'bulk_order', 'general')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'verified', 'converted_subscriber', 'converted_shopper', 'rejected')),
  notes text,
  bounty_paise integer NOT NULL DEFAULT 0 CHECK (bounty_paise >= 0),
  bounty_paid boolean NOT NULL DEFAULT false,
  converted_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

CREATE INDEX IF NOT EXISTS lead_submissions_intern_idx ON public.lead_submissions (intern_id, status);
CREATE INDEX IF NOT EXISTS lead_submissions_phone_idx ON public.lead_submissions (lead_phone);

-- 4. Enable RLS
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS partner_payouts_select_own ON public.partner_payouts;
CREATE POLICY partner_payouts_select_own ON public.partner_payouts
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

DROP POLICY IF EXISTS partner_payouts_insert_own ON public.partner_payouts;
CREATE POLICY partner_payouts_insert_own ON public.partner_payouts
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS lead_submissions_select_own ON public.lead_submissions;
CREATE POLICY lead_submissions_select_own ON public.lead_submissions
  FOR SELECT TO authenticated USING (intern_id = auth.uid());

DROP POLICY IF EXISTS lead_submissions_insert_own ON public.lead_submissions;
CREATE POLICY lead_submissions_insert_own ON public.lead_submissions
  FOR INSERT TO authenticated WITH CHECK (intern_id = auth.uid());

-- 6. Grants
GRANT SELECT, INSERT ON public.partner_payouts TO authenticated;
GRANT SELECT, INSERT ON public.lead_submissions TO authenticated;
