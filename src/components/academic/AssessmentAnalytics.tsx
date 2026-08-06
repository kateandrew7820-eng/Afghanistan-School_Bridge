import { Card } from '@/components/ui/card';
import { useRecentAssessments } from '@/hooks/useAcademic';
import { EmptyState } from '@/components/EmptyState';
import { ClipboardList } from 'lucide-react';

export default function AssessmentAnalytics() {
  const recent = useRecentAssessments();

  const bySubject: Record<string, { total: number; count: number }> = {};
  recent.forEach((assessment) => {
    const subject = assessment.form_data?.subject || 'Unknown';
    const score = Number(assessment.form_data?.score ?? assessment.form_data?.total_score ?? NaN);
    if (!Number.isFinite(score)) return;
    bySubject[subject] = bySubject[subject] || { total: 0, count: 0 };
    bySubject[subject].total += score;
    bySubject[subject].count += 1;
  });

  const subjects = Object.keys(bySubject).map((key) => ({ subject: key, avg: Math.round(bySubject[key].total / bySubject[key].count) }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Average Scores by Subject</h3>
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {subjects.map((item) => (
              <div key={item.subject} className="flex items-center justify-between rounded-lg border border-border/60 p-2">
                <div className="text-sm">{item.subject}</div>
                <div className="font-semibold">{item.avg}%</div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No assessment data available.</p>}
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Recent Assessment Activity</h3>
        {recent.length > 0 ? (
          <ul className="space-y-2">
            {recent.map((item) => (
              <li key={item.id} className="text-sm">{new Date(item.created_at).toLocaleString()} — {item.form_data?.student_name || item.submitted_by}</li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={ClipboardList} title="No recent assessments" description="Assessment activity will appear here as data is submitted." />
        )}
      </Card>
    </div>
  );
}
