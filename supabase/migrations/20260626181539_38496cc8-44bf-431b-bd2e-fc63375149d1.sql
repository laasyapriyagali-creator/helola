
-- 1. Lock down SECURITY DEFINER trigger/admin functions: no anon/authenticated EXECUTE.
REVOKE EXECUTE ON FUNCTION public.set_updated_at()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_memory_like()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_locks()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_expired_accounts() FROM PUBLIC, anon, authenticated;

-- 2. User-callable RPCs: anon cannot call; authenticated can.
REVOKE EXECUTE ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_account_deletion()  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.cancel_account_deletion()  TO authenticated;

-- 3. RLS helper used inside policy expressions: needs authenticated EXECUTE; deny anon.
REVOKE EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid) TO authenticated;

-- 4. Stop anonymous root-listing of memories / chat-media buckets.
DROP POLICY IF EXISTS "memories public read"      ON storage.objects;
DROP POLICY IF EXISTS "Memory images public read" ON storage.objects;
DROP POLICY IF EXISTS "chat-media public read"    ON storage.objects;

CREATE POLICY "memories public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memories' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "chat-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] IS NOT NULL);

-- 5. Useful indexes for hot query paths (notifications + trips listing).
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_trip_created
  ON public.messages (trip_id, created_at);
CREATE INDEX IF NOT EXISTS idx_memories_user_created
  ON public.memories (user_id, created_at DESC);
