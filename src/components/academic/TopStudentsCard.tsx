import React from 'react';
import { Card } from '@/components/ui/card';
import { useTopStudents } from '@/hooks/useAcademic';

export default function TopStudentsCard() {
  const top = useTopStudents();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Top Performing Students</h3>
      {top.length > 0 ? (
        <ol className="list-decimal list-inside space-y-1">
          {top.map(s => (
            <li key={s.id} className="flex items-center justify-between">
              <span>{s.name || s.id}</span>
              <span className="font-semibold">{s.avg}%</span>
            </li>
          ))}
        </ol>
      ) : <div className="text-sm text-muted-foreground">No data yet.</div>}
    </Card>
  );
}
