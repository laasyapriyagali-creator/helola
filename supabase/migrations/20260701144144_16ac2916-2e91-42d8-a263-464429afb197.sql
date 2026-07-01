
-- Plan + status enums
DO $$ BEGIN
  CREATE TYPE public.premium_plan AS ENUM ('monthly','six_month','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.premium_status AS ENUM ('active','cancelled','expired','pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.premium_plan NOT NULL,
  status public.premium_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  renewal_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  provider TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_subscriptions TO authenticated;
GRANT ALL ON public.premium_subscriptions TO service_role;

ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own subscription select" ON public.premium_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own subscription insert" ON public.premium_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subscription update" ON public.premium_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subscription delete" ON public.premium_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER premium_subscriptions_updated_at
  BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.premium_payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.premium_subscriptions(id) ON DELETE SET NULL,
  plan public.premium_plan NOT NULL,
  amount_inr INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'succeeded',
  provider TEXT,
  provider_payment_id TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.premium_payment_history TO authenticated;
GRANT ALL ON public.premium_payment_history TO service_role;

ALTER TABLE public.premium_payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own payments select" ON public.premium_payment_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own payments insert" ON public.premium_payment_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_premium_payments_user ON public.premium_payment_history(user_id, paid_at DESC);
