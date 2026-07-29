CREATE OR REPLACE FUNCTION public.chat_unread_counts()
RETURNS TABLE (conversation_id uuid, unread_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.conversation_id,
         COALESCE(COUNT(m.id), 0)::int AS unread_count
  FROM public.conversation_members cm
  LEFT JOIN public.messages m
    ON m.conversation_id = cm.conversation_id
   AND m.sender_id <> cm.user_id
   AND m.created_at > cm.last_read_at
   AND m.deleted_at IS NULL
  WHERE cm.user_id = auth.uid()
  GROUP BY cm.conversation_id
$$;

REVOKE ALL ON FUNCTION public.chat_unread_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chat_unread_counts() TO authenticated;

CREATE INDEX IF NOT EXISTS idx_messages_conv_created_at
  ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user
  ON public.conversation_members (user_id);