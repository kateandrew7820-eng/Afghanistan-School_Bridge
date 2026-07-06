
-- Helper: check if caller has access to a given submission (any of 3 tables)
CREATE OR REPLACE FUNCTION public.can_access_submission(_table text, _id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _school uuid;
  _district text;
  _province text;
BEGIN
  IF _table = 'statistics_submissions' THEN
    SELECT school_id, district, province INTO _school, _district, _province
      FROM public.statistics_submissions WHERE id = _id;
  ELSIF _table = 'report_submissions' THEN
    SELECT school_id, district, province INTO _school, _district, _province
      FROM public.report_submissions WHERE id = _id;
  ELSIF _table = 'form_submissions' THEN
    SELECT school_id, district, province INTO _school, _district, _province
      FROM public.form_submissions WHERE id = _id;
  ELSE
    RETURN false;
  END IF;

  IF _school IS NULL AND _district IS NULL AND _province IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.is_admin()
      OR (_school IS NOT NULL AND _school = public.get_user_school_id(auth.uid()))
      OR (public.has_role(auth.uid(), 'district_admin') AND _district IS NOT NULL AND _district = public.get_user_district(auth.uid()))
      OR (public.has_role(auth.uid(), 'province_admin') AND _province IS NOT NULL AND _province = public.get_user_province(auth.uid()));
END;
$$;

-- submission_comments: tighten SELECT and INSERT
DROP POLICY IF EXISTS "Authors and reviewers can read comments" ON public.submission_comments;
CREATE POLICY "Authors and reviewers can read comments"
  ON public.submission_comments FOR SELECT
  USING (
    author_user_id = auth.uid()
    OR public.can_access_submission(submission_table, submission_id)
  );

DROP POLICY IF EXISTS "Authenticated can add comments" ON public.submission_comments;
CREATE POLICY "Authenticated can add comments"
  ON public.submission_comments FOR INSERT
  WITH CHECK (
    author_user_id = auth.uid()
    AND public.can_access_submission(submission_table, submission_id)
  );

-- submission_events: tighten INSERT
DROP POLICY IF EXISTS "Authenticated can insert their own events" ON public.submission_events;
CREATE POLICY "Authenticated can insert their own events"
  ON public.submission_events FOR INSERT
  WITH CHECK (
    actor_user_id = auth.uid()
    AND public.can_access_submission(submission_table, submission_id)
  );

-- Add WITH CHECK to UPDATE policies for defense-in-depth / scope escape prevention
-- form_submissions
DROP POLICY IF EXISTS "Admins can update forms" ON public.form_submissions;
CREATE POLICY "Admins can update forms" ON public.form_submissions
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "District admins can update district forms" ON public.form_submissions;
CREATE POLICY "District admins can update district forms" ON public.form_submissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()));

DROP POLICY IF EXISTS "Province admins can update province forms" ON public.form_submissions;
CREATE POLICY "Province admins can update province forms" ON public.form_submissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()));

-- report_submissions
DROP POLICY IF EXISTS "District admins can update district reports" ON public.report_submissions;
CREATE POLICY "District admins can update district reports" ON public.report_submissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()));

DROP POLICY IF EXISTS "Province admins can update province reports" ON public.report_submissions;
CREATE POLICY "Province admins can update province reports" ON public.report_submissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()));

-- statistics_submissions
DROP POLICY IF EXISTS "Admins can update stats" ON public.statistics_submissions;
CREATE POLICY "Admins can update stats" ON public.statistics_submissions
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "District admins can update district stats" ON public.statistics_submissions;
CREATE POLICY "District admins can update district stats" ON public.statistics_submissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()));

DROP POLICY IF EXISTS "Province admins can update province stats" ON public.statistics_submissions;
CREATE POLICY "Province admins can update province stats" ON public.statistics_submissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()));

-- schools: re-add WITH CHECK explicitly
DROP POLICY IF EXISTS "District admins can update schools" ON public.schools;
CREATE POLICY "District admins can update schools" ON public.schools
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'district_admin') AND district = public.get_user_district(auth.uid()));

DROP POLICY IF EXISTS "Province admins can update province schools" ON public.schools;
CREATE POLICY "Province admins can update province schools" ON public.schools
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'province_admin') AND province = public.get_user_province(auth.uid()));
