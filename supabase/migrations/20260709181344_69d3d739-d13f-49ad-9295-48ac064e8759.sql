
CREATE OR REPLACE FUNCTION public.is_trip_creator(_trip_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips WHERE id = _trip_id AND creator_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_trip_creator(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_trip_creator(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Trip members visible to trip participants" ON public.trip_members;

CREATE POLICY "Trip members visible to trip participants"
ON public.trip_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_trip_member(trip_id, auth.uid())
  OR public.is_trip_creator(trip_id, auth.uid())
);
