
-- Security hardening migration

-- 1) profiles: hide sensitive columns from anonymous (unauthenticated) viewers.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, username, bio, avatar_url, avatar_config, cover_url, is_verified, profile_visibility, created_at) ON public.profiles TO anon;

-- 2) trips: hide coordinator + cost-breakdown + logistics columns from anonymous viewers.
REVOKE SELECT ON public.trips FROM anon;
GRANT SELECT (
  id, creator_id, destination, description, cover_image_url,
  start_date, end_date, max_members, price_per_person, interests,
  itinerary, status, created_at, updated_at
) ON public.trips TO anon;

-- 3) trip_members: only authenticated users may enumerate the roster.
DROP POLICY IF EXISTS "Trip members are viewable by everyone" ON public.trip_members;
CREATE POLICY "Trip members viewable by authenticated"
  ON public.trip_members FOR SELECT
  TO authenticated
  USING (true);

-- 4) memory_likes: only authenticated users may read like activity.
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.memory_likes;
CREATE POLICY "Likes viewable by authenticated"
  ON public.memory_likes FOR SELECT
  TO authenticated
  USING (true);

-- 5) memories: only authenticated users may browse the social feed.
DROP POLICY IF EXISTS "Memories viewable by everyone" ON public.memories;
CREATE POLICY "Memories viewable by authenticated"
  ON public.memories FOR SELECT
  TO authenticated
  USING (true);

-- 6) chat-media: bucket was switched to private. Add a SELECT policy
-- that requires authentication; rendered as signed URLs from the app.
DROP POLICY IF EXISTS "chat-media public read" ON storage.objects;
CREATE POLICY "chat-media authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-media');

-- 7) Lock down internal SECURITY DEFINER helpers from public execution.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_memory_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_locks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_expired_accounts() FROM PUBLIC, anon, authenticated;
