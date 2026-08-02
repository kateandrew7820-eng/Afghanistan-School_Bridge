CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text,
  weekly_hours integer NOT NULL DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subjects_status_check CHECK (status IN ('active','archived')),
  CONSTRAINT subjects_weekly_hours_check CHECK (weekly_hours >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX subjects_school_name_key ON public.subjects (school_id, lower(name));
CREATE UNIQUE INDEX subjects_school_code_key ON public.subjects (school_id, lower(code)) WHERE code IS NOT NULL;
CREATE INDEX idx_subjects_school ON public.subjects (school_id);
CREATE INDEX idx_subjects_grade ON public.subjects (grade_level_id);

CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "subjects_insert" ON public.subjects FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "subjects_update" ON public.subjects FOR UPDATE TO authenticated
  USING (public.can_manage_academics(school_id)) WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "subjects_delete" ON public.subjects FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  weekly_hours integer NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_assignments_status_check CHECK (status IN ('active','archived')),
  CONSTRAINT teacher_assignments_weekly_hours_check CHECK (weekly_hours >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX teacher_assignments_unique_key
  ON public.teacher_assignments (teacher_user_id, subject_id, section_id, academic_year_id);
CREATE INDEX idx_teacher_assignments_school ON public.teacher_assignments (school_id);
CREATE INDEX idx_teacher_assignments_teacher ON public.teacher_assignments (teacher_user_id);
CREATE INDEX idx_teacher_assignments_section ON public.teacher_assignments (section_id);
CREATE INDEX idx_teacher_assignments_year ON public.teacher_assignments (academic_year_id);

CREATE POLICY "teacher_assignments_select" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "teacher_assignments_insert" ON public.teacher_assignments FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "teacher_assignments_update" ON public.teacher_assignments FOR UPDATE TO authenticated
  USING (public.can_manage_academics(school_id)) WITH CHECK (public.can_manage_academics(school_id));
CREATE POLICY "teacher_assignments_delete" ON public.teacher_assignments FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE TRIGGER update_teacher_assignments_updated_at BEFORE UPDATE ON public.teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();