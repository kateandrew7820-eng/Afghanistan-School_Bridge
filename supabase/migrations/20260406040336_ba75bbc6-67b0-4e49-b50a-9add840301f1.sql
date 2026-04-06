
-- Allow district admins to INSERT schools in their own district
CREATE POLICY "District admins can insert schools"
ON public.schools
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'district_admin'::app_role)
  AND district = public.get_user_district(auth.uid())
);

-- Allow district admins to UPDATE schools in their own district
CREATE POLICY "District admins can update schools"
ON public.schools
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'district_admin'::app_role)
  AND district = public.get_user_district(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'district_admin'::app_role)
  AND district = public.get_user_district(auth.uid())
);

-- Allow province admins to view and update schools in their province (for review/confirm)
CREATE POLICY "Province admins can view province schools"
ON public.schools
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'province_admin'::app_role)
  AND province = public.get_user_province(auth.uid())
);

CREATE POLICY "Province admins can update province schools"
ON public.schools
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'province_admin'::app_role)
  AND province = public.get_user_province(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'province_admin'::app_role)
  AND province = public.get_user_province(auth.uid())
);

-- Allow ministry admins to manage all schools (SELECT already covered by is_admin, add INSERT)
CREATE POLICY "Ministry admins can insert schools"
ON public.schools
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'ministry_admin'::app_role)
);
