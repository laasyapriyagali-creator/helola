-- Add visibility + messaging columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS message_permission text NOT NULL DEFAULT 'everyone';

-- Blocked users
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);
CREATE POLICY "Users create their own blocks"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users delete their own blocks"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- User reports
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own reports"
  ON public.user_reports FOR SELECT
  USING (auth.uid() = reporter_id);
CREATE POLICY "Users create reports"
  ON public.user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Notification preferences (one row per user)
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id uuid PRIMARY KEY,
  trip_updates boolean NOT NULL DEFAULT true,
  group_chat boolean NOT NULL DEFAULT true,
  new_trip_alerts boolean NOT NULL DEFAULT true,
  offers_promotions boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notif prefs"
  ON public.notification_prefs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notif prefs"
  ON public.notification_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notif prefs"
  ON public.notification_prefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_notification_prefs_updated_at
  BEFORE UPDATE ON public.notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Travel preferences (one row per user)
CREATE TABLE IF NOT EXISTS public.travel_prefs (
  user_id uuid PRIMARY KEY,
  location_access boolean NOT NULL DEFAULT false,
  preferred_destinations text[] NOT NULL DEFAULT '{}',
  budget_min numeric,
  budget_max numeric,
  travel_interests text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.travel_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own travel prefs"
  ON public.travel_prefs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own travel prefs"
  ON public.travel_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own travel prefs"
  ON public.travel_prefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_travel_prefs_updated_at
  BEFORE UPDATE ON public.travel_prefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();