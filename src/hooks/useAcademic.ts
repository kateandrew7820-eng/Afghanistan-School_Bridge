import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Overview = {
  totalStudents?: number | null;
  attendanceRate?: number | null;
  recentAssessments?: any[];
  averageBySection?: { section: string; avg: number }[];
};

export function useAcademicOverview() {
  const { profile } = useAuth();
  const schoolId = (profile as any)?.school_id as string | undefined;

  return useQuery(['academic', 'overview', schoolId], async (): Promise<Overview> => {
    if (!schoolId) return {};

    // Try to read attendance_records (raw rows) - fallback to statistics_submissions
    const [{ data: attendanceRows }, { data: stats }, { data: assessments }] = await Promise.all([
      // attendance_records may not be present in types; use any table name
      supabase.from<any>('attendance_records').select('student_id, present, date, section').eq('school_id', schoolId),
      supabase.from('statistics_submissions').select('total_students, attendance_rate').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('form_submissions').select('id, created_at, form_data, submitted_by').eq('school_id', schoolId).eq('form_type', 'student_assessment').order('created_at', { ascending: false }).limit(20),
    ]);

    const recentAssessments = (assessments ?? []) as any[];

    let attendanceRate: number | null = null;
    let totalStudents: number | null = null;

    if (attendanceRows && attendanceRows.length > 0) {
      const grouped: Record<string, { present: number; total: number }> = {};
      const students = new Set<string>();
      attendanceRows.forEach((r: any) => {
        const sec = r.section || 'Unknown';
        students.add(r.student_id);
        grouped[sec] = grouped[sec] || { present: 0, total: 0 };
        grouped[sec].total += 1;
        if (r.present) grouped[sec].present += 1;
      });

      const overall = Object.values(grouped).reduce((acc, cur) => ({ present: acc.present + cur.present, total: acc.total + cur.total }), { present: 0, total: 0 });
      attendanceRate = overall.total > 0 ? Math.round((overall.present / overall.total) * 100) : null;
      totalStudents = students.size || null;
    }

    if ((attendanceRate === null || totalStudents === null) && stats) {
      attendanceRate = attendanceRate ?? (stats as any)?.attendance_rate ?? null;
      totalStudents = totalStudents ?? (stats as any)?.total_students ?? null;
    }

    // Average by section from attendance rows (percent present)
    const averageBySection: { section: string; avg: number }[] = [];
    if (attendanceRows && attendanceRows.length > 0) {
      const bySec: Record<string, { present: number; total: number }> = {};
      attendanceRows.forEach((r: any) => {
        const sec = r.section || 'Unknown';
        bySec[sec] = bySec[sec] || { present: 0, total: 0 };
        bySec[sec].total += 1;
        if (r.present) bySec[sec].present += 1;
      });
      for (const sec of Object.keys(bySec)) {
        const v = bySec[sec];
        averageBySection.push({ section: sec, avg: Math.round((v.present / v.total) * 100) });
      }
    }

    return { totalStudents, attendanceRate, recentAssessments, averageBySection };
  }, { enabled: !!(profile as any)?.school_id });
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
  // derive top students from assessments if score present in form_data
  const scores: Record<string, { name?: string; avg: number; count: number }> = {};
  assessments.forEach((a: any) => {
    try {
      const fd = a.form_data as any;
      const studentId = fd?.student_id || a.submitted_by;
      const score = Number(fd?.score ?? fd?.total_score ?? NaN);
      if (!Number.isFinite(score)) return;
      scores[studentId] = scores[studentId] || { name: fd?.student_name, avg: 0, count: 0 };
      scores[studentId].avg = (scores[studentId].avg * scores[studentId].count + score) / (scores[studentId].count + 1);
      scores[studentId].count += 1;
    } catch (e) {
      // ignore
    }
  });

  const list = Object.keys(scores).map(id => ({ id, name: scores[id].name, avg: Math.round(scores[id].avg) }));
  list.sort((a, b) => (b.avg || 0) - (a.avg || 0));
  return list.slice(0, 10);
}

export function useStudentsNeedingAttention(threshold = 75) {
  const { data } = useAcademicOverview();
  const bySection = data?.averageBySection ?? [];
  // fallback: if any section average below threshold, mark as needing attention
  return bySection.filter(s => s.avg < threshold);
}

export default {};
