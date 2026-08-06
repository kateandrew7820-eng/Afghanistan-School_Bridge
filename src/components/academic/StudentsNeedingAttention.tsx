import React from 'react';
import { Card } from '@/components/ui/card';
import { useStudentsNeedingAttention } from '@/hooks/useAcademic';

export default function StudentsNeedingAttention() {
  const list = useStudentsNeedingAttention();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Students Needing Attention</h3>
      {list.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {list.map((s: any) => (
            <li key={s.section} className="flex items-center justify-between">
              <span>{s.section}</span>
              <span className="text-destructive font-semibold">{s.avg}%</span>
            </li>
          ))}
        </ul>
      ) : <div className="text-sm text-muted-foreground">No sections below threshold.</div>}
    </Card>
  );
}
