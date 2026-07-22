-- Restore public visibility for trips so share links work for signed-out visitors.
-- The block-list check still applies for authenticated users; anon simply skips it.
DROP POLICY IF EXISTS "Trips are viewable by authenticated" ON public.trips;
CREATE POLICY "Trips are viewable by everyone" ON public.trips
  FOR SELECT
  TO anon, authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = trips.creator_id AND p.pending_deletion_at IS NOT NULL
    )
    AND (
      auth.uid() IS NULL
      OR NOT public.users_blocked_either_way(auth.uid(), trips.creator_id)
    )
  );

GRANT SELECT ON public.trips TO anon;