import React from 'react';
import { Card } from '@/components/ui/card';
import { useRecentAssessments } from '@/hooks/useAcademic';

export default function AssessmentAnalytics() {
  const recent = useRecentAssessments();

  // derive average scores by subject (if form_data.subject and form_data.score exist)
  const bySubject: Record<string, { total: number; count: number }> = {};
  recent.forEach((a: any) => {
    try {
      const fd = a.form_data as any;
      const subj = fd?.subject || 'Unknown';
      const score = Number(fd?.score ?? fd?.total_score ?? NaN);
      if (!Number.isFinite(score)) return;
      bySubject[subj] = bySubject[subj] || { total: 0, count: 0 };
      bySubject[subj].total += score;
      bySubject[subj].count += 1;
    } catch (e) {
      // ignore
    }
  });

  const subjects = Object.keys(bySubject).map(k => ({ subject: k, avg: Math.round(bySubject[k].total / bySubject[k].count) }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Average Scores by Subject</h3>
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {subjects.map(s => (
              <div key={s.subject} className="flex items-center justify-between">
                <div className="text-sm">{s.subject}</div>
                <div className="font-semibold">{s.avg}%</div>
              </div>
            ))}
          </div>
        ) : <div className="text-sm text-muted-foreground">No assessment data available.</div>}
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Recent Assessment Activity</h3>
        {recent.length > 0 ? (
          <ul className="space-y-2">
            {recent.map((r: any) => (
              <li key={r.id} className="text-sm">{new Date(r.created_at).toLocaleString()} — {r.form_data?.student_name || r.submitted_by}</li>
            ))}
          </ul>
        ) : <div className="text-sm text-muted-foreground">No recent assessments</div>}
      </Card>
    </div>
  );
}
