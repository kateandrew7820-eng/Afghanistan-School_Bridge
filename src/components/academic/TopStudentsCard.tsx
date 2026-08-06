import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useTopStudents } from '@/hooks/useAcademic';

export default function TopStudentsCard() {
  const top = useTopStudents();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Top Performing Students</h3>
      {top.length > 0 ? (
        <ol className="list-decimal list-inside space-y-2">
          {top.map((student) => (
            <li key={student.id} className="flex items-center justify-between rounded-lg border border-border/60 p-2">
              <Link to={`/school/students/${student.id}`} className="text-sm font-medium hover:text-primary">
                {student.name || student.id}
              </Link>
              <span className="font-semibold">{student.avg}%</span>
            </li>
          ))}
        </ol>
      ) : <div className="text-sm text-muted-foreground">No data yet.</div>}
    </Card>
  );
}
