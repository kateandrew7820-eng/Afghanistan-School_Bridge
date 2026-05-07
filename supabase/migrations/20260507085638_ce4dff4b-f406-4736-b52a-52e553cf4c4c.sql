
-- 1) Tighten profile self-update: prevent privilege escalation via WITH CHECK
DROP POLICY IF EXISTS "Users can update own non-sensitive profile fields" ON public.profiles;

CREATE POLICY "Users can update own non-sensitive profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
  AND status IS NOT DISTINCT FROM (SELECT p.status FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verified_by_user_id IS NOT DISTINCT FROM (SELECT p.verified_by_user_id FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verified_at IS NOT DISTINCT FROM (SELECT p.verified_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND rejection_reason IS NOT DISTINCT FROM (SELECT p.rejection_reason FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2) Storage UPDATE policy for school-reports
DROP POLICY IF EXISTS "Schools can update own reports in storage" ON storage.objects;
CREATE POLICY "Schools can update own reports in storage"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'school-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3) Remove submissions tables from realtime publication (no realtime.messages RLS available)
ALTER PUBLICATION supabase_realtime DROP TABLE public.statistics_submissions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.report_submissions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.form_submissions;

-- 4) Enforce form_data size at DB level (in addition to trigger)
ALTER TABLE public.form_submissions
  ADD CONSTRAINT form_data_size_check CHECK (pg_column_size(form_data) < 102400);

-- 5) handle_new_user already truncates with LEFT(...,255). Add column hard limits as defence-in-depth.
ALTER TABLE public.profiles ALTER COLUMN full_name TYPE varchar(255);
ALTER TABLE public.profiles ALTER COLUMN phone_number TYPE varchar(50);
ALTER TABLE public.profiles ALTER COLUMN district TYPE varchar(255);
ALTER TABLE public.profiles ALTER COLUMN province TYPE varchar(255);
ALTER TABLE public.profiles ALTER COLUMN school_name TYPE varchar(255);
