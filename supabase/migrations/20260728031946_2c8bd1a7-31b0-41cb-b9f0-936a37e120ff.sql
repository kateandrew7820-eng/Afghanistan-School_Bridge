DROP POLICY IF EXISTS "members can read conversation" ON public.conversations;
CREATE POLICY "members or creator can read conversation"
ON public.conversations FOR SELECT TO authenticated
USING (
  public.is_conversation_member(id, auth.uid())
  OR created_by = auth.uid()
);