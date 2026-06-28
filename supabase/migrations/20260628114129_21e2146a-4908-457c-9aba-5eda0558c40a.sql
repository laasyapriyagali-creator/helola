
-- 1) Enforce profile_visibility at the database level
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable per visibility"
  ON public.profiles FOR SELECT
  USING (
    -- Owner always sees own profile
    auth.uid() = id
    -- Public profiles (default) visible to anyone
    OR COALESCE(profile_visibility, 'public') = 'public'
    -- "Trip mates only" — viewer shares at least one trip with the profile owner
    OR (
      profile_visibility = 'friends'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.trip_members tm1
        JOIN public.trip_members tm2 ON tm1.trip_id = tm2.trip_id
        WHERE tm1.user_id = profiles.id
          AND tm2.user_id = auth.uid()
      )
    )
    -- 'private' => only owner (handled by first clause)
  );

-- 2) Enforce trip max_members at the database level
CREATE OR REPLACE FUNCTION public.enforce_trip_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count int;
  cap int;
BEGIN
  SELECT max_members INTO cap FROM public.trips WHERE id = NEW.trip_id;
  IF cap IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO current_count FROM public.trip_members WHERE trip_id = NEW.trip_id;
  IF current_count >= cap THEN
    RAISE EXCEPTION 'Trip is full' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_trip_capacity() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_trip_capacity ON public.trip_members;
CREATE TRIGGER trg_enforce_trip_capacity
BEFORE INSERT ON public.trip_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_capacity();
