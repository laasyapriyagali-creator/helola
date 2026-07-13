-- Enforce trip capacity at the database level so "Full" trips can't be joined by racing clients.
DROP TRIGGER IF EXISTS trg_enforce_trip_capacity ON public.trip_members;
CREATE TRIGGER trg_enforce_trip_capacity
BEFORE INSERT ON public.trip_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_capacity();