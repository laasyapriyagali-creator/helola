
-- 1. Add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_change_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS identity_locked boolean NOT NULL DEFAULT false;

-- 2. Unique case-insensitive username index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

-- 3. Trigger function: enforce identity lock + username change limit
CREATE OR REPLACE FUNCTION public.enforce_profile_locks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Identity lock: block changes to name/age/gender once locked
  IF OLD.identity_locked = true THEN
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
      RAISE EXCEPTION 'Name cannot be changed once set';
    END IF;
    IF NEW.age IS DISTINCT FROM OLD.age THEN
      RAISE EXCEPTION 'Age cannot be changed once set';
    END IF;
    IF NEW.gender IS DISTINCT FROM OLD.gender THEN
      RAISE EXCEPTION 'Gender cannot be changed once set';
    END IF;
  END IF;

  -- Prevent users from un-locking themselves
  IF OLD.identity_locked = true AND NEW.identity_locked = false THEN
    NEW.identity_locked := true;
  END IF;

  -- Username change limit: max 2 changes
  IF NEW.username IS DISTINCT FROM OLD.username AND OLD.username IS NOT NULL THEN
    IF OLD.username_change_count >= 2 THEN
      RAISE EXCEPTION 'Username can only be changed twice';
    END IF;
    NEW.username_change_count := OLD.username_change_count + 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_locks ON public.profiles;
CREATE TRIGGER profiles_enforce_locks
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_locks();
