
-- storage.objects policies for chat-attachments
CREATE POLICY "chat members can read attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND public.is_conversation_member(
      (string_to_array(name, '/'))[1]::uuid,
      auth.uid()
    )
  );

CREATE POLICY "chat members can upload attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND public.is_conversation_member(
      (string_to_array(name, '/'))[1]::uuid,
      auth.uid()
    )
  );

CREATE POLICY "chat members can delete own attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND owner = auth.uid()
  );
