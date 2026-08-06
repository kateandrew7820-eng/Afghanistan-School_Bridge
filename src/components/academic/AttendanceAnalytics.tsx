import React from 'react';
import { KpiCard } from '@/components/KpiCard';
import { useAcademicOverview, useAttendanceBySection } from '@/hooks/useAcademic';
import { Card } from '@/components/ui/card';

export default function AttendanceAnalytics() {
  const { data, isLoading } = useAcademicOverview() as any;
  const bySection = useAttendanceBySection();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <KpiCard label="Total students" value={data?.totalStudents ?? '—'} loading={isLoading} />
      <KpiCard label="Attendance" value={data?.attendanceRate ? `${data.attendanceRate}%` : '—'} loading={isLoading} />
      <div className="md:col-span-3">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Attendance by Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {bySection && bySection.length > 0 ? bySection.map((s: any) => (
              <div key={s.section} className="p-2 border rounded">
                <div className="text-xs text-muted-foreground">{s.section}</div>
                <div className="text-lg font-semibold">{s.avg}%</div>
              </div>
            )) : <div className="text-sm text-muted-foreground">No attendance records available.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
