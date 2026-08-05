import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/sanitizeError';

export type AcademicStatus = 'active' | 'archived';

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: AcademicStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GradeLevel {
  id: string;
  school_id: string;
  name: string;
  display_order: number;
  description: string | null;
  status: AcademicStatus;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  school_id: string;
  grade_level_id: string;
  academic_year_id: string;
  name: string;
  capacity: number;
  homeroom_teacher_id: string | null;
  status: AcademicStatus;
  created_at: string;
  updated_at: string;
}

export interface SectionWithRelations extends Section {
  grade_name: string;
  academic_year_name: string;
  /** Placeholder until the enrollment module lands. */
  enrollment_count: number;
}

export interface Subject {
  id: string;
  school_id: string;
  grade_level_id: string | null;
  name: string;
  code: string | null;
  weekly_hours: number;
  description: string | null;
  status: AcademicStatus;
  created_at: string;
  updated_at: string;
}

export interface SubjectWithRelations extends Subject {
  grade_name: string;
}

export interface TeacherAssignment {
  id: string;
  school_id: string;
  teacher_user_id: string;
  subject_id: string;
  section_id: string;
  academic_year_id: string;
  weekly_hours: number;
  notes: string | null;
  status: AcademicStatus;
  created_at: string;
  updated_at: string;
}

export interface TeacherAssignmentWithRelations extends TeacherAssignment {
  teacher_name: string;
  subject_name: string;
  section_name: string;
  grade_name: string;
  academic_year_name: string;
}

export interface SchoolTeacher {
  user_id: string;
  full_name: string;
}

export type StudentStatus = 'active' | 'archived';
export type EnrollmentStatus = 'active' | 'transferred' | 'withdrawn' | 'completed';

export interface Student {
  id: string;
  school_id: string;
  student_code: string;
  full_name: string;
  father_name: string | null;
  gender: 'male' | 'female';
  date_of_birth: string | null;
  national_id: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  address: string | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  school_id: string;
  student_id: string;
  section_id: string;
  academic_year_id: string;
  enrollment_date: string;
  status: EnrollmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentWithRelations extends Enrollment {
  student_name: string;
  student_code: string;
  section_name: string;
  grade_name: string;
  academic_year_name: string;
}

/** School scope + write permission for academic structure data. */
export function useAcademicScope() {
  const { profile, role } = useAuth();
  const schoolId = profile?.school_id ?? null;
  const canManage = role === 'principal' || role === 'admin' || role === 'ministry_admin';
  return { schoolId, canManage, role };
}

export const academicKeys = {
  years: (schoolId: string | null) => ['academic-years', schoolId] as const,
  grades: (schoolId: string | null) => ['grade-levels', schoolId] as const,
  sections: (schoolId: string | null) => ['sections', schoolId] as const,
  subjects: (schoolId: string | null) => ['subjects', schoolId] as const,
  assignments: (schoolId: string | null) => ['teacher-assignments', schoolId] as const,
  teachers: (schoolId: string | null) => ['school-teachers', schoolId] as const,
  students: (schoolId: string | null) => ['students', schoolId] as const,
  enrollments: (schoolId: string | null) => ['enrollments', schoolId] as const,
};



export function useAcademicYears() {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: academicKeys.years(schoolId),
    enabled: !!schoolId,
    queryFn: async (): Promise<AcademicYear[]> => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', schoolId!)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcademicYear[];
    },
  });
}

export function useGradeLevels() {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: academicKeys.grades(schoolId),
    enabled: !!schoolId,
    queryFn: async (): Promise<GradeLevel[]> => {
      const { data, error } = await supabase
        .from('grade_levels')
        .select('*')
        .eq('school_id', schoolId!)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as GradeLevel[];
    },
  });
}

export function useSections() {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: academicKeys.sections(schoolId),
    enabled: !!schoolId,
    queryFn: async (): Promise<SectionWithRelations[]> => {
      const [{ data, error }, { data: enrolled, error: enrollError }] = await Promise.all([
        supabase
          .from('sections')
          .select('*, grade_levels(name), academic_years(name)')
          .eq('school_id', schoolId!)
          .order('created_at', { ascending: false }),
        supabase
          .from('enrollments')
          .select('section_id')
          .eq('school_id', schoolId!)
          .eq('status', 'active'),
      ]);
      if (error) throw error;
      if (enrollError) throw enrollError;
      const counts = new Map<string, number>();
      for (const row of enrolled ?? []) {
        counts.set(row.section_id, (counts.get(row.section_id) ?? 0) + 1);
      }
      return (data ?? []).map((row: any) => ({
        ...(row as Section),
        grade_name: row.grade_levels?.name ?? '—',
        academic_year_name: row.academic_years?.name ?? '—',
        enrollment_count: counts.get(row.id) ?? 0,
      }));

    },
  });
}

export function useSubjects() {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: academicKeys.subjects(schoolId),
    enabled: !!schoolId,
    queryFn: async (): Promise<SubjectWithRelations[]> => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*, grade_levels(name)')
        .eq('school_id', schoolId!)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...(row as Subject),
        grade_name: row.grade_levels?.name ?? 'عمومی',
      }));
    },
  });
}

/** Teachers and principals belonging to the current school (assignment targets). */
export function useSchoolTeachers() {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: academicKeys.teachers(schoolId),
    enabled: !!schoolId,
    queryFn: async (): Promise<SchoolTeacher[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .eq('school_id', schoolId!)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .filter((p: any) => p.role === 'teacher' || p.role === 'principal' || p.role === 'school')
        .map((p: any) => ({ user_id: p.user_id, full_name: p.full_name || 'بدون نام' }));
    },
  });
}

export function useTeacherAssignments() {
  const { schoolId } = useAcademicScope();
  const { data: teachers = [] } = useSchoolTeachers();
  return useQuery({
    queryKey: [...academicKeys.assignments(schoolId), teachers.length],
    enabled: !!schoolId,
    queryFn: async (): Promise<TeacherAssignmentWithRelations[]> => {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select('*, subjects(name), sections(name, grade_levels(name)), academic_years(name)')
        .eq('school_id', schoolId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const names = new Map(teachers.map((t) => [t.user_id, t.full_name]));
      return (data ?? []).map((row: any) => ({
        ...(row as TeacherAssignment),
        teacher_name: names.get(row.teacher_user_id) ?? 'نامشخص',
        subject_name: row.subjects?.name ?? '—',
        section_name: row.sections?.name ?? '—',
        grade_name: row.sections?.grade_levels?.name ?? '—',
        academic_year_name: row.academic_years?.name ?? '—',
      }));
    },
  });
}

export function useStudents() {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: academicKeys.students(schoolId),
    enabled: !!schoolId,
    queryFn: async (): Promise<Student[]> => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId!)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });
}

export function useEnrollments() {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: academicKeys.enrollments(schoolId),
    enabled: !!schoolId,
    queryFn: async (): Promise<EnrollmentWithRelations[]> => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, students(full_name, student_code), sections(name, grade_levels(name)), academic_years(name)')
        .eq('school_id', schoolId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...(row as Enrollment),
        student_name: row.students?.full_name ?? 'نامشخص',
        student_code: row.students?.student_code ?? '—',
        section_name: row.sections?.name ?? '—',
        grade_name: row.sections?.grade_levels?.name ?? '—',
        academic_year_name: row.academic_years?.name ?? '—',
      }));
    },
  });
}

type TableName =
  | 'academic_years'
  | 'grade_levels'
  | 'sections'
  | 'subjects'
  | 'teacher_assignments'
  | 'students'
  | 'enrollments'
  | 'assessments';

/** Generic create/update/delete for the academic tables with toasts + cache invalidation. */
export function useAcademicMutation(table: TableName) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { schoolId } = useAcademicScope();

  const key =
    table === 'academic_years'
      ? academicKeys.years(schoolId)
      : table === 'grade_levels'
        ? academicKeys.grades(schoolId)
        : table === 'subjects'
          ? academicKeys.subjects(schoolId)
          : table === 'teacher_assignments'
            ? academicKeys.assignments(schoolId)
            : table === 'students'
              ? academicKeys.students(schoolId)
              : table === 'enrollments'
                ? academicKeys.enrollments(schoolId)
                : table === 'assessments'
                  ? attendanceKeys.assessments(schoolId)
                  : academicKeys.sections(schoolId);



  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: academicKeys.assignments(schoolId) });
    if (table !== 'sections') qc.invalidateQueries({ queryKey: academicKeys.sections(schoolId) });
    if (table === 'students') qc.invalidateQueries({ queryKey: academicKeys.enrollments(schoolId) });
  };



  const onError = (error: unknown) =>
    toast({ title: 'خطا', description: sanitizeError(error), variant: 'destructive' });

  const save = useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Record<string, unknown> }) => {
      if (!schoolId) throw new Error('مکتب مشخص نیست');
      if (id) {
        const { error } = await supabase.from(table).update(values as never).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert({ ...values, school_id: schoolId } as never);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      invalidate();
      toast({ title: vars.id ? 'با موفقیت به‌روزرسانی شد' : 'با موفقیت ثبت شد' });
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'حذف شد' });
    },
    onError,
  });

  return { save, remove };
}

// ============================================================
// Phase 3D — Attendance
// ============================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  school_id: string;
  section_id: string;
  student_id: string;
  academic_year_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type AssessmentTerm = 'term1' | 'term2' | 'final';

export interface Assessment {
  id: string;
  school_id: string;
  section_id: string;
  subject_id: string;
  academic_year_id: string;
  title: string;
  term: AssessmentTerm;
  assessment_date: string;
  max_score: number;
  weight: number;
  status: AcademicStatus;
  created_at: string;
  updated_at: string;
}

export interface AssessmentWithRelations extends Assessment {
  subject_name: string;
  section_name: string;
  grade_name: string;
  academic_year_name: string;
}

export interface Mark {
  id: string;
  school_id: string;
  assessment_id: string;
  student_id: string;
  score: number | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export const attendanceKeys = {
  day: (schoolId: string | null, sectionId: string | null, date: string) =>
    ['attendance', schoolId, sectionId, date] as const,
  range: (schoolId: string | null, sectionId: string | null) =>
    ['attendance-range', schoolId, sectionId] as const,
  assessments: (schoolId: string | null) => ['assessments', schoolId] as const,
  marks: (assessmentId: string | null) => ['marks', assessmentId] as const,
  reportCard: (sectionId: string | null, term: string) => ['report-card', sectionId, term] as const,
};

/** Students actively enrolled in a section (roster for attendance & marks). */
export function useSectionRoster(sectionId: string | null) {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: ['section-roster', schoolId, sectionId],
    enabled: !!schoolId && !!sectionId,
    queryFn: async (): Promise<{ student_id: string; full_name: string; student_code: string }[]> => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('student_id, students(full_name, student_code)')
        .eq('school_id', schoolId!)
        .eq('section_id', sectionId!)
        .eq('status', 'active');
      if (error) throw error;
      return (data ?? [])
        .map((row: any) => ({
          student_id: row.student_id,
          full_name: row.students?.full_name ?? 'نامشخص',
          student_code: row.students?.student_code ?? '—',
        }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'fa'));
    },
  });
}

export function useAttendance(sectionId: string | null, date: string) {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: attendanceKeys.day(schoolId, sectionId, date),
    enabled: !!schoolId && !!sectionId && !!date,
    queryFn: async (): Promise<AttendanceRecord[]> => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('section_id', sectionId!)
        .eq('attendance_date', date);
      if (error) throw error;
      return (data ?? []) as AttendanceRecord[];
    },
  });
}

/** Bulk upsert of a whole section's attendance for one day. */
export function useSaveAttendance(sectionId: string | null, date: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { schoolId } = useAcademicScope();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rows: { student_id: string; status: AttendanceStatus; note?: string | null; academic_year_id: string }[]) => {
      if (!schoolId || !sectionId) throw new Error('بخش مشخص نیست');
      const payload = rows.map((r) => ({
        school_id: schoolId,
        section_id: sectionId,
        student_id: r.student_id,
        academic_year_id: r.academic_year_id,
        attendance_date: date,
        status: r.status,
        note: r.note ?? null,
        recorded_by: user?.id ?? null,
      }));
      const { error } = await supabase
        .from('attendance_records')
        .upsert(payload as never, { onConflict: 'student_id,section_id,attendance_date' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.day(schoolId, sectionId, date) });
      qc.invalidateQueries({ queryKey: attendanceKeys.range(schoolId, sectionId) });
      toast({ title: 'حاضری ثبت شد' });
    },
    onError: (e) => toast({ title: 'خطا', description: sanitizeError(e), variant: 'destructive' }),
  });
}

/** Attendance summary per student for a section over a date range. */
export function useAttendanceSummary(sectionId: string | null, from: string, to: string) {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: [...attendanceKeys.range(schoolId, sectionId), from, to],
    enabled: !!schoolId && !!sectionId && !!from && !!to,
    queryFn: async (): Promise<Record<string, Record<AttendanceStatus, number>>> => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('student_id, status')
        .eq('school_id', schoolId!)
        .eq('section_id', sectionId!)
        .gte('attendance_date', from)
        .lte('attendance_date', to);
      if (error) throw error;
      const summary: Record<string, Record<AttendanceStatus, number>> = {};
      for (const row of (data ?? []) as any[]) {
        summary[row.student_id] ??= { present: 0, absent: 0, late: 0, excused: 0 };
        summary[row.student_id][row.status as AttendanceStatus] += 1;
      }
      return summary;
    },
  });
}

// ============================================================
// Phase 3E — Assessments, marks & report cards
// ============================================================

export function useAssessments() {
  const { schoolId } = useAcademicScope();
  return useQuery({
    queryKey: attendanceKeys.assessments(schoolId),
    enabled: !!schoolId,
    queryFn: async (): Promise<AssessmentWithRelations[]> => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*, subjects(name), sections(name, grade_levels(name)), academic_years(name)')
        .eq('school_id', schoolId!)
        .order('assessment_date', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...(row as Assessment),
        subject_name: row.subjects?.name ?? '—',
        section_name: row.sections?.name ?? '—',
        grade_name: row.sections?.grade_levels?.name ?? '—',
        academic_year_name: row.academic_years?.name ?? '—',
      }));
    },
  });
}

export function useMarks(assessmentId: string | null) {
  return useQuery({
    queryKey: attendanceKeys.marks(assessmentId),
    enabled: !!assessmentId,
    queryFn: async (): Promise<Mark[]> => {
      const { data, error } = await supabase
        .from('marks')
        .select('*')
        .eq('assessment_id', assessmentId!);
      if (error) throw error;
      return (data ?? []) as Mark[];
    },
  });
}

export function useSaveMarks(assessmentId: string | null) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { schoolId } = useAcademicScope();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rows: { student_id: string; score: number | null; remark?: string | null }[]) => {
      if (!schoolId || !assessmentId) throw new Error('امتحان مشخص نیست');
      const payload = rows.map((r) => ({
        school_id: schoolId,
        assessment_id: assessmentId,
        student_id: r.student_id,
        score: r.score,
        remark: r.remark ?? null,
        recorded_by: user?.id ?? null,
      }));
      const { error } = await supabase
        .from('marks')
        .upsert(payload as never, { onConflict: 'assessment_id,student_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.marks(assessmentId) });
      qc.invalidateQueries({ queryKey: ['report-card'] });
      toast({ title: 'نمرات ثبت شد' });
    },
    onError: (e) => toast({ title: 'خطا', description: sanitizeError(e), variant: 'destructive' }),
  });
}

export interface ReportCardSubject {
  subject_id: string;
  subject_name: string;
  earned: number;
  possible: number;
  percent: number;
}

export interface ReportCardRow {
  student_id: string;
  student_name: string;
  student_code: string;
  subjects: ReportCardSubject[];
  average: number | null;
}

/** Weighted per-subject averages for every student in a section for one term. */
export function useReportCard(sectionId: string | null, term: string) {
  const { schoolId } = useAcademicScope();
  const { data: roster = [] } = useSectionRoster(sectionId);

  return useQuery({
    queryKey: [...attendanceKeys.reportCard(sectionId, term), roster.length],
    enabled: !!schoolId && !!sectionId,
    queryFn: async (): Promise<ReportCardRow[]> => {
      let query = supabase
        .from('assessments')
        .select('id, subject_id, max_score, weight, term, subjects(name)')
        .eq('school_id', schoolId!)
        .eq('section_id', sectionId!)
        .eq('status', 'active');
      if (term !== 'all') query = query.eq('term', term);
      const { data: assessments, error } = await query;
      if (error) throw error;

      const ids = (assessments ?? []).map((a: any) => a.id);
      let marks: any[] = [];
      if (ids.length) {
        const { data: markRows, error: markError } = await supabase
          .from('marks')
          .select('assessment_id, student_id, score')
          .in('assessment_id', ids);
        if (markError) throw markError;
        marks = markRows ?? [];
      }

      const byAssessment = new Map((assessments ?? []).map((a: any) => [a.id, a]));
      const acc = new Map<string, Map<string, { name: string; earned: number; possible: number }>>();

      for (const m of marks) {
        if (m.score === null || m.score === undefined) continue;
        const a: any = byAssessment.get(m.assessment_id);
        if (!a) continue;
        const perStudent = acc.get(m.student_id) ?? new Map();
        const cur = perStudent.get(a.subject_id) ?? { name: a.subjects?.name ?? '—', earned: 0, possible: 0 };
        cur.earned += Number(m.score) * Number(a.weight);
        cur.possible += Number(a.max_score) * Number(a.weight);
        perStudent.set(a.subject_id, cur);
        acc.set(m.student_id, perStudent);
      }

      return roster.map((student) => {
        const perStudent = acc.get(student.student_id);
        const subjects: ReportCardSubject[] = perStudent
          ? Array.from(perStudent.entries()).map(([subject_id, v]) => ({
              subject_id,
              subject_name: v.name,
              earned: v.earned,
              possible: v.possible,
              percent: v.possible > 0 ? (v.earned / v.possible) * 100 : 0,
            }))
          : [];
        const average = subjects.length
          ? subjects.reduce((s, x) => s + x.percent, 0) / subjects.length
          : null;
        return {
          student_id: student.student_id,
          student_name: student.full_name,
          student_code: student.student_code,
          subjects,
          average,
        };
      });
    },
  });
}
