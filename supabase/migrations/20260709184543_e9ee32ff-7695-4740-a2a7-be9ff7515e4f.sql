CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Internal trip membership helpers used by access policies.
CREATE OR REPLACE FUNCTION private.is_trip_member(_trip_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trip_members
    WHERE trip_id = _trip_id
      AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION private.is_trip_creator(_trip_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trips
    WHERE id = _trip_id
      AND creator_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION private.is_trip_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_trip_creator(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_trip_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_trip_creator(uuid, uuid) TO authenticated, service_role;

-- Move public policies away from public SECURITY DEFINER helpers.
DROP POLICY IF EXISTS "Trip members visible to trip participants" ON public.trip_members;
CREATE POLICY "Trip members visible to trip participants"
ON public.trip_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR private.is_trip_member(trip_id, auth.uid())
  OR private.is_trip_creator(trip_id, auth.uid())
);

DROP POLICY IF EXISTS "Members can view trip messages" ON public.messages;
CREATE POLICY "Members can view trip messages"
ON public.messages
FOR SELECT
TO authenticated
USING (private.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
CREATE POLICY "Members can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id AND private.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "Senders can delete their own messages" ON public.messages;
CREATE POLICY "Senders can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id AND private.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "chat-media users upload own folder" ON storage.objects;
CREATE POLICY "chat-media users upload own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND private.is_trip_member(((storage.foldername(name))[2])::uuid, auth.uid())
);

-- Internal implementations for user-facing account and premium actions.
CREATE OR REPLACE FUNCTION private.request_account_deletion_impl()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
     SET pending_deletion_at = now()
   WHERE id = auth.uid();

  INSERT INTO public.account_deletion_audit(user_id, event)
  VALUES (auth.uid(), 'requested');
END;
$$;

CREATE OR REPLACE FUNCTION private.cancel_account_deletion_impl()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
     SET pending_deletion_at = NULL
   WHERE id = auth.uid();

  INSERT INTO public.account_deletion_audit(user_id, event)
  VALUES (auth.uid(), 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION private.cancel_premium_subscription_impl()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.premium_subscriptions
     SET status = 'cancelled',
         auto_renew = false,
         cancelled_at = now()
   WHERE user_id = auth.uid()
     AND status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION private.set_premium_auto_renew_impl(_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.premium_subscriptions
     SET auto_renew = _value
   WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION private.get_trip_coordinator_contact_impl(_trip_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.coordinator_contact
    FROM public.trips t
   WHERE t.id = _trip_id
     AND (
       t.creator_id = auth.uid()
       OR EXISTS (
         SELECT 1
         FROM public.trip_members m
         WHERE m.trip_id = t.id
           AND m.user_id = auth.uid()
       )
     );
$$;

REVOKE ALL ON FUNCTION private.request_account_deletion_impl() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.cancel_account_deletion_impl() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.cancel_premium_subscription_impl() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.set_premium_auto_renew_impl(boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.get_trip_coordinator_contact_impl(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.request_account_deletion_impl() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.cancel_account_deletion_impl() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.cancel_premium_subscription_impl() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.set_premium_auto_renew_impl(boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_trip_coordinator_contact_impl(uuid) TO authenticated, service_role;

-- Public RPC wrappers are invoker functions, so they no longer trigger the public SECURITY DEFINER executable warning.
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.request_account_deletion_impl();
$$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.cancel_account_deletion_impl();
$$;

CREATE OR REPLACE FUNCTION public.cancel_premium_subscription()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.cancel_premium_subscription_impl();
$$;

CREATE OR REPLACE FUNCTION public.set_premium_auto_renew(_value boolean)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.set_premium_auto_renew_impl(_value);
$$;

CREATE OR REPLACE FUNCTION public.get_trip_coordinator_contact(_trip_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.get_trip_coordinator_contact_impl(_trip_id);
$$;

CREATE OR REPLACE FUNCTION public.get_memory_authors(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, username text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_ids);
$$;

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_account_deletion() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_premium_subscription() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_premium_auto_renew(boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_trip_coordinator_contact(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_memory_authors(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_premium_subscription() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_premium_auto_renew(boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_trip_coordinator_contact(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_memory_authors(uuid[]) TO authenticated, service_role;

-- The public helpers remain only for legacy/internal compatibility and are no longer callable by signed-in users.
REVOKE EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_trip_creator(uuid, uuid) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_trip_creator(uuid, uuid) TO service_role;