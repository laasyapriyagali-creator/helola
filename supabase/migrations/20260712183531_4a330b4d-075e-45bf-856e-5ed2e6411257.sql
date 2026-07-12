ALTER TABLE public.profiles ALTER COLUMN profile_visibility SET DEFAULT 'friends';
UPDATE public.profiles SET profile_visibility = 'friends' WHERE profile_visibility = 'public';