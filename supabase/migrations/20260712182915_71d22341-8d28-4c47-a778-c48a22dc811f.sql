REVOKE SELECT (coordinator_name, coordinator_contact) ON public.trips FROM authenticated;
REVOKE SELECT (coordinator_name, coordinator_contact) ON public.trips FROM anon;