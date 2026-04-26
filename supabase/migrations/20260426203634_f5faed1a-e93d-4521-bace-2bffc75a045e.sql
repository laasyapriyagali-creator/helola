
-- Profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  age INTEGER,
  gender TEXT,
  location TEXT,
  hobbies TEXT[],
  avatar_config JSONB DEFAULT '{}'::jsonb,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trips table
CREATE TYPE public.trip_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

CREATE TABLE public.trips (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 6 CHECK (max_members BETWEEN 2 AND 20),
  price_per_person NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_stay NUMERIC(10,2) DEFAULT 0,
  cost_travel NUMERIC(10,2) DEFAULT 0,
  cost_food NUMERIC(10,2) DEFAULT 0,
  cost_other NUMERIC(10,2) DEFAULT 0,
  interests TEXT[] DEFAULT '{}',
  itinerary JSONB DEFAULT '[]'::jsonb,
  stay_details JSONB DEFAULT '{}'::jsonb,
  travel_details JSONB DEFAULT '{}'::jsonb,
  important_notes JSONB DEFAULT '{}'::jsonb,
  coordinator_name TEXT,
  coordinator_contact TEXT,
  status public.trip_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trips are viewable by everyone"
  ON public.trips FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create trips"
  ON public.trips FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their trips"
  ON public.trips FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their trips"
  ON public.trips FOR DELETE USING (auth.uid() = creator_id);

CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trip members
CREATE TABLE public.trip_members (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- Helper function: is user a member of trip (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_trip_member(_trip_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = _trip_id AND user_id = _user_id
  );
$$;

CREATE POLICY "Trip members are viewable by everyone"
  ON public.trip_members FOR SELECT USING (true);

CREATE POLICY "Users can join trips themselves"
  ON public.trip_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave trips themselves"
  ON public.trip_members FOR DELETE USING (auth.uid() = user_id);

-- Group chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view trip messages"
  ON public.messages FOR SELECT
  USING (public.is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Members can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Senders can delete their own messages"
  ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- Wishlist
CREATE TABLE public.wishlists (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own wishlist"
  ON public.wishlists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users add to their own wishlist"
  ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove from their own wishlist"
  ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_trips_destination ON public.trips(destination);
CREATE INDEX idx_trips_start_date ON public.trips(start_date);
CREATE INDEX idx_trip_members_trip ON public.trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON public.trip_members(user_id);
CREATE INDEX idx_messages_trip ON public.messages(trip_id, created_at DESC);
