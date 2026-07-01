
-- Revoke broad SELECT so column-level grants take effect
REVOKE SELECT ON public.trips FROM anon, authenticated;

-- Re-grant SELECT on every column EXCEPT coordinator_contact
GRANT SELECT (
  id, creator_id, destination, description, cover_image_url,
  start_date, end_date, max_members, price_per_person,
  cost_stay, cost_travel, cost_food, cost_other,
  interests, itinerary, stay_details, travel_details, important_notes,
  coordinator_name, status, created_at, updated_at
) ON public.trips TO anon, authenticated;
