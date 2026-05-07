import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useSubmissionActions } from '@/hooks/useSubmissionActions';
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { SubmissionList } from '@/components/SubmissionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, School, Users, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { NationalTargetsCard } from '@/components/NationalTargetsCard';

export default function MinistryDashboard() {
  const { isDemoMode } = useAuth();
  const { t } = useTranslation();

  const { data, loading, error, refetch } = useSubmissions({ enabled: !isDemoMode });
  const { approve, reject, isUpdating } = useSubmissionActions();

  // Province breakdown
  const { data: provinceBreakdown } = useQuery({
    queryKey: ['province-breakdown'],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('province');
      const counts: Record<string, number> = {};
      for (const s of data ?? []) {
        if (s.province) counts[s.province] = (counts[s.province] || 0) + 1;
      }
      return Object.entries(counts).map(([name, schoolCount]) => ({ name, schoolCount })).sort((a, b) => b.schoolCount - a.schoolCount);
    },
    enabled: !isDemoMode,
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    if (isDemoMode) {
      return {
        provinces: 34, schools: 1200, students: 925000, teachers: 26000,
        total: 4800, pending: 1900, approved: 2900, rejected: 0,
      };
    }
    return {
      provinces: provinceBreakdown?.length ?? 0,
      schools: data?.schoolCount ?? 0,
      students: data?.totalStudents ?? 0,
      teachers: data?.totalTeachers ?? 0,
      total: data?.stats.total ?? 0,
      pending: data?.stats.pending ?? 0,
      approved: data?.stats.approved ?? 0,
      rejected: data?.stats.rejected ?? 0,
    };
  }, [isDemoMode, data, provinceBreakdown]);

  const completionRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  const teacherRatio = stats.teachers > 0 ? Math.round(stats.students / stats.teachers) : 0;
  const recent = data?.submissions.slice(0, 8) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('ministry.dashboard')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('ministry.nationalDesc')}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => refetch()} className="text-sm underline">تلاش دوباره</button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard title="ولایات" value={stats.provinces} icon={<Map className="w-4 h-4" />} loading={loading && !isDemoMode} />
        <DashboardStatCard title="مکاتب" value={stats.schools} icon={<School className="w-4 h-4" />} loading={loading && !isDemoMode} />
        <DashboardStatCard title="شاگردان" value={Math.round(stats.students / 1000)} suffix="K" icon={<Users className="w-4 h-4" />} loading={loading && !isDemoMode} />
        <DashboardStatCard title="معلمان" value={Math.round(stats.teachers / 1000)} suffix="K" icon={<BarChart3 className="w-4 h-4" />} loading={loading && !isDemoMode} />
      </div>

      {/* Second Row */}
      <div className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard title="مجموع ارسال‌ها" value={stats.total} icon={<BarChart3 className="w-4 h-4" />} loading={loading && !isDemoMode} />
        <DashboardStatCard title="تأیید شده" value={stats.approved} icon={<TrendingUp className="w-4 h-4" />} loading={loading && !isDemoMode} subtitle={`${completionRate}% تکمیل`} />
        <DashboardStatCard title="نسبت معلم" value={teacherRatio} icon={<Users className="w-4 h-4" />} loading={loading && !isDemoMode} subtitle="شاگرد به ازای هر معلم" />
      </div>

      {/* Province Breakdown */}
      {provinceBreakdown && provinceBreakdown.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-sm">ولایات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {provinceBreakdown.slice(0, 10).map((p) => (
              <div key={p.name} className="flex justify-between items-center p-3 rounded-xl border hover:bg-muted/50 transition">
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{p.name}</p>
                </div>
                <Badge variant="outline" className="text-xs">{p.schoolCount} مکتب</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submissions with Actions */}
      {!isDemoMode && (
        <SubmissionList
          title="ارسال‌های اخیر ملی"
          submissions={recent}
          loading={loading}
          showActions
          onApprove={approve}
          onReject={(id, table) => reject(id, table)}
          actionLoading={isUpdating}
        />
      )}

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-3">
        <Link to="/ministry/submissions">
          <Card className="group cursor-pointer border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="flex flex-row justify-between pb-1">
              <CardTitle className="text-sm group-hover:text-foreground transition">مشاهده تمام ارسال‌ها</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">مرور ملی ارسال‌ها</p></CardContent>
          </Card>
        </Link>
        <Link to="/ministry/analytics">
          <Card className="border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="flex flex-row justify-between pb-1">
              <CardTitle className="text-sm">تحلیل ملی</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">بینش‌های تجمیعی ولایات</p></CardContent>
          </Card>
        </Link>
      </div>

      {/* Insights */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4" /> بینش‌های تجمیعی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(loading && !isDemoMode) ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (
            <>
              <InsightRow label="نرخ تکمیل ارسال" value={`${completionRate}%`} />
              <InsightRow label="ولایات فعال" value={`${stats.provinces}/34`} />
              <InsightRow label="در انتظار بررسی" value={`${stats.pending}`} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition">
      <span className="text-sm">{label}</span>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}
