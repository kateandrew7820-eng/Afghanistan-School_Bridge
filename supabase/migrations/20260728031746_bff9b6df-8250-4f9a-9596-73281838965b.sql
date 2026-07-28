GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_school_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_district(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_province(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_school_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_district(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_province(uuid) FROM anon;