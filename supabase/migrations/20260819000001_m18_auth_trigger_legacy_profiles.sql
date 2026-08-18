-- M18: Allow Supabase Auth sign-up for legacy profile emails.
-- The application reconciles an existing profile to the new auth.users id
-- in sync_profile_identity after the Auth insert succeeds.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  profile_name text;
  profile_referral_code text;
BEGIN
  profile_name := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(BTRIM(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)), ''),
    'Member'
  );
  profile_referral_code := UPPER(LEFT(REGEXP_REPLACE(profile_name, '[^a-zA-Z0-9]', '', 'g'), 4)) ||
    UPPER(LEFT(REPLACE(NEW.id::text, '-', ''), 4));

  INSERT INTO public.profiles (id, email, phone_e164, locale)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    CASE
      WHEN NEW.raw_user_meta_data ->> 'locale' IN ('en', 'ta')
        THEN (NEW.raw_user_meta_data ->> 'locale')::public.locale_code
      ELSE 'en'::public.locale_code
    END
  )
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles
  SET display_name = COALESCE(display_name, profile_name),
      referral_code = COALESCE(referral_code, profile_referral_code)
  WHERE (id = NEW.id OR email = NEW.email)
    AND (display_name IS NULL OR referral_code IS NULL);

  -- If the email belonged to a legacy profile, the application will migrate
  -- that profile after authentication. Do not create a dangling preference row.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.preferences (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

WITH auth_profile_metadata AS (
  SELECT
    p.id,
    COALESCE(
      NULLIF(BTRIM(u.raw_user_meta_data ->> 'display_name'), ''),
      NULLIF(BTRIM(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(BTRIM(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(BTRIM(SPLIT_PART(COALESCE(u.email, ''), '@', 1)), ''),
      'Member'
    ) AS profile_name,
    UPPER(LEFT(REGEXP_REPLACE(
      COALESCE(
        NULLIF(BTRIM(u.raw_user_meta_data ->> 'display_name'), ''),
        NULLIF(BTRIM(u.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(BTRIM(u.raw_user_meta_data ->> 'name'), ''),
        NULLIF(BTRIM(SPLIT_PART(COALESCE(u.email, ''), '@', 1)), ''),
        'Member'
      ),
      '[^a-zA-Z0-9]', '', 'g'
    ), 4)) || UPPER(LEFT(REPLACE(p.id::text, '-', ''), 4)) AS profile_referral_code
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.display_name IS NULL OR p.referral_code IS NULL
)
UPDATE public.profiles p
SET display_name = COALESCE(p.display_name, m.profile_name),
    referral_code = COALESCE(p.referral_code, m.profile_referral_code)
FROM auth_profile_metadata m
WHERE m.id = p.id;
