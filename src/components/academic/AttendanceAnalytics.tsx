import { KpiCard } from '@/components/KpiCard';
import { useAcademicOverview, useAttendanceBySection } from '@/hooks/useAcademic';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { Users, TrendingUp } from 'lucide-react';

export default function AttendanceAnalytics() {
  const { data, isLoading, isError } = useAcademicOverview();
  const bySection = useAttendanceBySection();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <KpiCard label="Total students" value={data?.totalStudents ?? '—'} loading={isLoading} icon={Users} tone="info" />
      <KpiCard label="Attendance" value={data?.attendanceRate != null ? `${data.attendanceRate}%` : '—'} loading={isLoading} icon={TrendingUp} tone="success" />
      <div className="md:col-span-3">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Attendance by Section</h3>
          {isError ? (
            <EmptyState icon={TrendingUp} title="Unable to load attendance data" description="Please try again in a moment." />
          ) : bySection.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {bySection.map((section) => (
                <div key={section.section} className="rounded-lg border border-border/60 p-3">
                  <div className="text-xs text-muted-foreground">{section.section}</div>
                  <div className="text-lg font-semibold">{section.avg}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attendance records available.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
