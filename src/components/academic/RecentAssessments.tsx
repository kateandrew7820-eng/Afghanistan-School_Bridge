import { Card } from '@/components/ui/card';
import { useRecentAssessments } from '@/hooks/useAcademic';

export default function RecentAssessments() {
  const recent = useRecentAssessments();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Recent Assessments</h3>
      {recent.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {recent.map((item) => (
            <li key={item.id}>
              <div className="flex items-center justify-between">
                <div>{item.form_data?.student_name || item.submitted_by}</div>
                <div className="text-muted-foreground text-xs">{new Date(item.created_at).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : <div className="text-sm text-muted-foreground">No recent assessments</div>}
    </Card>
  );
}
