
-- ============================================================
-- 1. ADD COLUMNS TO ALL SUBMISSION TABLES
-- ============================================================

ALTER TABLE public.statistics_submissions
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT;

ALTER TABLE public.report_submissions
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT;

ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT;

-- ============================================================
-- 2. BACKFILL EXISTING DATA FROM SCHOOLS TABLE
-- ============================================================

UPDATE public.statistics_submissions ss
SET province = s.province, district = s.district
FROM public.schools s
WHERE ss.school_id = s.id AND (ss.province IS NULL OR ss.district IS NULL);

UPDATE public.report_submissions rs
SET province = s.province, district = s.district
FROM public.schools s
WHERE rs.school_id = s.id AND (rs.province IS NULL OR rs.district IS NULL);

UPDATE public.form_submissions fs
SET province = s.province, district = s.district
FROM public.schools s
WHERE fs.school_id = s.id AND (fs.province IS NULL OR fs.district IS NULL);

-- ============================================================
-- 3. AUTO-POPULATE TRIGGER (fills province/district on INSERT)
-- ============================================================

CREATE OR REPLACE FUNCTION public.populate_submission_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_id IS NOT NULL AND (NEW.province IS NULL OR NEW.district IS NULL) THEN
    SELECT s.province, s.district
    INTO NEW.province, NEW.district
    FROM public.schools s
    WHERE s.id = NEW.school_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stats_location
  BEFORE INSERT ON public.statistics_submissions
  FOR EACH ROW EXECUTE FUNCTION public.populate_submission_location();

CREATE TRIGGER trg_reports_location
  BEFORE INSERT ON public.report_submissions
  FOR EACH ROW EXECUTE FUNCTION public.populate_submission_location();

CREATE TRIGGER trg_forms_location
  BEFORE INSERT ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.populate_submission_location();

-- ============================================================
-- 4. HELPER FUNCTION: get user's district from profile
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_district(_user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT district FROM public.profiles WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_user_province(_user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT province FROM public.profiles WHERE user_id = _user_id
$$;

-- ============================================================
-- 5. RLS POLICIES FOR DISTRICT ADMINS
-- ============================================================

-- statistics_submissions
CREATE POLICY "District admins can view district stats"
  ON public.statistics_submissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'district_admin')
    AND district = public.get_user_district(auth.uid())
  );

CREATE POLICY "District admins can update district stats"
  ON public.statistics_submissions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'district_admin')
    AND district = public.get_user_district(auth.uid())
  );

-- report_submissions
CREATE POLICY "District admins can view district reports"
  ON public.report_submissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'district_admin')
    AND district = public.get_user_district(auth.uid())
  );

CREATE POLICY "District admins can update district reports"
  ON public.report_submissions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'district_admin')
    AND district = public.get_user_district(auth.uid())
  );

-- form_submissions
CREATE POLICY "District admins can view district forms"
  ON public.form_submissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'district_admin')
    AND district = public.get_user_district(auth.uid())
  );

CREATE POLICY "District admins can update district forms"
  ON public.form_submissions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'district_admin')
    AND district = public.get_user_district(auth.uid())
  );

-- ============================================================
-- 6. RLS POLICIES FOR PROVINCE ADMINS
-- ============================================================

-- statistics_submissions
CREATE POLICY "Province admins can view province stats"
  ON public.statistics_submissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'province_admin')
    AND province = public.get_user_province(auth.uid())
  );

CREATE POLICY "Province admins can update province stats"
  ON public.statistics_submissions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'province_admin')
    AND province = public.get_user_province(auth.uid())
  );

-- report_submissions
CREATE POLICY "Province admins can view province reports"
  ON public.report_submissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'province_admin')
    AND province = public.get_user_province(auth.uid())
  );

CREATE POLICY "Province admins can update province reports"
  ON public.report_submissions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'province_admin')
    AND province = public.get_user_province(auth.uid())
  );

-- form_submissions
CREATE POLICY "Province admins can view province forms"
  ON public.form_submissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'province_admin')
    AND province = public.get_user_province(auth.uid())
  );

CREATE POLICY "Province admins can update province forms"
  ON public.form_submissions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'province_admin')
    AND province = public.get_user_province(auth.uid())
  );

-- ============================================================
-- 7. ENABLE REALTIME FOR SUBMISSION TABLES
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.statistics_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_submissions;
