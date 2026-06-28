DROP FUNCTION IF EXISTS public.get_public_moment_profile(uuid);

CREATE OR REPLACE VIEW public.moment_author_profiles AS
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

GRANT SELECT ON public.moment_author_profiles TO anon, authenticated;
GRANT SELECT ON public.moment_author_profiles TO service_role;