CREATE OR REPLACE FUNCTION public.can_record_academics(_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _school_id IS NOT NULL AND (
    public.can_manage_academics(_school_id)
    OR (public.has_role(auth.uid(), 'teacher') AND _school_id = public.get_user_school_id(auth.uid()))
  )
$$;

REVOKE EXECUTE ON FUNCTION public.can_record_academics(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_record_academics(uuid) TO authenticated, service_role;

-- ============ attendance_records ============
CREATE TABLE public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  note text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_status_check CHECK (status IN ('present','absent','late','excused'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "attendance_insert" ON public.attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (public.can_record_academics(school_id));

CREATE POLICY "attendance_update" ON public.attendance_records
  FOR UPDATE TO authenticated
  USING (public.can_record_academics(school_id))
  WITH CHECK (public.can_record_academics(school_id));

CREATE POLICY "attendance_delete" ON public.attendance_records
  FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE UNIQUE INDEX attendance_student_day_uniq
  ON public.attendance_records (student_id, section_id, attendance_date);
CREATE INDEX attendance_section_date_idx ON public.attendance_records (section_id, attendance_date);
CREATE INDEX attendance_school_idx ON public.attendance_records (school_id, attendance_date);

CREATE TRIGGER attendance_set_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ assessments ============
CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  title text NOT NULL,
  term text NOT NULL DEFAULT 'term1',
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  max_score numeric NOT NULL DEFAULT 100,
  weight numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assessments_term_check CHECK (term IN ('term1','term2','final')),
  CONSTRAINT assessments_status_check CHECK (status IN ('active','archived')),
  CONSTRAINT assessments_max_score_check CHECK (max_score > 0),
  CONSTRAINT assessments_weight_check CHECK (weight > 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments_select" ON public.assessments
  FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "assessments_insert" ON public.assessments
  FOR INSERT TO authenticated
  WITH CHECK (public.can_record_academics(school_id));

CREATE POLICY "assessments_update" ON public.assessments
  FOR UPDATE TO authenticated
  USING (public.can_record_academics(school_id))
  WITH CHECK (public.can_record_academics(school_id));

CREATE POLICY "assessments_delete" ON public.assessments
  FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE INDEX assessments_school_idx ON public.assessments (school_id, academic_year_id);
CREATE INDEX assessments_section_idx ON public.assessments (section_id, subject_id);

CREATE TRIGGER assessments_set_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ marks ============
CREATE TABLE public.marks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score numeric,
  remark text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marks_score_check CHECK (score IS NULL OR score >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marks TO authenticated;
GRANT ALL ON public.marks TO service_role;

ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marks_select" ON public.marks
  FOR SELECT TO authenticated
  USING (public.is_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "marks_insert" ON public.marks
  FOR INSERT TO authenticated
  WITH CHECK (public.can_record_academics(school_id));

CREATE POLICY "marks_update" ON public.marks
  FOR UPDATE TO authenticated
  USING (public.can_record_academics(school_id))
  WITH CHECK (public.can_record_academics(school_id));

CREATE POLICY "marks_delete" ON public.marks
  FOR DELETE TO authenticated
  USING (public.can_manage_academics(school_id));

CREATE UNIQUE INDEX marks_assessment_student_uniq ON public.marks (assessment_id, student_id);
CREATE INDEX marks_school_idx ON public.marks (school_id);
CREATE INDEX marks_student_idx ON public.marks (student_id);

CREATE TRIGGER marks_set_updated_at
  BEFORE UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();