-- 1. Storage: restrict center-documents reads to verified users / admins
DROP POLICY IF EXISTS "Anyone can view center documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view center documents" ON storage.objects;

CREATE POLICY "Verified users can view center documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'center-documents'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'verified'
    )
  )
);

-- 2. Submissions: move UPDATE policies from public to authenticated
DROP POLICY IF EXISTS "Admins can update forms" ON public.form_submissions;
CREATE POLICY "Admins can update forms" ON public.form_submissions
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "District admins can update district forms" ON public.form_submissions;
CREATE POLICY "District admins can update district forms" ON public.form_submissions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()));

DROP POLICY IF EXISTS "Province admins can update province forms" ON public.form_submissions;
CREATE POLICY "Province admins can update province forms" ON public.form_submissions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()));

DROP POLICY IF EXISTS "District admins can update district reports" ON public.report_submissions;
CREATE POLICY "District admins can update district reports" ON public.report_submissions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()));

DROP POLICY IF EXISTS "Province admins can update province reports" ON public.report_submissions;
CREATE POLICY "Province admins can update province reports" ON public.report_submissions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()));

DROP POLICY IF EXISTS "Admins can update stats" ON public.statistics_submissions;
CREATE POLICY "Admins can update stats" ON public.statistics_submissions
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "District admins can update district stats" ON public.statistics_submissions;
CREATE POLICY "District admins can update district stats" ON public.statistics_submissions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()));

DROP POLICY IF EXISTS "Province admins can update province stats" ON public.statistics_submissions;
CREATE POLICY "Province admins can update province stats" ON public.statistics_submissions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()));

-- 3. Comments: restrict read policy to authenticated
DROP POLICY IF EXISTS "Authors and reviewers can read comments" ON public.submission_comments;
CREATE POLICY "Authors and reviewers can read comments" ON public.submission_comments
FOR SELECT TO authenticated
USING (author_user_id = auth.uid() OR public.can_access_submission(submission_table, submission_id));