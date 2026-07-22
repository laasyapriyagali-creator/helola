-- 1) Column-level: hide trips.coordinator_contact from broad SELECT
REVOKE SELECT (coordinator_contact) ON public.trips FROM anon, authenticated;

-- 2) Create private.users_blocked_either_way
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.users_blocked_either_way(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  );
$$;

REVOKE ALL ON FUNCTION private.users_blocked_either_way(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.users_blocked_either_way(uuid, uuid) TO authenticated, service_role;

-- 3) Repoint every dependent policy to private.users_blocked_either_way
DROP POLICY IF EXISTS "Trips are viewable by everyone" ON public.trips;
CREATE POLICY "Trips are viewable by everyone" ON public.trips
  FOR SELECT TO anon, authenticated
  USING (
    NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = trips.creator_id AND p.pending_deletion_at IS NOT NULL)
    AND (auth.uid() IS NULL OR NOT private.users_blocked_either_way(auth.uid(), creator_id))
  );

DROP POLICY IF EXISTS "Memories viewable by authenticated" ON public.memories;
CREATE POLICY "Memories viewable by authenticated" ON public.memories
  FOR SELECT TO authenticated
  USING (
    NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = memories.user_id AND p.pending_deletion_at IS NOT NULL)
    AND NOT private.users_blocked_either_way(auth.uid(), memories.user_id)
  );

DROP POLICY IF EXISTS "Profiles are viewable per visibility" ON public.profiles;
CREATE POLICY "Profiles are viewable per visibility" ON public.profiles
  FOR SELECT
  USING (
    pending_deletion_at IS NULL
    AND (
      auth.uid() = id
      OR (
        NOT private.users_blocked_either_way(auth.uid(), id)
        AND (
          COALESCE(profile_visibility, 'public') = 'public'
          OR (
            profile_visibility = 'friends'
            AND EXISTS (
              SELECT 1 FROM public.trip_members tm1
              JOIN public.trip_members tm2 ON tm1.trip_id = tm2.trip_id
              WHERE tm1.user_id = profiles.id AND tm2.user_id = auth.uid()
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Moment authors have public profile previews" ON public.profiles;
CREATE POLICY "Moment authors have public profile previews" ON public.profiles
  FOR SELECT
  USING (
    pending_deletion_at IS NULL
    AND private.profile_has_memory(id)
    AND (auth.uid() IS NULL OR NOT private.users_blocked_either_way(auth.uid(), id))
  );

DROP POLICY IF EXISTS "Members can view trip messages" ON public.messages;
CREATE POLICY "Members can view trip messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    private.is_trip_member(trip_id, auth.uid())
    AND NOT private.users_blocked_either_way(auth.uid(), sender_id)
  );

DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
CREATE POLICY "Members can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND private.is_trip_member(trip_id, auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = messages.trip_id
        AND tm.user_id <> auth.uid()
        AND private.users_blocked_either_way(auth.uid(), tm.user_id)
    )
  );

DROP POLICY IF EXISTS "Trip members visible to trip participants" ON public.trip_members;
CREATE POLICY "Trip members visible to trip participants" ON public.trip_members
  FOR SELECT
  USING (
    (user_id = auth.uid()
      OR private.is_trip_member(trip_id, auth.uid())
      OR private.is_trip_creator(trip_id, auth.uid()))
    AND (user_id = auth.uid() OR NOT private.users_blocked_either_way(auth.uid(), user_id))
  );

-- 4) Drop the public helper now that no policy references it
DROP FUNCTION IF EXISTS public.users_blocked_either_way(uuid, uuid);

-- 5) Tighten memory_likes SELECT to owner + liker
DROP POLICY IF EXISTS "Likes viewable by authenticated" ON public.memory_likes;
CREATE POLICY "Likes viewable to memory author and liker" ON public.memory_likes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.memories m WHERE m.id = memory_likes.memory_id AND m.user_id = auth.uid())
  );

-- 6) Block-check on memory_likes INSERT
DROP POLICY IF EXISTS "Users like as themselves" ON public.memory_likes;
CREATE POLICY "Users like as themselves" ON public.memory_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_likes.memory_id
        AND private.users_blocked_either_way(auth.uid(), m.user_id)
    )
  );

-- 7) Block-check on wishlists INSERT
DROP POLICY IF EXISTS "Users add to their own wishlist" ON public.wishlists;
CREATE POLICY "Users add to their own wishlist" ON public.wishlists
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = wishlists.trip_id
        AND private.users_blocked_either_way(auth.uid(), t.creator_id)
    )
  );