
-- 1) Tighten admin-manage policies to authenticated role
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage deadlines" ON public.deadlines;
CREATE POLICY "Admins can manage deadlines"
ON public.deadlines FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage documents" ON public.center_documents;
CREATE POLICY "Admins can manage documents"
ON public.center_documents FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage schools" ON public.schools;
CREATE POLICY "Admins can manage schools"
ON public.schools FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2) Storage SELECT for district/province admins on school-reports
DROP POLICY IF EXISTS "District admins can view school reports in storage" ON storage.objects;
CREATE POLICY "District admins can view school reports in storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'school-reports'
  AND public.has_role(auth.uid(), 'district_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.district = public.get_user_district(auth.uid())
  )
);

DROP POLICY IF EXISTS "Province admins can view school reports in storage" ON storage.objects;
CREATE POLICY "Province admins can view school reports in storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'school-reports'
  AND public.has_role(auth.uid(), 'province_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.province = public.get_user_province(auth.uid())
  )
);

-- 3) Revoke direct execute on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_school_id(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_district(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_province(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.populate_submission_location() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_self_role_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_sensitive_profile_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_form_data_size() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
-- admin_update_profile_status must remain callable by signed-in users (it self-checks admin role)
GRANT EXECUTE ON FUNCTION public.admin_update_profile_status(uuid, text, text) TO authenticated;
