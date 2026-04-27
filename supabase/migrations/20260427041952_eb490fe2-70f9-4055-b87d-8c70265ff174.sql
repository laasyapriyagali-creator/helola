
CREATE OR REPLACE FUNCTION public.enforce_profile_locks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
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

  IF OLD.identity_locked = true AND NEW.identity_locked = false THEN
    NEW.identity_locked := true;
  END IF;

  IF NEW.username IS DISTINCT FROM OLD.username AND OLD.username IS NOT NULL THEN
    IF OLD.username_change_count >= 2 THEN
      RAISE EXCEPTION 'Username can only be changed twice';
    END IF;
    NEW.username_change_count := OLD.username_change_count + 1;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_profile_locks() FROM PUBLIC, anon, authenticated;
