
-- 1. Premium tables: remove client insert/update policies
DROP POLICY IF EXISTS "own payments insert" ON public.premium_payment_history;
DROP POLICY IF EXISTS "own subscription insert" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "own subscription update" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "own subscription delete" ON public.premium_subscriptions;

REVOKE INSERT, UPDATE, DELETE ON public.premium_payment_history FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.premium_subscriptions FROM anon, authenticated;

-- Service role retains full access via existing GRANT ALL; ensure it's present.
GRANT ALL ON public.premium_payment_history TO service_role;
GRANT ALL ON public.premium_subscriptions TO service_role;

-- 2. Trips: hide coordinator_contact column from clients; expose via RPC to members only
REVOKE SELECT (coordinator_contact) ON public.trips FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_trip_coordinator_contact(_trip_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.coordinator_contact
    FROM public.trips t
   WHERE t.id = _trip_id
     AND (
       t.creator_id = auth.uid()
       OR EXISTS (
         SELECT 1 FROM public.trip_members m
          WHERE m.trip_id = t.id AND m.user_id = auth.uid()
       )
     );
$$;

REVOKE ALL ON FUNCTION public.get_trip_coordinator_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_trip_coordinator_contact(uuid) TO authenticated;

-- 3. Fix search_path on email helper functions
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
