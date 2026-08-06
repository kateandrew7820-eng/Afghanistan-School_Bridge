import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AcademicAssessment = {
  id: string;
  created_at: string;
  submitted_by?: string;
  form_data?: {
    student_id?: string;
    student_name?: string;
    subject?: string;
    score?: number | string;
    total_score?: number | string;
  } | null;
};

type AttendanceRow = {
  student_id: string;
  present: boolean | null;
  date?: string | null;
  section?: string | null;
  school_id?: string | null;
};

type Overview = {
  totalStudents?: number | null;
  attendanceRate?: number | null;
  recentAssessments?: AcademicAssessment[];
  averageBySection?: { section: string; avg: number }[];
};

function toNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function useAcademicOverview() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id as string | undefined;

  return useQuery(['academic', 'overview', schoolId], async (): Promise<Overview> => {
    if (!schoolId) return {};

    const [{ data: attendanceRows }, { data: stats }, { data: assessments }] = await Promise.all([
      supabase.from('attendance_records').select('student_id, present, date, section, school_id').eq('school_id', schoolId),
      supabase.from('statistics_submissions').select('total_students, attendance_rate').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('form_submissions').select('id, created_at, form_data, submitted_by').eq('school_id', schoolId).eq('form_type', 'student_assessment').order('created_at', { ascending: false }).limit(20),
    ]);

    const safeAttendanceRows = (attendanceRows as AttendanceRow[] | null) ?? [];
    const recentAssessments = (assessments as AcademicAssessment[] | null) ?? [];

    let attendanceRate: number | null = null;
    let totalStudents: number | null = null;

    if (safeAttendanceRows.length > 0) {
      const grouped: Record<string, { present: number; total: number }> = {};
      const students = new Set<string>();
      safeAttendanceRows.forEach((row) => {
        const section = row.section || 'Unknown';
        students.add(row.student_id);
        grouped[section] = grouped[section] || { present: 0, total: 0 };
        grouped[section].total += 1;
        if (row.present) grouped[section].present += 1;
      });

      const overall = Object.values(grouped).reduce((acc, cur) => ({ present: acc.present + cur.present, total: acc.total + cur.total }), { present: 0, total: 0 });
      attendanceRate = overall.total > 0 ? Math.round((overall.present / overall.total) * 100) : null;
      totalStudents = students.size || null;
    }

    if ((attendanceRate === null || totalStudents === null) && stats) {
      attendanceRate = attendanceRate ?? (stats as { attendance_rate?: number | null } | null)?.attendance_rate ?? null;
      totalStudents = totalStudents ?? (stats as { total_students?: number | null } | null)?.total_students ?? null;
    }

    const averageBySection = safeAttendanceRows.length > 0 ? Object.entries(
      safeAttendanceRows.reduce<Record<string, { present: number; total: number }>>((acc, row) => {
        const section = row.section || 'Unknown';
        acc[section] = acc[section] || { present: 0, total: 0 };
        acc[section].total += 1;
        if (row.present) acc[section].present += 1;
        return acc;
      }, {}),
    ).map(([section, values]) => ({ section, avg: Math.round((values.present / values.total) * 100) })) : [];

    return { totalStudents, attendanceRate, recentAssessments, averageBySection };
  }, { enabled: !!schoolId });
}

export function useAttendanceBySection() {
  const { data } = useAcademicOverview();
  return data?.averageBySection ?? [];
}

export function useRecentAssessments() {
  const { data } = useAcademicOverview();
  return data?.recentAssessments ?? [];
}

export function useTopStudents() {
  const assessments = useRecentAssessments();
  const scores: Record<string, { name?: string; avg: number; count: number }> = {};
  assessments.forEach((assessment) => {
    const formData = assessment.form_data;
    const studentId = formData?.student_id || assessment.submitted_by || assessment.id;
    const score = toNumber(formData?.score ?? formData?.total_score);
    if (!score) return;
    scores[studentId] = scores[studentId] || { name: formData?.student_name, avg: 0, count: 0 };
    scores[studentId].avg = (scores[studentId].avg * scores[studentId].count + score) / (scores[studentId].count + 1);
    scores[studentId].count += 1;
  });

  const list = Object.keys(scores).map((id) => ({ id, name: scores[id].name, avg: Math.round(scores[id].avg) }));
  list.sort((left, right) => (right.avg || 0) - (left.avg || 0));
  return list.slice(0, 10);
}

export function useStudentsNeedingAttention(threshold = 75) {
  const { data } = useAcademicOverview();
  const bySection = data?.averageBySection ?? [];
  return bySection.filter((section) => section.avg < threshold);
}

export default {};
