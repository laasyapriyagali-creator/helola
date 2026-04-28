
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_deletion_at timestamptz;

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
END;
$$;

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
    DELETE FROM auth.users WHERE id = victim;
    count_deleted := count_deleted + 1;
  END LOOP;
  RETURN count_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion() TO authenticated;
