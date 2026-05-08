
-- 1. Remove broad storage SELECT/INSERT policies on school-reports
DROP POLICY IF EXISTS "Authenticated users can view school reports" ON storage.objects;
DROP POLICY IF EXISTS "School users can upload reports" ON storage.objects;

-- 2. Fix storage UPDATE policy: must use school_id, not auth.uid()
DROP POLICY IF EXISTS "Schools can update own reports in storage" ON storage.objects;
CREATE POLICY "Schools can update own reports in storage"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'school-reports'
  AND (storage.foldername(name))[1] = (public.get_user_school_id(auth.uid()))::text
)
WITH CHECK (
  bucket_id = 'school-reports'
  AND (storage.foldername(name))[1] = (public.get_user_school_id(auth.uid()))::text
);

-- 3. Drop insecure approve_user / reject_user RPCs (if they exist)
DROP FUNCTION IF EXISTS public.approve_user(uuid);
DROP FUNCTION IF EXISTS public.approve_user(uuid, text);
DROP FUNCTION IF EXISTS public.reject_user(uuid);
DROP FUNCTION IF EXISTS public.reject_user(uuid, text);

-- 4. Tighten schools SELECT policy
DROP POLICY IF EXISTS "Schools viewable by authenticated users" ON public.schools;
CREATE POLICY "Schools viewable by authenticated users"
ON public.schools FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR (public.has_role(auth.uid(), 'district_admin'::public.app_role) AND district = public.get_user_district(auth.uid()))
  OR (public.has_role(auth.uid(), 'province_admin'::public.app_role) AND province = public.get_user_province(auth.uid()))
  OR id = public.get_user_school_id(auth.uid())
);

-- 5. Re-scope school submission policies from public to authenticated
-- form_submissions
DROP POLICY IF EXISTS "Schools can view own forms" ON public.form_submissions;
CREATE POLICY "Schools can view own forms" ON public.form_submissions
FOR SELECT TO authenticated USING (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Schools can insert own forms" ON public.form_submissions;
CREATE POLICY "Schools can insert own forms" ON public.form_submissions
FOR INSERT TO authenticated WITH CHECK (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Schools can update own forms" ON public.form_submissions;
CREATE POLICY "Schools can update own forms" ON public.form_submissions
FOR UPDATE TO authenticated USING (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all forms" ON public.form_submissions;
CREATE POLICY "Admins can view all forms" ON public.form_submissions
FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update forms" ON public.form_submissions;
CREATE POLICY "Admins can update forms" ON public.form_submissions
FOR UPDATE TO authenticated USING (public.is_admin());

-- statistics_submissions
DROP POLICY IF EXISTS "Schools can view own stats" ON public.statistics_submissions;
CREATE POLICY "Schools can view own stats" ON public.statistics_submissions
FOR SELECT TO authenticated USING (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Schools can insert own stats" ON public.statistics_submissions;
CREATE POLICY "Schools can insert own stats" ON public.statistics_submissions
FOR INSERT TO authenticated WITH CHECK (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Schools can update own stats" ON public.statistics_submissions;
CREATE POLICY "Schools can update own stats" ON public.statistics_submissions
FOR UPDATE TO authenticated USING (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all stats" ON public.statistics_submissions;
CREATE POLICY "Admins can view all stats" ON public.statistics_submissions
FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update stats" ON public.statistics_submissions;
CREATE POLICY "Admins can update stats" ON public.statistics_submissions
FOR UPDATE TO authenticated USING (public.is_admin());

-- report_submissions
DROP POLICY IF EXISTS "Schools can view own reports" ON public.report_submissions;
CREATE POLICY "Schools can view own reports" ON public.report_submissions
FOR SELECT TO authenticated USING (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Schools can insert own reports" ON public.report_submissions;
CREATE POLICY "Schools can insert own reports" ON public.report_submissions
FOR INSERT TO authenticated WITH CHECK (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Schools can delete own reports" ON public.report_submissions;
CREATE POLICY "Schools can delete own reports" ON public.report_submissions
FOR DELETE TO authenticated USING (school_id = public.get_user_school_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all reports" ON public.report_submissions;
CREATE POLICY "Admins can view all reports" ON public.report_submissions
FOR SELECT TO authenticated USING (public.is_admin());

-- profiles & user_roles - re-scope to authenticated
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. Revoke EXECUTE on internal SECURITY DEFINER helpers from anon/authenticated.
-- They are still callable from inside RLS policies and other definer functions.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_school_id(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_district(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_province(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.populate_submission_location() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_self_role_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_sensitive_profile_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_form_data_size() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.admin_update_profile_status(uuid, text, text) TO authenticated;
