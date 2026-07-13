
-- Fix 1 & 2: Update enforce_profile_locks to protect is_verified and username_changed_at
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

  -- is_verified can only be set by service_role / admin (silently preserve)
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    NEW.is_verified := OLD.is_verified;
  END IF;

  -- Prevent client tampering with username_changed_at / previous_usernames when username unchanged
  IF NEW.username IS NOT DISTINCT FROM OLD.username THEN
    IF NEW.username_changed_at IS DISTINCT FROM OLD.username_changed_at THEN
      NEW.username_changed_at := OLD.username_changed_at;
    END IF;
    IF NEW.previous_usernames IS DISTINCT FROM OLD.previous_usernames THEN
      NEW.previous_usernames := OLD.previous_usernames;
    END IF;
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
    NEW.previous_usernames := array_append(coalesce(OLD.previous_usernames, '{}'::text[]), OLD.username);
    NEW.username_changed_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix 3: Scope trip_members SELECT to trip creator or fellow members
DROP POLICY IF EXISTS "Trip members viewable by authenticated" ON public.trip_members;

CREATE POLICY "Trip members visible to trip participants"
ON public.trip_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_trip_member(trip_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = trip_members.trip_id AND t.creator_id = auth.uid()
  )
);
