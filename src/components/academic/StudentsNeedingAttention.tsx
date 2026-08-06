import { Card } from '@/components/ui/card';
import { useStudentsNeedingAttention } from '@/hooks/useAcademic';

export default function StudentsNeedingAttention() {
  const list = useStudentsNeedingAttention();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Students Needing Attention</h3>
      {list.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {list.map((section) => (
            <li key={section.section} className="flex items-center justify-between rounded-lg border border-border/60 p-2">
              <span>{section.section}</span>
              <span className="text-destructive font-semibold">{section.avg}%</span>
            </li>
          ))}
        </ul>
      ) : <div className="text-sm text-muted-foreground">No sections below threshold.</div>}
    </Card>
  );
}
