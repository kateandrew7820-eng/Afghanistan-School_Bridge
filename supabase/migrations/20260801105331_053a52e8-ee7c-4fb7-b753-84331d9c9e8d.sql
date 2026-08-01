-- ACADEMIC YEARS
CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_years_status_chk CHECK (status IN ('active','archived')),
  CONSTRAINT academic_years_dates_chk CHECK (end_date > start_date),
  CONSTRAINT academic_years_name_unique UNIQUE (school_id, name)
);
CREATE UNIQUE INDEX academic_years_one_active_per_school
  ON public.academic_years (school_id) WHERE status = 'active';
CREATE INDEX academic_years_school_idx ON public.academic_years (school_id, start_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- GRADE LEVELS
CREATE TABLE public.grade_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT grade_levels_status_chk CHECK (status IN ('active','archived')),
  CONSTRAINT grade_levels_name_unique UNIQUE (school_id, name)
);
CREATE INDEX grade_levels_school_order_idx ON public.grade_levels (school_id, display_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_levels TO authenticated;
GRANT ALL ON public.grade_levels TO service_role;
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;

-- SECTIONS
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_level_id uuid NOT NULL REFERENCES public.grade_levels(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 30,
  homeroom_teacher_id uuid,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sections_status_chk CHECK (status IN ('active','archived')),
  CONSTRAINT sections_capacity_chk CHECK (capacity > 0),
  CONSTRAINT sections_name_unique UNIQUE (grade_level_id, academic_year_id, name)
);
CREATE INDEX sections_school_idx ON public.sections (school_id);
CREATE INDEX sections_grade_idx ON public.sections (grade_level_id);
CREATE INDEX sections_year_idx ON public.sections (academic_year_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- helper: can the current user manage academic data for a school
CREATE OR REPLACE FUNCTION public.can_manage_academics(_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _school_id IS NOT NULL AND (
    public.is_admin()
    OR (public.has_role(auth.uid(), 'principal') AND _school_id = public.get_user_school_id(auth.uid()))
  )
$$;
REVOKE ALL ON FUNCTION public.can_manage_academics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_academics(uuid) TO authenticated, service_role;

-- overlap guard for active academic years
CREATE OR REPLACE FUNCTION public.prevent_overlapping_active_years()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND EXISTS (
    SELECT 1 FROM public.academic_years ay
    WHERE ay.school_id = NEW.school_id
      AND ay.id <> NEW.id
      AND ay.status = 'active'
      AND NEW.start_date <= ay.end_date
      AND NEW.end_date >= ay.start_date
  ) THEN
    RAISE EXCEPTION 'overlapping active academic year';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER academic_years_overlap_guard
  BEFORE INSERT OR UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.prevent_overlapping_active_years();

CREATE TRIGGER academic_years_set_updated_at BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER grade_levels_set_updated_at BEFORE UPDATE ON public.grade_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER sections_set_updated_at BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- POLICIES
CREATE POLICY "academic_years_select" ON public.academic_years FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "academic_years_insert" ON public.academic_years FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "academic_years_update" ON public.academic_years FOR UPDATE TO authenticated
  USING (public.can_manage_academics(school_id)) WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "academic_years_delete" ON public.academic_years FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE POLICY "grade_levels_select" ON public.grade_levels FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "grade_levels_insert" ON public.grade_levels FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "grade_levels_update" ON public.grade_levels FOR UPDATE TO authenticated
  USING (public.can_manage_academics(school_id)) WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "grade_levels_delete" ON public.grade_levels FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE POLICY "sections_select" ON public.sections FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "sections_insert" ON public.sections FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "sections_update" ON public.sections FOR UPDATE TO authenticated
  USING (public.can_manage_academics(school_id)) WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "sections_delete" ON public.sections FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));