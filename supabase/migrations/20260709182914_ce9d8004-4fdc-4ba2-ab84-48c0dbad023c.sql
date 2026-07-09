REVOKE EXECUTE ON FUNCTION public.is_trip_creator(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_trip_creator(uuid, uuid) TO authenticated, service_role;