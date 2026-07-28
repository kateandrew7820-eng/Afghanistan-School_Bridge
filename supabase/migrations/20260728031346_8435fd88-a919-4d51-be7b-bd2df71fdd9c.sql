-- 1. Integrity triggers
CREATE TRIGGER chat_messages_bump_last_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.chat_bump_last_message();

CREATE TRIGGER conversations_set_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.conversations c
SET last_message_at = m.max_created
FROM (SELECT conversation_id, max(created_at) AS max_created FROM public.messages GROUP BY conversation_id) m
WHERE m.conversation_id = c.id AND c.last_message_at IS DISTINCT FROM m.max_created;

-- 2. client_id for idempotent optimistic sends
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS client_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS messages_conversation_client_id_key
  ON public.messages (conversation_id, client_id)
  WHERE client_id IS NOT NULL;

-- 3. Permission tightening
DROP POLICY IF EXISTS "members can update conversation" ON public.conversations;
CREATE POLICY "admins can update conversation"
ON public.conversations FOR UPDATE TO authenticated
USING (public.is_conversation_admin(id, auth.uid()))
WITH CHECK (public.is_conversation_admin(id, auth.uid()));

DROP POLICY IF EXISTS "creator or admin can add members" ON public.conversation_members;
CREATE POLICY "admins add members; creator bootstraps self"
ON public.conversation_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_conversation_admin(conversation_id, auth.uid())
  OR (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND c.created_by = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "insert own read receipt" ON public.message_reads;
CREATE POLICY "insert own read receipt"
ON public.message_reads FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_reads.message_id
      AND public.is_conversation_member(m.conversation_id, auth.uid())
  )
);

-- 4. Column-level guard triggers
CREATE OR REPLACE FUNCTION public.chat_guard_conversation_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.type := OLD.type;
  NEW.created_by := OLD.created_by;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER conversations_guard_update
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.chat_guard_conversation_update();

CREATE OR REPLACE FUNCTION public.chat_guard_message_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.conversation_id := OLD.conversation_id;
  NEW.sender_id := OLD.sender_id;
  NEW.reply_to_id := OLD.reply_to_id;
  NEW.created_at := OLD.created_at;
  NEW.client_id := OLD.client_id;
  NEW.attachment_url := OLD.attachment_url;
  NEW.attachment_name := OLD.attachment_name;
  NEW.attachment_mime := OLD.attachment_mime;
  NEW.attachment_size := OLD.attachment_size;

  IF NEW.body IS DISTINCT FROM OLD.body AND NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at THEN
    NEW.edited_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_guard_update
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.chat_guard_message_update();