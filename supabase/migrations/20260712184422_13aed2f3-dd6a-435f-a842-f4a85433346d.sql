
-- Helper: is there a block relationship in either direction between two users?
CREATE OR REPLACE FUNCTION public.users_blocked_either_way(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  );
$$;

GRANT EXECUTE ON FUNCTION public.users_blocked_either_way(uuid, uuid) TO authenticated, service_role;

-- Profiles: exclude blocked users from visibility
DROP POLICY IF EXISTS "Profiles are viewable per visibility" ON public.profiles;
CREATE POLICY "Profiles are viewable per visibility"
ON public.profiles
FOR SELECT
USING (
  pending_deletion_at IS NULL
  AND (
    auth.uid() = id
    OR (
      NOT public.users_blocked_either_way(auth.uid(), id)
      AND (
        COALESCE(profile_visibility, 'public') = 'public'
        OR (
          profile_visibility = 'friends'
          AND EXISTS (
            SELECT 1
            FROM trip_members tm1
            JOIN trip_members tm2 ON tm1.trip_id = tm2.trip_id
            WHERE tm1.user_id = profiles.id AND tm2.user_id = auth.uid()
          )
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Moment authors have public profile previews" ON public.profiles;
CREATE POLICY "Moment authors have public profile previews"
ON public.profiles
FOR SELECT
USING (
  pending_deletion_at IS NULL
  AND private.profile_has_memory(id)
  AND (auth.uid() IS NULL OR NOT public.users_blocked_either_way(auth.uid(), id))
);

-- Messages: hide messages from senders the viewer has blocked (either way)
DROP POLICY IF EXISTS "Members can view trip messages" ON public.messages;
CREATE POLICY "Members can view trip messages"
ON public.messages
FOR SELECT
USING (
  private.is_trip_member(trip_id, auth.uid())
  AND NOT public.users_blocked_either_way(auth.uid(), sender_id)
);

-- Messages: block sends when any other trip member has blocked the sender (or vice versa)
DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
CREATE POLICY "Members can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND private.is_trip_member(trip_id, auth.uid())
  AND NOT EXISTS (
    SELECT 1
    FROM public.trip_members tm
    WHERE tm.trip_id = messages.trip_id
      AND tm.user_id <> auth.uid()
      AND public.users_blocked_either_way(auth.uid(), tm.user_id)
  )
);

-- Trip members: hide members you've blocked / who've blocked you
DROP POLICY IF EXISTS "Trip members visible to trip participants" ON public.trip_members;
CREATE POLICY "Trip members visible to trip participants"
ON public.trip_members
FOR SELECT
USING (
  (
    user_id = auth.uid()
    OR private.is_trip_member(trip_id, auth.uid())
    OR private.is_trip_creator(trip_id, auth.uid())
  )
  AND (user_id = auth.uid() OR NOT public.users_blocked_either_way(auth.uid(), user_id))
);

-- Harden enforce_profile_locks(): freeze full_name/date_of_birth/gender whenever
-- identity_locked is true, even against direct Data API PATCH requests.
CREATE OR REPLACE FUNCTION public.enforce_profile_locks()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  cooldown_remaining interval;
BEGIN
  -- Server-side lock: once identity is confirmed, these columns are frozen.
  IF COALESCE(OLD.identity_locked, false) = true THEN
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
      RAISE EXCEPTION 'Full name cannot be changed after onboarding. Please contact support.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.gender IS DISTINCT FROM OLD.gender THEN
      RAISE EXCEPTION 'Gender cannot be changed after onboarding.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth THEN
      RAISE EXCEPTION 'Date of birth cannot be changed after onboarding.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- identity_locked is irreversible
  IF COALESCE(OLD.identity_locked, false) = true AND COALESCE(NEW.identity_locked, false) = false THEN
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
