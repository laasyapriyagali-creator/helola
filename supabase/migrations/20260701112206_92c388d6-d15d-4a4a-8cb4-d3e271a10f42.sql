-- Revoke column-level SELECT on sensitive profile fields from broad roles.
-- RLS still governs row access; column-level GRANTs add defense-in-depth so
-- these columns cannot be read via the public visibility policy.
REVOKE SELECT (date_of_birth, previous_usernames, username_changed_at, pending_deletion_at, identity_locked)
  ON public.profiles FROM anon, authenticated;

-- Owner-only view for the sensitive columns (relies on RLS: only the row owner
-- can read their own row through the "own profile" policy).
CREATE OR REPLACE VIEW public.my_profile_private
WITH (security_invoker = true)
AS
SELECT id, date_of_birth, previous_usernames, username_changed_at,
       pending_deletion_at, identity_locked
FROM public.profiles
WHERE id = auth.uid();

GRANT SELECT ON public.my_profile_private TO authenticated;