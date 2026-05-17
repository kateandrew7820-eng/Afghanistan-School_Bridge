
-- 1. Storage: fix role + broken join
DROP POLICY IF EXISTS "Admins can update center documents" ON storage.objects;
CREATE POLICY "Admins can update center documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'center-documents' AND public.is_admin())
  WITH CHECK (bucket_id = 'center-documents' AND public.is_admin());

DROP POLICY IF EXISTS "District admins can view school reports in storage" ON storage.objects;
CREATE POLICY "District admins can view school reports in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'school-reports'
    AND public.has_role(auth.uid(), 'district_admin'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.schools s
      WHERE (s.id)::text = (storage.foldername(storage.objects.name))[1]
        AND s.district = public.get_user_district(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Province admins can view school reports in storage" ON storage.objects;
CREATE POLICY "Province admins can view school reports in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'school-reports'
    AND public.has_role(auth.uid(), 'province_admin'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.schools s
      WHERE (s.id)::text = (storage.foldername(storage.objects.name))[1]
        AND s.province = public.get_user_province(auth.uid())
    )
  );

-- 2. Lock down SECURITY DEFINER helpers that should never be called via the API
REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_submission_location() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_sensitive_profile_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_form_data_size() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- admin_update_profile_status must remain callable by signed-in users (it checks admin role inside)
REVOKE EXECUTE ON FUNCTION public.admin_update_profile_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_status(uuid, text, text) TO authenticated;
