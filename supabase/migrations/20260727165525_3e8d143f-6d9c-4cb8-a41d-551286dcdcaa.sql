REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_conversation_admin(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can view documents" ON public.center_documents;
CREATE POLICY "Verified users can view documents"
ON public.center_documents
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.status = 'verified'
  )
);

ALTER PUBLICATION supabase_realtime DROP TABLE public.signup_challenges;
ALTER PUBLICATION supabase_realtime DROP TABLE public.approval_requests;