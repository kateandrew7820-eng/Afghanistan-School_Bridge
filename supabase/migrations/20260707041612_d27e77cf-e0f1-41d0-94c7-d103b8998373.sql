
REVOKE EXECUTE ON FUNCTION public.can_access_submission(text, uuid) FROM anon, public;

DROP POLICY IF EXISTS "Authenticated can insert their own events" ON public.submission_events;

CREATE POLICY "Authenticated can insert their own events"
ON public.submission_events
FOR INSERT
TO authenticated
WITH CHECK (
  actor_user_id = auth.uid()
  AND public.can_access_submission(submission_table, submission_id)
  AND (
    public.is_admin()
    OR (
      public.has_role(auth.uid(), 'province_admin')
      AND (to_stage IS NULL OR to_stage IN ('province'::review_stage, 'ministry'::review_stage, 'completed'::review_stage, 'district'::review_stage))
    )
    OR (
      public.has_role(auth.uid(), 'district_admin')
      AND (to_stage IS NULL OR to_stage IN ('district'::review_stage, 'province'::review_stage, 'school'::review_stage))
    )
    OR (
      (public.has_role(auth.uid(), 'principal')
        OR public.has_role(auth.uid(), 'teacher')
        OR public.has_role(auth.uid(), 'school'))
      AND (to_stage IS NULL OR to_stage IN ('school'::review_stage, 'district'::review_stage))
    )
  )
);
