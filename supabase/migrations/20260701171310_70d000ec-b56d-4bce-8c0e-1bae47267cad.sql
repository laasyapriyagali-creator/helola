-- SECURITY DEFINER RPC for cancelling your own premium subscription
CREATE OR REPLACE FUNCTION public.cancel_premium_subscription()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- SECURITY DEFINER RPC for toggling auto-renew on your own subscription
CREATE OR REPLACE FUNCTION public.set_premium_auto_renew(_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Only signed-in users may call these; anon has no business here
REVOKE ALL ON FUNCTION public.cancel_premium_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_premium_subscription() TO authenticated;

REVOKE ALL ON FUNCTION public.set_premium_auto_renew(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_premium_auto_renew(boolean) TO authenticated;