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
      const { data, error } = await supabase
        .from('sections')
        .select('*, grade_levels(name), academic_years(name)')
        .eq('school_id', schoolId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...(row as Section),
        grade_name: row.grade_levels?.name ?? '—',
        academic_year_name: row.academic_years?.name ?? '—',
        enrollment_count: 0,
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

type TableName = 'academic_years' | 'grade_levels' | 'sections' | 'subjects' | 'teacher_assignments';

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
            : academicKeys.sections(schoolId);


  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: academicKeys.assignments(schoolId) });
    if (table !== 'sections') qc.invalidateQueries({ queryKey: academicKeys.sections(schoolId) });
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
