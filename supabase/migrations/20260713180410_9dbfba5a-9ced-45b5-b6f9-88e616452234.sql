
-- 1) Attach enforce_profile_locks as a real BEFORE UPDATE trigger on profiles
DROP TRIGGER IF EXISTS enforce_profile_locks_trg ON public.profiles;
CREATE TRIGGER enforce_profile_locks_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_locks();

-- 2) Enforce block-list on memories & trips SELECT paths
DROP POLICY IF EXISTS "Memories viewable by authenticated" ON public.memories;
CREATE POLICY "Memories viewable by authenticated" ON public.memories
  FOR SELECT TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = memories.user_id AND p.pending_deletion_at IS NOT NULL
    )
    AND NOT public.users_blocked_either_way(auth.uid(), memories.user_id)
  );

DROP POLICY IF EXISTS "Trips are viewable by authenticated" ON public.trips;
CREATE POLICY "Trips are viewable by authenticated" ON public.trips
  FOR SELECT TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = trips.creator_id AND p.pending_deletion_at IS NOT NULL
    )
    AND NOT public.users_blocked_either_way(auth.uid(), trips.creator_id)
  );

-- 3) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
--    These are trigger/admin/service-role helpers never intended for client calls.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_memory_like()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_locks()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_trip_capacity()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_expired_accounts()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_user_data(uuid)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)   FROM PUBLIC, anon, authenticated;

-- RLS-helper functions: revoke from anon (never signed in) but keep authenticated
-- since PostgREST needs EXECUTE to evaluate them inside policies for signed-in users.
REVOKE EXECUTE ON FUNCTION public.is_trip_creator(uuid, uuid)       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.users_blocked_either_way(uuid, uuid) FROM PUBLIC, anon;
