
-- 1. Audit log
CREATE TABLE IF NOT EXISTS public.account_deletion_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event text NOT NULL CHECK (event IN ('requested','cancelled','purged')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_deletion_audit TO authenticated;
GRANT ALL ON public.account_deletion_audit TO service_role;
ALTER TABLE public.account_deletion_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view their own deletion audit" ON public.account_deletion_audit;
CREATE POLICY "Users view their own deletion audit"
  ON public.account_deletion_audit FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Full-purge function
CREATE OR REPLACE FUNCTION public.purge_user_data(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Storage objects owned by user
  DELETE FROM storage.objects WHERE owner = _user_id;

  -- App data
  DELETE FROM public.memory_likes WHERE user_id = _user_id;
  DELETE FROM public.memories WHERE user_id = _user_id;
  DELETE FROM public.messages WHERE sender_id = _user_id;
  DELETE FROM public.notifications WHERE recipient_id = _user_id OR actor_id = _user_id;
  DELETE FROM public.notification_prefs WHERE user_id = _user_id;
  DELETE FROM public.travel_prefs WHERE user_id = _user_id;
  DELETE FROM public.wishlists WHERE user_id = _user_id;
  DELETE FROM public.trip_members WHERE user_id = _user_id;
  DELETE FROM public.blocked_users WHERE blocker_id = _user_id OR blocked_id = _user_id;
  DELETE FROM public.user_reports WHERE reporter_id = _user_id OR reported_id = _user_id;
  DELETE FROM public.trips WHERE creator_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;

  INSERT INTO public.account_deletion_audit(user_id, event) VALUES (_user_id, 'purged');

  -- Finally remove from auth (cascades to remaining auth-owned rows)
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.purge_user_data(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Replace purge_expired_accounts to use full purge
CREATE OR REPLACE FUNCTION public.purge_expired_accounts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  victim uuid;
  count_deleted integer := 0;
BEGIN
  FOR victim IN
    SELECT id FROM public.profiles
     WHERE pending_deletion_at IS NOT NULL
       AND pending_deletion_at < now() - interval '30 days'
  LOOP
    PERFORM public.purge_user_data(victim);
    count_deleted := count_deleted + 1;
  END LOOP;
  RETURN count_deleted;
END;
$$;

-- 4. Audit on request/cancel
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.profiles
     SET pending_deletion_at = now()
   WHERE id = auth.uid();
  INSERT INTO public.account_deletion_audit(user_id, event) VALUES (auth.uid(), 'requested');
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.profiles
     SET pending_deletion_at = NULL
   WHERE id = auth.uid();
  INSERT INTO public.account_deletion_audit(user_id, event) VALUES (auth.uid(), 'cancelled');
END;
$$;

-- 5. Hide pending-deletion users in visibility policies; restrict to authenticated
DROP POLICY IF EXISTS "Profiles are viewable per visibility" ON public.profiles;
CREATE POLICY "Profiles are viewable per visibility"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    pending_deletion_at IS NULL AND (
      auth.uid() = id
      OR COALESCE(profile_visibility, 'public') = 'public'
      OR (
        profile_visibility = 'friends'
        AND EXISTS (
          SELECT 1 FROM public.trip_members tm1
          JOIN public.trip_members tm2 ON tm1.trip_id = tm2.trip_id
          WHERE tm1.user_id = profiles.id AND tm2.user_id = auth.uid()
        )
      )
    )
  );

-- Hide memories from pending-deletion users
DROP POLICY IF EXISTS "Memories viewable by authenticated" ON public.memories;
CREATE POLICY "Memories viewable by authenticated"
  ON public.memories FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = memories.user_id AND p.pending_deletion_at IS NOT NULL
    )
  );

-- Hide trips created by pending-deletion users
DROP POLICY IF EXISTS "Trips are viewable by everyone" ON public.trips;
CREATE POLICY "Trips are viewable by authenticated"
  ON public.trips FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = trips.creator_id AND p.pending_deletion_at IS NOT NULL
    )
  );

-- 6. Schedule daily purge
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge-expired-accounts');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'purge-expired-accounts',
      '15 3 * * *',
      $cron$SELECT public.purge_expired_accounts();$cron$
    );
  END IF;
END $$;
