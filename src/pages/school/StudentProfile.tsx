import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';
import { supabase } from '@/integrations/supabase/client';

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [attendanceSummary, setAttendanceSummary] = React.useState<any>(null);
  const [assessments, setAssessments] = React.useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return setLoading(false);
      // Fetch student attendance rows and assessments
      const [{ data: attendanceRows }, { data: assessmentRows }] = await Promise.all([
        supabase.from<any>('attendance_records').select('present, date, section').eq('student_id', id),
        supabase.from('form_submissions').select('id, created_at, form_data').eq('form_type', 'student_assessment').filter('form_data->>student_id', 'eq', id),
      ].map(p => p.catch ? p : p).map(x => x));

      if (!mounted) return;
      if (attendanceRows) {
        const total = attendanceRows.length;
        const present = attendanceRows.filter((r: any) => r.present).length;
        setAttendanceSummary({ total, present, rate: total > 0 ? Math.round((present / total) * 100) : null });
      }
      setAssessments(assessmentRows ?? []);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHeader title="Student Profile" description={id ? `Student: ${id}` : 'Student profile not found'} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="p-4">
            <h3 className="text-sm font-medium">Attendance Summary</h3>
            {loading ? <div>Loading...</div> : (
              attendanceSummary ? (
                <div className="mt-2">
                  <div>Total records: {attendanceSummary.total}</div>
                  <div>Present: {attendanceSummary.present}</div>
                  <div>Rate: {attendanceSummary.rate ?? '—'}%</div>
                </div>
              ) : <div className="text-sm text-muted-foreground">No attendance records.</div>
            )}
          </Card>
          <Card className="p-4 mt-4">
            <h3 className="text-sm font-medium">Assessment History</h3>
            {assessments.length > 0 ? (
              <ul className="space-y-2 mt-2 text-sm">
                {assessments.map(a => (
                  <li key={a.id} className="flex items-center justify-between">
                    <div>{a.form_data?.subject || 'Assessment'}</div>
                    <div className="font-semibold">{a.form_data?.score ?? '—'}</div>
                  </li>
                ))}
              </ul>
            ) : <div className="text-sm text-muted-foreground mt-2">No assessments found.</div>}
          </Card>
        </div>
        <div>
          <Card className="p-4">
            <h3 className="text-sm font-medium">Current Weighted Grade</h3>
            <div className="text-2xl font-bold mt-2">—</div>
            <div className="text-sm text-muted-foreground mt-2">Weighted grade calculation placeholder.</div>
          </Card>
          <Card className="p-4 mt-4">
            <h3 className="text-sm font-medium">Performance Trend</h3>
            <div className="text-sm text-muted-foreground mt-2">Trend sparkline placeholder.</div>
          </Card>
          <Card className="p-4 mt-4">
            <h3 className="text-sm font-medium">Teacher Notes</h3>
            <div className="text-sm text-muted-foreground mt-2">Placeholder — backend not implemented yet.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
