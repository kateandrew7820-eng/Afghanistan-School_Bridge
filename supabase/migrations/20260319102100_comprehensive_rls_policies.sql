-- COMPREHENSIVE RLS POLICIES for Multi-Tier Admin System
-- Supports: school (teacher/principal), district_admin, province_admin, ministry_admin

-- ============================================================================
-- 1. UPDATE ROLE CHECKING FUNCTIONS FOR ALL TIERS
-- ============================================================================

-- Function to check any role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is admin (any tier)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministry_admin', 'province_admin', 'district_admin')
  )
$$;

-- Check if user is at least district admin
CREATE OR REPLACE FUNCTION public.is_district_admin_or_higher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministry_admin', 'province_admin', 'district_admin')
  )
$$;

-- Check if user is at least province admin
CREATE OR REPLACE FUNCTION public.is_province_admin_or_higher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministry_admin', 'province_admin')
  )
$$;

-- Check if user is ministry admin
CREATE OR REPLACE FUNCTION public.is_ministry_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministry_admin')
  )
$$;

-- Get user's role tier
CREATE OR REPLACE FUNCTION public.get_user_role_tier()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ministry_admin')) THEN 'ministry'
    WHEN EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'province_admin') THEN 'province'
    WHEN EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'district_admin') THEN 'district'
    ELSE 'school'
  END;
$$;

-- ============================================================================
-- 2. PROFILES TABLE - TIER-BASED ACCESS
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

-- New policies
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update profiles" ON public.profiles 
  FOR UPDATE USING (public.is_admin());

-- ============================================================================
-- 3. USER_ROLES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can create their own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roles" ON public.user_roles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles 
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- 4. SCHOOLS TABLE - HIERARCHICAL ACCESS
-- ============================================================================

DROP POLICY IF EXISTS "Schools viewable by authenticated users" ON public.schools;
DROP POLICY IF EXISTS "Admins can manage schools" ON public.schools;

CREATE POLICY "Schools viewable by authenticated users" ON public.schools 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "District admins can manage schools in their district" ON public.schools 
  FOR ALL USING (
    public.is_district_admin_or_higher() OR
    -- User's school matches school OR user is assigned to school
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND school_id = schools.id
    )
  );

CREATE POLICY "Ministry admins manage all schools" ON public.schools 
  FOR ALL USING (public.is_ministry_admin());

-- ============================================================================
-- 5. STATISTICS_SUBMISSIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Schools can view own stats" ON public.statistics_submissions;
DROP POLICY IF EXISTS "Schools can insert own stats" ON public.statistics_submissions;
DROP POLICY IF EXISTS "Schools can update own stats" ON public.statistics_submissions;
DROP POLICY IF EXISTS "Admins can view all stats" ON public.statistics_submissions;
DROP POLICY IF EXISTS "Admins can update stats" ON public.statistics_submissions;

CREATE POLICY "Schools can view own stats" ON public.statistics_submissions 
  FOR SELECT USING (
    school_id = public.get_user_school_id(auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Schools can insert own stats" ON public.statistics_submissions 
  FOR INSERT WITH CHECK (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "Schools can update own stats" ON public.statistics_submissions 
  FOR UPDATE USING (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "District admins view district stats" ON public.statistics_submissions 
  FOR SELECT USING (
    public.is_district_admin_or_higher()
    OR school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "District+ admins update stats" ON public.statistics_submissions 
  FOR UPDATE USING (public.is_district_admin_or_higher());

-- ============================================================================
-- 6. REPORT_SUBMISSIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Schools can view own reports" ON public.report_submissions;
DROP POLICY IF EXISTS "Schools can insert own reports" ON public.report_submissions;
DROP POLICY IF EXISTS "Schools can delete own reports" ON public.report_submissions;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.report_submissions;

CREATE POLICY "Schools can view own reports" ON public.report_submissions 
  FOR SELECT USING (
    school_id = public.get_user_school_id(auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Schools can insert own reports" ON public.report_submissions 
  FOR INSERT WITH CHECK (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "Schools can delete own reports" ON public.report_submissions 
  FOR DELETE USING (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "District+ admins view all reports" ON public.report_submissions 
  FOR SELECT USING (public.is_district_admin_or_higher());

-- ============================================================================
-- 7. FORM_SUBMISSIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Schools can view own forms" ON public.form_submissions;
DROP POLICY IF EXISTS "Schools can insert own forms" ON public.form_submissions;
DROP POLICY IF EXISTS "Schools can update own forms" ON public.form_submissions;
DROP POLICY IF EXISTS "Admins can view all forms" ON public.form_submissions;
DROP POLICY IF EXISTS "Admins can update forms" ON public.form_submissions;

CREATE POLICY "Schools can view own forms" ON public.form_submissions 
  FOR SELECT USING (
    school_id = public.get_user_school_id(auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Schools can insert own forms" ON public.form_submissions 
  FOR INSERT WITH CHECK (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "Schools can update own forms" ON public.form_submissions 
  FOR UPDATE USING (
    school_id = public.get_user_school_id(auth.uid())
  );

CREATE POLICY "District+ admins manage forms" ON public.form_submissions 
  FOR ALL USING (public.is_district_admin_or_higher());

-- ============================================================================
-- 8. ANNOUNCEMENTS TABLE - NOW WITH RLS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can delete announcements" ON public.announcements;

CREATE POLICY "Authenticated users can view announcements" ON public.announcements 
  FOR SELECT TO authenticated USING (is_published = true);

CREATE POLICY "Only admins can create announcements" ON public.announcements 
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update announcements" ON public.announcements 
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete announcements" ON public.announcements 
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- 9. CENTER_DOCUMENTS TABLE - NOW WITH RLS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view documents" ON public.center_documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.center_documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.center_documents;
DROP POLICY IF EXISTS "Only admins can upload documents" ON public.center_documents;
DROP POLICY IF EXISTS "Only admins can modify documents" ON public.center_documents;

CREATE POLICY "Authenticated users can view documents" ON public.center_documents 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can upload documents" ON public.center_documents 
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can modify documents" ON public.center_documents 
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete documents" ON public.center_documents 
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- 10. DEADLINES TABLE - NOW WITH RLS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view deadlines" ON public.deadlines;
DROP POLICY IF EXISTS "Admins can manage deadlines" ON public.deadlines;
DROP POLICY IF EXISTS "Authenticated users can view deadlines" ON public.deadlines;
DROP POLICY IF EXISTS "Only admins can create deadlines" ON public.deadlines;
DROP POLICY IF EXISTS "Only admins can modify deadlines" ON public.deadlines;

CREATE POLICY "Authenticated users can view deadlines" ON public.deadlines 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can create deadlines" ON public.deadlines 
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update deadlines" ON public.deadlines 
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete deadlines" ON public.deadlines 
  FOR DELETE USING (public.is_admin());
