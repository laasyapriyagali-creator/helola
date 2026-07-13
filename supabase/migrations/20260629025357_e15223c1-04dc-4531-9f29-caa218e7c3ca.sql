
-- 1. New columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS username_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS previous_usernames text[] DEFAULT '{}'::text[];

-- 2. Replace lock trigger: full_name, gender, date_of_birth permanently lock once identity_locked = true.
--    Username uses a 30-day cooldown instead of a 2-change cap. Old usernames archived.
CREATE OR REPLACE FUNCTION public.enforce_profile_locks()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  cooldown_remaining interval;
BEGIN
  -- Permanent locks once identity is confirmed at end of onboarding
  IF OLD.identity_locked = true THEN
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
      RAISE EXCEPTION 'Full name cannot be changed after onboarding. Please contact support.';
    END IF;
    IF NEW.gender IS DISTINCT FROM OLD.gender THEN
      RAISE EXCEPTION 'Gender cannot be changed after onboarding.';
    END IF;
    IF NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth THEN
      RAISE EXCEPTION 'Date of birth cannot be changed after onboarding.';
    END IF;
  END IF;

  -- identity_locked is irreversible
  IF OLD.identity_locked = true AND NEW.identity_locked = false THEN
    NEW.identity_locked := true;
  END IF;

  -- Username 30-day cooldown
  IF NEW.username IS DISTINCT FROM OLD.username AND OLD.username IS NOT NULL THEN
    IF OLD.username_changed_at IS NOT NULL THEN
      cooldown_remaining := (OLD.username_changed_at + interval '30 days') - now();
      IF cooldown_remaining > interval '0' THEN
        RAISE EXCEPTION 'Username can only be changed once every 30 days. Try again in % days.',
          ceil(extract(epoch FROM cooldown_remaining) / 86400)::int;
      END IF;
    END IF;
    -- Archive previous username and stamp the change
    NEW.previous_usernames := array_append(coalesce(OLD.previous_usernames, '{}'::text[]), OLD.username);
    NEW.username_changed_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Ensure trigger is attached
DROP TRIGGER IF EXISTS enforce_profile_locks_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_locks_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_locks();
