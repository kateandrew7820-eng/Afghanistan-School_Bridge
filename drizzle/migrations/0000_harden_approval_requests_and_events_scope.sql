-- 1. Applicants must no longer read their own action_token
DROP POLICY IF EXISTS "Applicants can view their own approval requests" ON public.approval_requests;

CREATE POLICY "Admins can view approval requests"
ON public.approval_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Safe status-only accessor for applicants (no action_token exposure)
CREATE OR REPLACE FUNCTION public.my_approval_request_status()
RETURNS TABLE(status text, approver_label text, created_at timestamptz, decided_at timestamptz, decision_note text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ar.status, ar.approver_label, ar.created_at, ar.decided_at, ar.decision_note
  FROM public.approval_requests ar
  WHERE ar.applicant_user_id = auth.uid()
  ORDER BY ar.created_at DESC
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.my_approval_request_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_approval_request_status() TO authenticated;

-- 2. Applicants can no longer insert fabricated approval requests;
--    creation happens only through the service-role edge function.
DROP POLICY IF EXISTS "Applicants can create their own approval requests" ON public.approval_requests;

REVOKE INSERT, UPDATE, DELETE ON public.approval_requests FROM authenticated;
GRANT SELECT ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;

-- 3. submission_events reads must be scoped to submissions the user may access
DROP POLICY IF EXISTS "Actors and admins can read events" ON public.submission_events;

CREATE POLICY "Scoped read of submission events"
ON public.submission_events
FOR SELECT
TO authenticated
USING (
  actor_user_id = auth.uid()
  OR public.can_access_submission(submission_table, submission_id)
);