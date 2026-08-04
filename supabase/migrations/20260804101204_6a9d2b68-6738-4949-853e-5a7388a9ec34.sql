-- ============ students ============
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_code text NOT NULL,
  full_name text NOT NULL,
  father_name text,
  gender text NOT NULL DEFAULT 'male',
  date_of_birth date,
  national_id text,
  guardian_name text,
  guardian_phone text,
  address text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_gender_check CHECK (gender IN ('male','female')),
  CONSTRAINT students_status_check CHECK (status IN ('active','archived'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select" ON public.students
  FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "students_insert" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_academics(school_id));

CREATE POLICY "students_update" ON public.students
  FOR UPDATE TO authenticated
  USING (public.can_manage_academics(school_id))
  WITH CHECK (public.can_manage_academics(school_id));

CREATE POLICY "students_delete" ON public.students
  FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE UNIQUE INDEX students_school_code_uniq
  ON public.students (school_id, lower(student_code));
CREATE INDEX students_school_idx ON public.students (school_id, status);

CREATE TRIGGER students_set_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ enrollments ============
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_status_check CHECK (status IN ('active','transferred','withdrawn','completed'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select" ON public.enrollments
  FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "enrollments_insert" ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_academics(school_id));

CREATE POLICY "enrollments_update" ON public.enrollments
  FOR UPDATE TO authenticated
  USING (public.can_manage_academics(school_id))
  WITH CHECK (public.can_manage_academics(school_id));

CREATE POLICY "enrollments_delete" ON public.enrollments
  FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE UNIQUE INDEX enrollments_active_year_uniq
  ON public.enrollments (student_id, academic_year_id)
  WHERE status = 'active';
CREATE INDEX enrollments_section_idx ON public.enrollments (section_id, status);
CREATE INDEX enrollments_school_idx ON public.enrollments (school_id, academic_year_id);

CREATE TRIGGER enrollments_set_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- capacity guard
CREATE OR REPLACE FUNCTION public.enforce_section_capacity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _cap integer;
  _count integer;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = 'active'
     AND OLD.section_id = NEW.section_id THEN
    RETURN NEW;
  END IF;

  SELECT capacity INTO _cap FROM public.sections WHERE id = NEW.section_id;
  IF _cap IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO _count
  FROM public.enrollments
  WHERE section_id = NEW.section_id
    AND status = 'active'
    AND id <> NEW.id;

  IF _count >= _cap THEN
    RAISE EXCEPTION 'section capacity reached';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enrollments_capacity_guard
  BEFORE INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_section_capacity();