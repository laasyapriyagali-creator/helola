CREATE OR REPLACE FUNCTION public.get_memory_authors(_ids uuid[])
RETURNS TABLE (id uuid, full_name text, username text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND p.pending_deletion_at IS NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.get_memory_authors(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_memory_authors(uuid[]) TO anon, authenticated;