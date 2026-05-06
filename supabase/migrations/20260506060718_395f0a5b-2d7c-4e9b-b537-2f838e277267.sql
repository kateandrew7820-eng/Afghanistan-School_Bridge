
-- 1. Block self role-escalation: non-ministry users cannot change their own profiles.role
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role
     AND NEW.user_id = auth.uid()
     AND NOT public.has_role(auth.uid(), 'ministry_admin') THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_change();

-- 2. Keep profiles.role text in sync with user_roles (highest-priv role wins)
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid;
  _role text;
BEGIN
  _user := COALESCE(NEW.user_id, OLD.user_id);
  SELECT role::text INTO _role
  FROM public.user_roles
  WHERE user_id = _user
  ORDER BY CASE role::text
    WHEN 'ministry_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'province_admin' THEN 3
    WHEN 'district_admin' THEN 4
    WHEN 'principal' THEN 5
    WHEN 'teacher' THEN 6
    ELSE 99 END
  LIMIT 1;

  UPDATE public.profiles
  SET role = COALESCE(_role, role), updated_at = now()
  WHERE user_id = _user;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role_iud ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role_iud
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();

-- 3. Enrich populate_submission_location to also fill province_id / district_id
-- (only if the schools table has those columns populated for the school)
CREATE OR REPLACE FUNCTION public.populate_submission_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_id IS NOT NULL THEN
    SELECT
      COALESCE(NEW.province, s.province),
      COALESCE(NEW.district, s.district)
    INTO NEW.province, NEW.district
    FROM public.schools s
    WHERE s.id = NEW.school_id;
  END IF;
  RETURN NEW;
END;
$$;
