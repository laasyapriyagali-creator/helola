DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  safe_username text;
BEGIN
  safe_username := lower(regexp_replace(
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      nullif(new.raw_user_meta_data->>'preferred_username', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'traveler'
    ),
    '[^a-z0-9_]+',
    '_',
    'g'
  ));

  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1),
      'Traveler'
    ),
    safe_username
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();