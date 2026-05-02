
-- Memories: support multiple media per post
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Messages: support image/video attachments
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow content to be empty when a message is purely attachments
ALTER TABLE public.messages
  ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.messages
  ALTER COLUMN content SET DEFAULT '';

-- Chat media bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-media
DROP POLICY IF EXISTS "chat-media public read" ON storage.objects;
CREATE POLICY "chat-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat-media users upload own folder" ON storage.objects;
CREATE POLICY "chat-media users upload own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "chat-media users update own" ON storage.objects;
CREATE POLICY "chat-media users update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "chat-media users delete own" ON storage.objects;
CREATE POLICY "chat-media users delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Same for memories bucket (in case not present)
DROP POLICY IF EXISTS "memories public read" ON storage.objects;
CREATE POLICY "memories public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memories');

DROP POLICY IF EXISTS "memories users upload own folder" ON storage.objects;
CREATE POLICY "memories users upload own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memories'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "memories users update own" ON storage.objects;
CREATE POLICY "memories users update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'memories'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "memories users delete own" ON storage.objects;
CREATE POLICY "memories users delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memories'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
