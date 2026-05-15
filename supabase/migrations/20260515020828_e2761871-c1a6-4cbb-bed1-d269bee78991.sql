
DROP POLICY IF EXISTS "District admins can view school reports in storage" ON storage.objects;
DROP POLICY IF EXISTS "Province admins can view school reports in storage" ON storage.objects;

CREATE POLICY "District admins can view school reports in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'school-reports'
  AND has_role(auth.uid(), 'district_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.district = get_user_district(auth.uid())
  )
);

CREATE POLICY "Province admins can view school reports in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'school-reports'
  AND has_role(auth.uid(), 'province_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.province = get_user_province(auth.uid())
  )
);

CREATE POLICY "Admins can update center documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'center-documents' AND is_admin())
WITH CHECK (bucket_id = 'center-documents' AND is_admin());
