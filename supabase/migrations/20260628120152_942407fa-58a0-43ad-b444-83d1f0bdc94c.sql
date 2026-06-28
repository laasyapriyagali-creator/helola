
DROP POLICY IF EXISTS "Senders can delete their own messages" ON public.messages;
CREATE POLICY "Senders can delete their own messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id AND public.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "chat-media users upload own folder" ON storage.objects;
CREATE POLICY "chat-media users upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND public.is_trip_member(((storage.foldername(name))[2])::uuid, auth.uid())
);
