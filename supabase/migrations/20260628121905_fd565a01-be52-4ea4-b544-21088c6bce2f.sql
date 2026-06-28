DROP VIEW IF EXISTS public.moment_author_profiles;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

CREATE OR REPLACE FUNCTION private.profile_has_memory(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memories m
    WHERE m.user_id = _profile_id
  );
$$;

REVOKE ALL ON FUNCTION private.profile_has_memory(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.profile_has_memory(uuid) FROM anon;
REVOKE ALL ON FUNCTION private.profile_has_memory(uuid) FROM authenticated;

DROP POLICY IF EXISTS "Moment authors have public profile previews" ON public.profiles;
CREATE POLICY "Moment authors have public profile previews"
  ON public.profiles
  FOR SELECT
  USING (
    pending_deletion_at IS NULL
    AND private.profile_has_memory(profiles.id)
  );