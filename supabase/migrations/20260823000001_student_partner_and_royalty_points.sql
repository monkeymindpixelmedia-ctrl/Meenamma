-- Migration: Student Partner Program & Royalty Points System
-- 1. Adds account_type ('normal' vs 'student'), student_serial_id, student_cycle_start, and royalty_points to profiles.
-- 2. Creates royalty_points_ledger for tracking 1-point awards when referred normal users shop.
-- 3. Creates student_commissions for tracking referral sales commissions for students.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'normal' CHECK (account_type IN ('normal', 'student')),
  ADD COLUMN IF NOT EXISTS student_serial_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS student_cycle_start timestamptz,
  ADD COLUMN IF NOT EXISTS royalty_points integer NOT NULL DEFAULT 0 CHECK (royalty_points >= 0);

CREATE INDEX IF NOT EXISTS profiles_account_type_idx ON public.profiles (account_type);
CREATE INDEX IF NOT EXISTS profiles_student_serial_id_idx ON public.profiles (student_serial_id);

-- Royalty points ledger for normal users
CREATE TABLE IF NOT EXISTS public.royalty_points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  points_change integer NOT NULL,
  reason text NOT NULL CHECK (reason IN ('referral_purchase', 'redemption', 'bonus', 'adjustment')),
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS royalty_points_ledger_profile_idx ON public.royalty_points_ledger (profile_id, created_at DESC);

-- Student partner commissions ledger
CREATE TABLE IF NOT EXISTS public.student_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  referred_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_commissions_student_idx ON public.student_commissions (student_id, status);

-- Enable RLS
ALTER TABLE public.royalty_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS royalty_points_select_own ON public.royalty_points_ledger;
CREATE POLICY royalty_points_select_own ON public.royalty_points_ledger
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

DROP POLICY IF EXISTS student_commissions_select_own ON public.student_commissions;
CREATE POLICY student_commissions_select_own ON public.student_commissions
  FOR SELECT TO authenticated USING (student_id = auth.uid());

GRANT SELECT ON public.royalty_points_ledger TO authenticated;
GRANT SELECT ON public.student_commissions TO authenticated;
