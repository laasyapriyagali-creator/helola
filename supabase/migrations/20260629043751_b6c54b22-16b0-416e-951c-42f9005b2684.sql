
-- 1. Restrict "Moment authors have public profile previews" to authenticated only
DROP POLICY IF EXISTS "Moment authors have public profile previews" ON public.profiles;
CREATE POLICY "Moment authors have public profile previews"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (pending_deletion_at IS NULL AND private.profile_has_memory(id));

-- 2. Add DELETE policy on travel_prefs so users can remove their own preferences
CREATE POLICY "Users delete own travel prefs"
  ON public.travel_prefs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Tighten function EXECUTE: revoke anon on get_memory_authors (only signed-in callers need it)
REVOKE EXECUTE ON FUNCTION public.get_memory_authors(uuid[]) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_memory_authors(uuid[]) TO authenticated;
