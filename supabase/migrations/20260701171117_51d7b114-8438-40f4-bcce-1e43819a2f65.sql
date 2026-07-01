-- Revoke the default PUBLIC grant and grant only to authenticated.
-- These functions are intentionally client-callable and each performs its own auth.uid() check.

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion() TO authenticated;

REVOKE ALL ON FUNCTION public.get_memory_authors(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_memory_authors(uuid[]) TO authenticated;

REVOKE ALL ON FUNCTION public.get_trip_coordinator_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_trip_coordinator_contact(uuid) TO authenticated;