
-- Profiles: column-level grants for anon
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, full_name, username, bio, avatar_config, is_verified,
  created_at, updated_at, avatar_url, profile_visibility,
  message_permission, cover_url, username_change_count, identity_locked
) ON public.profiles TO anon;

-- Trips: column-level grants for anon
REVOKE SELECT ON public.trips FROM anon;
GRANT SELECT (
  id, creator_id, destination, description, cover_image_url,
  start_date, end_date, max_members, price_per_person,
  interests, itinerary, coordinator_name, status, created_at, updated_at
) ON public.trips TO anon;

-- Chat-media: replace open authenticated SELECT with trip-member check
DROP POLICY IF EXISTS "chat-media authenticated read" ON storage.objects;

CREATE POLICY "chat-media trip members read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.user_id = auth.uid()
      AND tm.trip_id::text = (storage.foldername(name))[2]
  )
);
