REVOKE EXECUTE ON FUNCTION public.enforce_trip_capacity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_trip_capacity() TO service_role;