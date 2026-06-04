CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_username text;
  final_username text;
BEGIN
  base_username := lower(regexp_replace(
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

  base_username := trim(both '_' from base_username);
  IF base_username = '' THEN
    base_username := 'traveler';
  END IF;

  final_username := base_username;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username AND id <> new.id) THEN
    final_username := left(base_username, 20) || '_' || substr(new.id::text, 1, 8);
  END IF;

  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1),
      'Traveler'
    ),
    final_username
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;