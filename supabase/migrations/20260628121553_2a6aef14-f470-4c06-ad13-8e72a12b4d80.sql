CREATE OR REPLACE VIEW public.moment_author_profiles
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.full_name,
  p.username,
  p.bio,
  p.location,
  p.hobbies,
  p.avatar_url,
  p.cover_url,
  p.is_verified
FROM public.profiles p
WHERE p.pending_deletion_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.memories m
    WHERE m.user_id = p.id
    LIMIT 1
  );

DROP POLICY IF EXISTS "Moment authors have public profile previews" ON public.profiles;
CREATE POLICY "Moment authors have public profile previews"
  ON public.profiles
  FOR SELECT
  USING (
    pending_deletion_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.memories m
      WHERE m.user_id = profiles.id
      LIMIT 1
    )
  );

GRANT SELECT ON public.moment_author_profiles TO anon, authenticated;
GRANT SELECT ON public.moment_author_profiles TO service_role;