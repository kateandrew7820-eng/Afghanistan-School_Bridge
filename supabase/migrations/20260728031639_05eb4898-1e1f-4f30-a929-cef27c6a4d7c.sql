CREATE OR REPLACE FUNCTION public.chat_bump_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.chat_bump_last_message() FROM PUBLIC, anon, authenticated;