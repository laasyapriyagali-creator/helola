CREATE OR REPLACE FUNCTION public.get_public_moment_profile(_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  bio text,
  location text,
  hobbies text[],
  avatar_url text,
  cover_url text,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE p.id = _id
    AND p.pending_deletion_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.memories m
      WHERE m.user_id = p.id
      LIMIT 1
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_moment_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_moment_profile(uuid) TO anon, authenticated;