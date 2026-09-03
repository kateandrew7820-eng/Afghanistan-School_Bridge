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

export interface StudentEnrollmentHistory {
  id: string;
  section_name: string;
  grade_name: string;
  academic_year_name: string;
  enrollment_date: string;
  status: EnrollmentStatus;
  notes: string | null;
}

export interface StudentAttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number | null;
  /** Chronological daily rate (1 = present/excused, 0 otherwise) for the trend line. */
  trend: number[];
}

export interface StudentProfileData {
  student: Student;
  enrollments: StudentEnrollmentHistory[];
  currentEnrollment: StudentEnrollmentHistory | null;
  attendance: StudentAttendanceSummary;
  subjects: ReportCardSubject[];
  average: number | null;
}

/** Everything shown on a single student's profile page, composed from existing academic tables. */
export function useStudentProfile(studentId: string | null) {
  const { schoolId } = useAcademicScope();

  return useQuery({
    queryKey: ['student-profile', schoolId, studentId],
    enabled: !!schoolId && !!studentId,
    queryFn: async (): Promise<StudentProfileData> => {
      const { data: studentRow, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('id', studentId!)
        .maybeSingle();
      if (studentError) throw studentError;
      if (!studentRow) throw new Error('شاگرد یافت نشد');

      const [{ data: enrollmentRows, error: enrollmentError },
             { data: attendanceRows, error: attendanceError },
             { data: markRows, error: markError }] = await Promise.all([
        supabase
          .from('enrollments')
          .select('id, enrollment_date, status, notes, sections(name, grade_levels(name)), academic_years(name)')
          .eq('school_id', schoolId!)
          .eq('student_id', studentId!)
          .order('enrollment_date', { ascending: false }),
        supabase
          .from('attendance_records')
          .select('attendance_date, status')
          .eq('school_id', schoolId!)
          .eq('student_id', studentId!)
          .order('attendance_date', { ascending: true }),
        supabase
          .from('marks')
          .select('score, assessments(subject_id, max_score, weight, subjects(name))')
          .eq('school_id', schoolId!)
          .eq('student_id', studentId!),
      ]);
      if (enrollmentError) throw enrollmentError;
      if (attendanceError) throw attendanceError;
      if (markError) throw markError;

      type EnrollmentJoinRow = {
        id: string;
        enrollment_date: string;
        status: EnrollmentStatus;
        notes: string | null;
        sections: { name: string; grade_levels: { name: string } | null } | null;
        academic_years: { name: string } | null;
      };
      const enrollments: StudentEnrollmentHistory[] = ((enrollmentRows ?? []) as unknown as EnrollmentJoinRow[]).map((row) => ({
        id: row.id,
        section_name: row.sections?.name ?? '—',
        grade_name: row.sections?.grade_levels?.name ?? '—',
        academic_year_name: row.academic_years?.name ?? '—',
        enrollment_date: row.enrollment_date,
        status: row.status as EnrollmentStatus,
        notes: row.notes ?? null,
      }));

      const counts = { present: 0, absent: 0, late: 0, excused: 0 };
      const trend: number[] = [];
      for (const row of (attendanceRows ?? []) as { status: AttendanceStatus }[]) {
        if (row.status in counts) counts[row.status] += 1;
        trend.push(row.status === 'present' || row.status === 'excused' ? 1 : 0);
      }
      const total = counts.present + counts.absent + counts.late + counts.excused;
      const attendance: StudentAttendanceSummary = {
        ...counts,
        total,
        rate: total > 0 ? ((counts.present + counts.excused) / total) * 100 : null,
        trend,
      };

      const bySubject = new Map<string, { name: string; earned: number; possible: number }>();
      type MarkJoinRow = {
        score: number | null;
        assessments: {
          subject_id: string;
          max_score: number;
          weight: number;
          subjects: { name: string } | null;
        } | null;
      };
      for (const row of (markRows ?? []) as unknown as MarkJoinRow[]) {
        const a = row.assessments;
        if (!a || row.score === null || row.score === undefined) continue;
        const cur = bySubject.get(a.subject_id) ?? { name: a.subjects?.name ?? '—', earned: 0, possible: 0 };
        cur.earned += Number(row.score) * Number(a.weight);
        cur.possible += Number(a.max_score) * Number(a.weight);
        bySubject.set(a.subject_id, cur);
      }
      const subjects: ReportCardSubject[] = Array.from(bySubject.entries()).map(([subject_id, v]) => ({
        subject_id,
        subject_name: v.name,
        earned: v.earned,
        possible: v.possible,
        percent: v.possible > 0 ? (v.earned / v.possible) * 100 : 0,
      }));
      const average = subjects.length
        ? subjects.reduce((s, x) => s + x.percent, 0) / subjects.length
        : null;

      return {
        student: studentRow as Student,
        enrollments,
        currentEnrollment: enrollments.find((e) => e.status === 'active') ?? null,
        attendance,
        subjects,
        average,
      };
    },
  });
}

export type GradeBandVariant = 'success' | 'info' | 'warning' | 'destructive';

/** Shared grade banding used by report cards and the student profile. */
export function gradeBand(percent: number): { label: string; variant: GradeBandVariant } {
  if (percent >= 80) return { label: 'عالی', variant: 'success' };
  if (percent >= 65) return { label: 'خوب', variant: 'info' };
  if (percent >= 50) return { label: 'قابل قبول', variant: 'warning' };
  return { label: 'ناکام', variant: 'destructive' };
}

// ============================================================
// Phase 4A — Class (section) dashboard
// ============================================================

export interface SectionDashboardStudent {
  student_id: string;
  full_name: string;
  student_code: string;
  gender: string;
  attendance_rate: number | null;
  attendance_days: number;
  average: number | null;
}

export interface SectionSubjectAverage {
  subject_id: string;
  subject_name: string;
  percent: number;
  graded_students: number;
}

export interface SectionActivityItem {
  id: string;
  kind: 'attendance' | 'assessment';
  title: string;
  description: string;
  date: string;
}

export interface SectionDashboardData {
  section: SectionWithRelations;
  homeroom_teacher_name: string | null;
  students: SectionDashboardStudent[];
  total_students: number;
  male_students: number;
  female_students: number;
  today: { date: string; recorded: boolean } & Record<AttendanceStatus, number>;
  overall_attendance_rate: number | null;
  attendance_trend: number[];
  subject_averages: SectionSubjectAverage[];
  class_average: number | null;
  top_students: SectionDashboardStudent[];
  at_risk_students: (SectionDashboardStudent & { reasons: string[] })[];
  activity: SectionActivityItem[];
}

/** Aggregated analytics for a single class/section, composed from existing academic tables. */
export function useSectionDashboard(sectionId: string | null) {
  const { schoolId } = useAcademicScope();
  const { data: teachers = [] } = useSchoolTeachers();

  return useQuery({
    queryKey: ['section-dashboard', schoolId, sectionId, teachers.length],
    enabled: !!schoolId && !!sectionId,
    queryFn: async (): Promise<SectionDashboardData> => {
      const today = new Date().toISOString().slice(0, 10);

      const { data: sectionRow, error: sectionError } = await supabase
        .from('sections')
        .select('*, grade_levels(name), academic_years(name)')
        .eq('school_id', schoolId!)
        .eq('id', sectionId!)
        .maybeSingle();
      if (sectionError) throw sectionError;
      if (!sectionRow) throw new Error('بخش یافت نشد');

      const [{ data: enrollmentRows, error: enrollmentError },
             { data: attendanceRows, error: attendanceError },
             { data: assessmentRows, error: assessmentError }] = await Promise.all([
        supabase
          .from('enrollments')
          .select('student_id, students(full_name, student_code, gender)')
          .eq('school_id', schoolId!)
          .eq('section_id', sectionId!)
          .eq('status', 'active'),
        supabase
          .from('attendance_records')
          .select('student_id, status, attendance_date')
          .eq('school_id', schoolId!)
          .eq('section_id', sectionId!)
          .order('attendance_date', { ascending: true }),
        supabase
          .from('assessments')
          .select('id, title, subject_id, max_score, weight, term, assessment_date, subjects(name)')
          .eq('school_id', schoolId!)
          .eq('section_id', sectionId!)
          .eq('status', 'active')
          .order('assessment_date', { ascending: false }),
      ]);
      if (enrollmentError) throw enrollmentError;
      if (attendanceError) throw attendanceError;
      if (assessmentError) throw assessmentError;

      type EnrollmentRow = {
        student_id: string;
        students: { full_name: string; student_code: string; gender: string } | null;
      };
      const roster = ((enrollmentRows ?? []) as unknown as EnrollmentRow[])
        .map((row) => ({
          student_id: row.student_id,
          full_name: row.students?.full_name ?? 'نامشخص',
          student_code: row.students?.student_code ?? '—',
          gender: row.students?.gender ?? 'unknown',
        }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'fa'));

      const assessments = (assessmentRows ?? []) as unknown as {
        id: string; title: string; subject_id: string; max_score: number;
        weight: number; term: AssessmentTerm; assessment_date: string;
        subjects: { name: string } | null;
      }[];

      let marks: { assessment_id: string; student_id: string; score: number | null }[] = [];
      if (assessments.length) {
        const { data: markRows, error: markError } = await supabase
          .from('marks')
          .select('assessment_id, student_id, score')
          .eq('school_id', schoolId!)
          .in('assessment_id', assessments.map((a) => a.id));
        if (markError) throw markError;
        marks = (markRows ?? []) as typeof marks;
      }

      // --- Attendance aggregation ---
      const attendance = (attendanceRows ?? []) as unknown as
        { student_id: string; status: AttendanceStatus; attendance_date: string }[];
      const perStudentAttendance = new Map<string, Record<AttendanceStatus, number>>();
      const perSectionLastAttendance = new Map<string, string>();
      const perDay = new Map<string, { good: number; total: number }>();
      const todayCounts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
      let todayRecorded = false;

      for (const row of attendance) {
        const bucket = perStudentAttendance.get(row.student_id)
          ?? { present: 0, absent: 0, late: 0, excused: 0 };
        bucket[row.status] += 1;
        perStudentAttendance.set(row.student_id, bucket);

        const day = perDay.get(row.attendance_date) ?? { good: 0, total: 0 };
        day.total += 1;
        if (row.status === 'present' || row.status === 'excused') day.good += 1;
        perDay.set(row.attendance_date, day);

        if (row.attendance_date === today) {
          todayCounts[row.status] += 1;
          todayRecorded = true;
        }
      }

      const attendance_trend = Array.from(perDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-30)
        .map(([, d]) => (d.total > 0 ? (d.good / d.total) * 100 : 0));

      // --- Marks aggregation ---
      const byAssessment = new Map(assessments.map((a) => [a.id, a]));
      const perSectionAssessments = new Map<string, number>();
      for (const a of assessments) {
        perSectionAssessments.set(a.section_id, (perSectionAssessments.get(a.section_id) ?? 0) + 1);
      }
      const perSectionMarkCount = new Map<string, number>();
      const perStudentSubject = new Map<string, Map<string, { name: string; earned: number; possible: number }>>();
      const perSubject = new Map<string, { name: string; earned: number; possible: number; students: Set<string> }>();

      for (const m of marks) {
        if (m.score === null || m.score === undefined) continue;
        const a = byAssessment.get(m.assessment_id);
        if (!a) continue;
        const earned = Number(m.score) * Number(a.weight);
        const possible = Number(a.max_score) * Number(a.weight);

        const studentMap = perStudentSubject.get(m.student_id) ?? new Map();
        const cur = studentMap.get(a.subject_id) ?? { name: a.subjects?.name ?? '—', earned: 0, possible: 0 };
        cur.earned += earned;
        cur.possible += possible;
        studentMap.set(a.subject_id, cur);
        perStudentSubject.set(m.student_id, studentMap);

        const sub = perSubject.get(a.subject_id)
          ?? { name: a.subjects?.name ?? '—', earned: 0, possible: 0, students: new Set<string>() };
        sub.earned += earned;
        sub.possible += possible;
        sub.students.add(m.student_id);
        perSubject.set(a.subject_id, sub);
      }

      const subject_averages: SectionSubjectAverage[] = Array.from(perSubject.entries())
        .map(([subject_id, v]) => ({
          subject_id,
          subject_name: v.name,
          percent: v.possible > 0 ? (v.earned / v.possible) * 100 : 0,
          graded_students: v.students.size,
        }))
        .sort((a, b) => b.percent - a.percent);

      const students: SectionDashboardStudent[] = roster.map((s) => {
        const att = perStudentAttendance.get(s.student_id);
        const totalDays = att ? att.present + att.absent + att.late + att.excused : 0;
        const subjectMap = perStudentSubject.get(s.student_id);
        const percents = subjectMap
          ? Array.from(subjectMap.values())
              .filter((v) => v.possible > 0)
              .map((v) => (v.earned / v.possible) * 100)
          : [];
        return {
          ...s,
          attendance_days: totalDays,
          attendance_rate: att && totalDays > 0 ? ((att.present + att.excused) / totalDays) * 100 : null,
          average: percents.length ? percents.reduce((x, y) => x + y, 0) / percents.length : null,
        };
      });

      const graded = students.filter((s) => s.average !== null);
      const class_average = graded.length
        ? graded.reduce((sum, s) => sum + (s.average ?? 0), 0) / graded.length
        : null;

      const top_students = [...graded]
        .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
        .slice(0, 5);

      const at_risk_students = students
        .map((s) => {
          const reasons: string[] = [];
          if (s.attendance_rate !== null && s.attendance_rate < 80) reasons.push('حاضری پایین');
          if (s.average !== null && s.average < 50) reasons.push('نمرات پایین');
          return { ...s, reasons };
        })
        .filter((s) => s.reasons.length > 0)
        .sort((a, b) => (a.average ?? 101) - (b.average ?? 101))
        .slice(0, 8);

      const activity: SectionActivityItem[] = [
        ...Array.from(perDay.entries())
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 5)
          .map(([date, d]) => ({
            id: `att-${date}`,
            kind: 'attendance' as const,
            title: 'ثبت حاضری',
            description: `${d.good} از ${d.total} شاگرد حاضر`,
            date,
          })),
        ...assessments.slice(0, 5).map((a) => ({
          id: `asm-${a.id}`,
          kind: 'assessment' as const,
          title: a.title,
          description: `${a.subjects?.name ?? '—'} · نمره اعظمی ${a.max_score}`,
          date: a.assessment_date,
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8);

      const sectionData = sectionRow as unknown as Section & {
        grade_levels: { name: string } | null;
        academic_years: { name: string } | null;
      };

      const overallGood = attendance.filter((r) => r.status === 'present' || r.status === 'excused').length;

      return {
        section: {
          ...(sectionRow as unknown as Section),
          grade_name: sectionData.grade_levels?.name ?? '—',
          academic_year_name: sectionData.academic_years?.name ?? '—',
          enrollment_count: roster.length,
        },
        homeroom_teacher_name: sectionData.homeroom_teacher_id
          ? teachers.find((t) => t.user_id === sectionData.homeroom_teacher_id)?.full_name ?? 'نامشخص'
          : null,
        students,
        total_students: roster.length,
        male_students: roster.filter((s) => s.gender === 'male').length,
        female_students: roster.filter((s) => s.gender === 'female').length,
        today: { date: today, recorded: todayRecorded, ...todayCounts },
        overall_attendance_rate: attendance.length > 0 ? (overallGood / attendance.length) * 100 : null,
        attendance_trend,
        subject_averages,
        class_average,
        top_students,
        at_risk_students,
        activity,
      };
    },
  });
}

// ============================================================
// Phase 4B — School academic dashboard
// ============================================================

export interface SchoolSectionSummary {
  section_id: string;
  section_name: string;
  grade_name: string;
  student_count: number;
  attendance_rate: number | null;
  average: number | null;
  reasons?: string[];
}

export interface SchoolEnrollmentTrendPoint {
  month: string;
  count: number;
}

export interface SchoolDashboardData {
  total_students: number;
  male_students: number;
  female_students: number;
  total_teachers: number;
  total_sections: number;
  overall_attendance_rate: number | null;
  attendance_trend: number[];
  subject_averages: SectionSubjectAverage[];
  school_average: number | null;
  enrollment_trend: SchoolEnrollmentTrendPoint[];
  top_sections: SchoolSectionSummary[];
  attention_sections: SchoolSectionSummary[];
  activity: SectionActivityItem[];
}

/** School-wide academic analytics composed from existing academic tables (RLS scoped). */
export function useSchoolAcademicDashboard() {
  const { schoolId } = useAcademicScope();
  const { data: teachers = [] } = useSchoolTeachers();

  return useQuery({
    queryKey: ['school-academic-dashboard', schoolId, teachers.length],
    enabled: !!schoolId,
    queryFn: async (): Promise<SchoolDashboardData> => {
      const [{ data: sectionRows, error: sectionError },
             { data: enrollmentRows, error: enrollmentError },
             { data: attendanceRows, error: attendanceError },
             { data: assessmentRows, error: assessmentError }] = await Promise.all([
        supabase
          .from('sections')
          .select('id, name, status, grade_levels(name)')
          .eq('school_id', schoolId!)
          .eq('status', 'active'),
        supabase
          .from('enrollments')
          .select('student_id, section_id, enrollment_date, students(gender)')
          .eq('school_id', schoolId!)
          .eq('status', 'active'),
        supabase
          .from('attendance_records')
          .select('section_id, status, attendance_date')
          .eq('school_id', schoolId!)
          .order('attendance_date', { ascending: true }),
        supabase
          .from('assessments')
          .select('id, title, section_id, subject_id, max_score, weight, assessment_date, subjects(name)')
          .eq('school_id', schoolId!)
          .eq('status', 'active')
          .order('assessment_date', { ascending: false }),
      ]);
      if (sectionError) throw sectionError;
      if (enrollmentError) throw enrollmentError;
      if (attendanceError) throw attendanceError;
      if (assessmentError) throw assessmentError;

      type SectionRow = { id: string; name: string; status: string; grade_levels: { name: string } | null };
      type SchoolEnrollmentRow = {
        student_id: string; section_id: string; enrollment_date: string;
        students: { gender: string } | null;
      };
      type SchoolAssessmentRow = {
        id: string; title: string; section_id: string; subject_id: string;
        max_score: number; weight: number; assessment_date: string;
        subjects: { name: string } | null;
      };

      const sections = (sectionRows ?? []) as unknown as SectionRow[];
      const enrollments = (enrollmentRows ?? []) as unknown as SchoolEnrollmentRow[];
      const attendance = (attendanceRows ?? []) as unknown as
        { section_id: string; status: AttendanceStatus; attendance_date: string }[];
      const assessments = (assessmentRows ?? []) as unknown as SchoolAssessmentRow[];

      let marks: { assessment_id: string; student_id: string; score: number | null }[] = [];
      if (assessments.length) {
        const { data: markRows, error: markError } = await supabase
          .from('marks')
          .select('assessment_id, student_id, score')
          .eq('school_id', schoolId!)
          .in('assessment_id', assessments.map((a) => a.id));
        if (markError) throw markError;
        marks = (markRows ?? []) as typeof marks;
      }

      // --- Students / gender ---
      const uniqueStudents = new Map<string, string>();
      for (const e of enrollments) uniqueStudents.set(e.student_id, e.students?.gender ?? 'unknown');
      const genders = Array.from(uniqueStudents.values());

      // --- Enrollment trend (last 12 months) ---
      const monthCounts = new Map<string, number>();
      for (const e of enrollments) {
        const month = (e.enrollment_date ?? '').slice(0, 7);
        if (!month) continue;
        monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
      }
      const enrollment_trend: SchoolEnrollmentTrendPoint[] = Array.from(monthCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([month, count]) => ({ month, count }));

      // --- Attendance ---
      const perDay = new Map<string, { good: number; total: number }>();
      const perSectionAttendance = new Map<string, { good: number; total: number }>();
      let overallGood = 0;
      for (const row of attendance) {
        const good = row.status === 'present' || row.status === 'excused';
        if (good) overallGood += 1;
        const day = perDay.get(row.attendance_date) ?? { good: 0, total: 0 };
        day.total += 1;
        if (good) day.good += 1;
        perDay.set(row.attendance_date, day);

        const sec = perSectionAttendance.get(row.section_id) ?? { good: 0, total: 0 };
        sec.total += 1;
        if (good) sec.good += 1;
        perSectionAttendance.set(row.section_id, sec);
      }
      const attendance_trend = Array.from(perDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-30)
        .map(([, d]) => (d.total > 0 ? (d.good / d.total) * 100 : 0));

      // --- Marks ---
      const byAssessment = new Map(assessments.map((a) => [a.id, a]));
      const perSubject = new Map<string, { name: string; earned: number; possible: number; students: Set<string> }>();
      const perSectionMarks = new Map<string, { earned: number; possible: number }>();
      let schoolEarned = 0;
      let schoolPossible = 0;

      for (const m of marks) {
        if (m.score === null || m.score === undefined) continue;
        const a = byAssessment.get(m.assessment_id);
        if (!a) continue;
        const earned = Number(m.score) * Number(a.weight);
        const possible = Number(a.max_score) * Number(a.weight);
        schoolEarned += earned;
        schoolPossible += possible;

        const sub = perSubject.get(a.subject_id)
          ?? { name: a.subjects?.name ?? '—', earned: 0, possible: 0, students: new Set<string>() };
        sub.earned += earned;
        sub.possible += possible;
        sub.students.add(m.student_id);
        perSubject.set(a.subject_id, sub);

        const sec = perSectionMarks.get(a.section_id) ?? { earned: 0, possible: 0 };
        sec.earned += earned;
        sec.possible += possible;
        perSectionMarks.set(a.section_id, sec);
      }

      const subject_averages: SectionSubjectAverage[] = Array.from(perSubject.entries())
        .map(([subject_id, v]) => ({
          subject_id,
          subject_name: v.name,
          percent: v.possible > 0 ? (v.earned / v.possible) * 100 : 0,
          graded_students: v.students.size,
        }))
        .sort((a, b) => b.percent - a.percent);

      // --- Section summaries ---
      const perSectionStudents = new Map<string, number>();
      for (const e of enrollments) {
        perSectionStudents.set(e.section_id, (perSectionStudents.get(e.section_id) ?? 0) + 1);
      }
      const sectionSummaries: SchoolSectionSummary[] = sections.map((s) => {
        const att = perSectionAttendance.get(s.id);
        const mk = perSectionMarks.get(s.id);
        return {
          section_id: s.id,
          section_name: s.name,
          grade_name: s.grade_levels?.name ?? '—',
          student_count: perSectionStudents.get(s.id) ?? 0,
          attendance_rate: att && att.total > 0 ? (att.good / att.total) * 100 : null,
          average: mk && mk.possible > 0 ? (mk.earned / mk.possible) * 100 : null,
        };
      });

      const top_sections = sectionSummaries
        .filter((s) => s.average !== null)
        .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
        .slice(0, 5);

      const attention_sections = sectionSummaries
        .map((s) => {
          const reasons: string[] = [];
          if (s.attendance_rate !== null && s.attendance_rate < 80) reasons.push('حاضری پایین');
          if (s.average !== null && s.average < 50) reasons.push('نمرات پایین');
          if (s.student_count === 0) reasons.push('بدون شاگرد');
          return { ...s, reasons };
        })
        .filter((s) => s.reasons.length > 0)
        .sort((a, b) => (a.average ?? 101) - (b.average ?? 101))
        .slice(0, 6);

      const activity: SectionActivityItem[] = [
        ...Array.from(perDay.entries())
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 5)
          .map(([date, d]) => ({
            id: `att-${date}`,
            kind: 'attendance' as const,
            title: 'ثبت حاضری مکتب',
            description: `${d.good} از ${d.total} حاضری ثبت‌شده`,
            date,
          })),
        ...assessments.slice(0, 5).map((a) => ({
          id: `asm-${a.id}`,
          kind: 'assessment' as const,
          title: a.title,
          description: `${a.subjects?.name ?? '—'} · نمره اعظمی ${a.max_score}`,
          date: a.assessment_date,
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8);

      return {
        total_students: uniqueStudents.size,
        male_students: genders.filter((g) => g === 'male').length,
        female_students: genders.filter((g) => g === 'female').length,
        total_teachers: teachers.length,
        total_sections: sections.length,
        overall_attendance_rate: attendance.length > 0 ? (overallGood / attendance.length) * 100 : null,
        attendance_trend,
        subject_averages,
        school_average: schoolPossible > 0 ? (schoolEarned / schoolPossible) * 100 : null,
        enrollment_trend,
        top_sections,
        attention_sections,
        activity,
      };
    },
  });
}

// ============================================================
// Phase 4C — School academic reports & analytics (school-scoped)
// ============================================================

export interface ReportFilters {
  academicYearId?: string;
  gradeId?: string;
  sectionId?: string;
  subjectId?: string;
}

export interface ReportSubjectAverage {
  subject_id: string;
  subject_name: string;
  percent: number;
  graded_students: number;
}

export interface ReportSectionRow {
  section_id: string;
  section_name: string;
  grade_id: string;
  grade_name: string;
  student_count: number;
  male: number;
  female: number;
  attendance_rate: number | null;
  attendance_records: number;
  average: number | null;
  assessment_count: number;
  mark_count: number;
  last_attendance_date: string | null;
}

export interface ReportStudentRow {
  student_id: string;
  student_name: string;
  student_code: string;
  section_name: string;
  grade_name: string;
  average: number | null;
  attendance_rate: number | null;
  reasons: string[];
}

export interface ReportGradeRow {
  grade_id: string;
  grade_name: string;
  student_count: number;
  average: number | null;
  attendance_rate: number | null;
}

export interface SchoolReportsData {
  performance: {
    school_average: number | null;
    graded_students: number;
    subject_averages: ReportSubjectAverage[];
    grade_rows: ReportGradeRow[];
    best_subject: ReportSubjectAverage | null;
    worst_subject: ReportSubjectAverage | null;
    attention_students: ReportStudentRow[];
  };
  attendance: {
    overall_rate: number | null;
    total_records: number;
    trend: number[];
    trend_days: { date: string; rate: number }[];
    by_section: ReportSectionRow[];
    concerning_students: ReportStudentRow[];
  };
  enrollment: {
    total: number;
    male: number;
    female: number;
    by_grade: ReportGradeRow[];
    by_section: ReportSectionRow[];
    monthly_trend: SchoolEnrollmentTrendPoint[];
  };
  sections: ReportSectionRow[];
}

/** Aggregated, filterable academic analytics for the signed-in user's school. */
export function useSchoolAcademicReports(filters: ReportFilters) {
  const { schoolId } = useAcademicScope();
  const { academicYearId, gradeId, sectionId, subjectId } = filters;

  return useQuery({
    queryKey: ['school-academic-reports', schoolId, academicYearId, gradeId, sectionId, subjectId],
    enabled: !!schoolId,
    queryFn: async (): Promise<SchoolReportsData> => {
      let sectionQuery = supabase
        .from('sections')
        .select('id, name, status, grade_level_id, academic_year_id, grade_levels(name)')
        .eq('school_id', schoolId!)
        .eq('status', 'active');
      if (academicYearId) sectionQuery = sectionQuery.eq('academic_year_id', academicYearId);
      if (gradeId) sectionQuery = sectionQuery.eq('grade_level_id', gradeId);
      if (sectionId) sectionQuery = sectionQuery.eq('id', sectionId);

      const { data: sectionRows, error: sectionError } = await sectionQuery;
      if (sectionError) throw sectionError;

      type RSection = {
        id: string; name: string; status: string; grade_level_id: string;
        academic_year_id: string; grade_levels: { name: string } | null;
      };
      const sections = (sectionRows ?? []) as unknown as RSection[];
      const sectionIds = sections.map((s) => s.id);

      const empty: SchoolReportsData = {
        performance: {
          school_average: null, graded_students: 0, subject_averages: [], grade_rows: [],
          best_subject: null, worst_subject: null, attention_students: [],
        },
        attendance: {
          overall_rate: null, total_records: 0, trend: [], trend_days: [],
          by_section: [], concerning_students: [],
        },
        enrollment: { total: 0, male: 0, female: 0, by_grade: [], by_section: [], monthly_trend: [] },
        sections: [],
      };
      if (sectionIds.length === 0) return empty;

      let assessmentQuery = supabase
        .from('assessments')
        .select('id, section_id, subject_id, max_score, weight, subjects(name)')
        .eq('school_id', schoolId!)
        .eq('status', 'active')
        .in('section_id', sectionIds);
      if (subjectId) assessmentQuery = assessmentQuery.eq('subject_id', subjectId);

      const [{ data: enrollmentRows, error: enrollmentError },
             { data: attendanceRows, error: attendanceError },
             { data: assessmentRows, error: assessmentError }] = await Promise.all([
        supabase
          .from('enrollments')
          .select('student_id, section_id, enrollment_date, students(full_name, student_code, gender)')
          .eq('school_id', schoolId!)
          .eq('status', 'active')
          .in('section_id', sectionIds),
        supabase
          .from('attendance_records')
          .select('student_id, section_id, status, attendance_date')
          .eq('school_id', schoolId!)
          .in('section_id', sectionIds),
        assessmentQuery,
      ]);
      if (enrollmentError) throw enrollmentError;
      if (attendanceError) throw attendanceError;
      if (assessmentError) throw assessmentError;

      type REnrollment = {
        student_id: string; section_id: string; enrollment_date: string;
        students: { full_name: string; student_code: string; gender: string } | null;
      };
      type RAssessment = {
        id: string; section_id: string; subject_id: string;
        max_score: number; weight: number; subjects: { name: string } | null;
      };
      const enrollments = (enrollmentRows ?? []) as unknown as REnrollment[];
      const attendance = (attendanceRows ?? []) as unknown as
        { student_id: string; section_id: string; status: AttendanceStatus; attendance_date: string }[];
      const assessments = (assessmentRows ?? []) as unknown as RAssessment[];

      let marks: { assessment_id: string; student_id: string; score: number | null }[] = [];
      if (assessments.length) {
        const { data: markRows, error: markError } = await supabase
          .from('marks')
          .select('assessment_id, student_id, score')
          .eq('school_id', schoolId!)
          .in('assessment_id', assessments.map((a) => a.id));
        if (markError) throw markError;
        marks = (markRows ?? []) as typeof marks;
      }

      const sectionById = new Map(sections.map((s) => [s.id, s]));

      // --- Enrollment ---
      const studentMeta = new Map<string, { name: string; code: string; gender: string; section_id: string }>();
      const perSectionStudents = new Map<string, { total: number; male: number; female: number }>();
      const monthCounts = new Map<string, number>();
      for (const e of enrollments) {
        studentMeta.set(e.student_id, {
          name: e.students?.full_name ?? '—',
          code: e.students?.student_code ?? '—',
          gender: e.students?.gender ?? 'unknown',
          section_id: e.section_id,
        });
        const bucket = perSectionStudents.get(e.section_id) ?? { total: 0, male: 0, female: 0 };
        bucket.total += 1;
        if (e.students?.gender === 'male') bucket.male += 1;
        if (e.students?.gender === 'female') bucket.female += 1;
        perSectionStudents.set(e.section_id, bucket);
        const month = (e.enrollment_date ?? '').slice(0, 7);
        if (month) monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
      }
      const monthly_trend: SchoolEnrollmentTrendPoint[] = Array.from(monthCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([month, count]) => ({ month, count }));

      // --- Attendance ---
      const perDay = new Map<string, { good: number; total: number }>();
      const perSectionAttendance = new Map<string, { good: number; total: number }>();
      const perStudentAttendance = new Map<string, { good: number; total: number }>();
      let overallGood = 0;
      for (const row of attendance) {
        const good = row.status === 'present' || row.status === 'excused';
        if (good) overallGood += 1;
        const d = perDay.get(row.attendance_date) ?? { good: 0, total: 0 };
        d.total += 1; if (good) d.good += 1;
        perDay.set(row.attendance_date, d);
        const sec = perSectionAttendance.get(row.section_id) ?? { good: 0, total: 0 };
        sec.total += 1; if (good) sec.good += 1;
        perSectionAttendance.set(row.section_id, sec);
        const st = perStudentAttendance.get(row.student_id) ?? { good: 0, total: 0 };
        st.total += 1; if (good) st.good += 1;
        perStudentAttendance.set(row.student_id, st);
        const last = perSectionLastAttendance.get(row.section_id);
        if (!last || row.attendance_date > last) perSectionLastAttendance.set(row.section_id, row.attendance_date);
      }
      const trend_days = Array.from(perDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-30)
        .map(([date, d]) => ({ date, rate: d.total > 0 ? (d.good / d.total) * 100 : 0 }));

      // --- Marks ---
      const byAssessment = new Map(assessments.map((a) => [a.id, a]));
      const perSubject = new Map<string, { name: string; earned: number; possible: number; students: Set<string> }>();
      const perSectionMarks = new Map<string, { earned: number; possible: number }>();
      const perStudentMarks = new Map<string, { earned: number; possible: number }>();
      let schoolEarned = 0;
      let schoolPossible = 0;
      const gradedStudents = new Set<string>();

      for (const m of marks) {
        if (m.score === null || m.score === undefined) continue;
        const a = byAssessment.get(m.assessment_id);
        if (!a) continue;
        const earned = Number(m.score) * Number(a.weight);
        const possible = Number(a.max_score) * Number(a.weight);
        schoolEarned += earned;
        schoolPossible += possible;
        gradedStudents.add(m.student_id);

        const sub = perSubject.get(a.subject_id)
          ?? { name: a.subjects?.name ?? '—', earned: 0, possible: 0, students: new Set<string>() };
        sub.earned += earned; sub.possible += possible; sub.students.add(m.student_id);
        perSubject.set(a.subject_id, sub);

        const sec = perSectionMarks.get(a.section_id) ?? { earned: 0, possible: 0 };
        sec.earned += earned; sec.possible += possible;
        perSectionMarks.set(a.section_id, sec);
        perSectionMarkCount.set(a.section_id, (perSectionMarkCount.get(a.section_id) ?? 0) + 1);

        const st = perStudentMarks.get(m.student_id) ?? { earned: 0, possible: 0 };
        st.earned += earned; st.possible += possible;
        perStudentMarks.set(m.student_id, st);
      }

      const subject_averages: ReportSubjectAverage[] = Array.from(perSubject.entries())
        .map(([subject_id, v]) => ({
          subject_id,
          subject_name: v.name,
          percent: v.possible > 0 ? (v.earned / v.possible) * 100 : 0,
          graded_students: v.students.size,
        }))
        .sort((a, b) => b.percent - a.percent);

      // --- Section rows ---
      const sectionRowsOut: ReportSectionRow[] = sections.map((s) => {
        const st = perSectionStudents.get(s.id) ?? { total: 0, male: 0, female: 0 };
        const att = perSectionAttendance.get(s.id);
        const mk = perSectionMarks.get(s.id);
        return {
          section_id: s.id,
          section_name: s.name,
          grade_id: s.grade_level_id,
          grade_name: s.grade_levels?.name ?? '—',
          student_count: st.total,
          male: st.male,
          female: st.female,
          attendance_rate: att && att.total > 0 ? (att.good / att.total) * 100 : null,
          attendance_records: att?.total ?? 0,
          average: mk && mk.possible > 0 ? (mk.earned / mk.possible) * 100 : null,
          assessment_count: perSectionAssessments.get(s.id) ?? 0,
          mark_count: perSectionMarkCount.get(s.id) ?? 0,
          last_attendance_date: perSectionLastAttendance.get(s.id) ?? null,
        };
      }).sort((a, b) => a.grade_name.localeCompare(b.grade_name, 'fa'));

      // --- Grade rows ---
      const gradeAgg = new Map<string, {
        name: string; students: number; earned: number; possible: number; good: number; total: number;
      }>();
      for (const s of sections) {
        const g = gradeAgg.get(s.grade_level_id)
          ?? { name: s.grade_levels?.name ?? '—', students: 0, earned: 0, possible: 0, good: 0, total: 0 };
        g.students += perSectionStudents.get(s.id)?.total ?? 0;
        const mk = perSectionMarks.get(s.id);
        if (mk) { g.earned += mk.earned; g.possible += mk.possible; }
        const att = perSectionAttendance.get(s.id);
        if (att) { g.good += att.good; g.total += att.total; }
        gradeAgg.set(s.grade_level_id, g);
      }
      const grade_rows: ReportGradeRow[] = Array.from(gradeAgg.entries()).map(([grade_id, g]) => ({
        grade_id,
        grade_name: g.name,
        student_count: g.students,
        average: g.possible > 0 ? (g.earned / g.possible) * 100 : null,
        attendance_rate: g.total > 0 ? (g.good / g.total) * 100 : null,
      })).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

      // --- Student rows ---
      const buildStudentRow = (studentId: string): ReportStudentRow => {
        const meta = studentMeta.get(studentId);
        const sec = meta ? sectionById.get(meta.section_id) : undefined;
        const mk = perStudentMarks.get(studentId);
        const att = perStudentAttendance.get(studentId);
        const average = mk && mk.possible > 0 ? (mk.earned / mk.possible) * 100 : null;
        const attendance_rate = att && att.total > 0 ? (att.good / att.total) * 100 : null;
        const reasons: string[] = [];
        if (average !== null && average < 50) reasons.push('نمرات پایین');
        if (attendance_rate !== null && attendance_rate < 80) reasons.push('حاضری پایین');
        return {
          student_id: studentId,
          student_name: meta?.name ?? '—',
          student_code: meta?.code ?? '—',
          section_name: sec?.name ?? '—',
          grade_name: sec?.grade_levels?.name ?? '—',
          average,
          attendance_rate,
          reasons,
        };
      };

      const allStudentRows = Array.from(studentMeta.keys()).map(buildStudentRow);
      const attention_students = allStudentRows
        .filter((s) => s.average !== null && s.average < 50)
        .sort((a, b) => (a.average ?? 0) - (b.average ?? 0))
        .slice(0, 10);
      const concerning_students = allStudentRows
        .filter((s) => s.attendance_rate !== null && s.attendance_rate < 80)
        .sort((a, b) => (a.attendance_rate ?? 0) - (b.attendance_rate ?? 0))
        .slice(0, 10);

      const totalStudents = studentMeta.size;
      const genders = Array.from(studentMeta.values());

      return {
        performance: {
          school_average: schoolPossible > 0 ? (schoolEarned / schoolPossible) * 100 : null,
          graded_students: gradedStudents.size,
          subject_averages,
          grade_rows,
          best_subject: subject_averages[0] ?? null,
          worst_subject: subject_averages.length > 1 ? subject_averages[subject_averages.length - 1] : null,
          attention_students,
        },
        attendance: {
          overall_rate: attendance.length > 0 ? (overallGood / attendance.length) * 100 : null,
          total_records: attendance.length,
          trend: trend_days.map((d) => d.rate),
          trend_days,
          by_section: [...sectionRowsOut].sort((a, b) => (a.attendance_rate ?? 101) - (b.attendance_rate ?? 101)),
          concerning_students,
        },
        enrollment: {
          total: totalStudents,
          male: genders.filter((g) => g.gender === 'male').length,
          female: genders.filter((g) => g.gender === 'female').length,
          by_grade: [...grade_rows].sort((a, b) => b.student_count - a.student_count),
          by_section: sectionRowsOut,
          monthly_trend,
        },
        sections: sectionRowsOut,
      };
    },
  });
}
