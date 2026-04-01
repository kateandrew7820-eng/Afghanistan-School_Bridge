import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, School, Users, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  DASHBOARD                                                          */
/* ------------------------------------------------------------------ */

export default function MinistryDashboard() {
  const { isDemoMode } = useAuth();
  const { t } = useTranslation();

  // All submissions (no province/district filter = national)
  const { data, loading, error, refetch } = useSubmissions({ enabled: !isDemoMode });

  // Province count from schools
  const { data: provinceCount } = useQuery({
    queryKey: ['province-count'],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('province');
      return new Set((data ?? []).map((s) => s.province)).size;
    },
    enabled: !isDemoMode,
    staleTime: 60_000,
  });

  // Demo mode fallback
  const stats = useMemo(() => {
    if (isDemoMode) {
      return {
        provinces: 34, schools: 1200, students: 925000, teachers: 26000,
        total: 4800, pending: 1900, approved: 2900, rejected: 0,
      };
    }
    return {
      provinces: provinceCount ?? 0,
      schools: data?.schoolCount ?? 0,
      students: data?.totalStudents ?? 0,
      teachers: data?.totalTeachers ?? 0,
      total: data?.stats.total ?? 0,
      pending: data?.stats.pending ?? 0,
      approved: data?.stats.approved ?? 0,
      rejected: data?.stats.rejected ?? 0,
    };
  }, [isDemoMode, data, provinceCount]);

  const completionRate = stats.total > 0
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;

  const teacherRatio = stats.teachers > 0
    ? Math.round(stats.students / stats.teachers)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('ministry.dashboard')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('ministry.nationalDesc')}</p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => refetch()} className="text-sm underline">تلاش دوباره</button>
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard title="ولایات" value={stats.provinces} icon={<Map className="w-4 h-4" />} loading={loading && !isDemoMode} />
        <KpiCard title="مکاتب" value={stats.schools} icon={<School className="w-4 h-4" />} loading={loading && !isDemoMode} />
        <KpiCard title="شاگردان" value={Math.round(stats.students / 1000)} suffix="K" icon={<Users className="w-4 h-4" />} loading={loading && !isDemoMode} />
        <KpiCard title="معلمان" value={Math.round(stats.teachers / 1000)} suffix="K" icon={<BarChart3 className="w-4 h-4" />} loading={loading && !isDemoMode} />
      </div>

      {/* SECOND ROW */}
      <div className="grid gap-3 md:grid-cols-3">
        <KpiCard title="مجموع ارسال‌ها" value={stats.total} icon={<BarChart3 className="w-4 h-4" />} loading={loading && !isDemoMode} />
        <KpiCard title="تأیید شده" value={stats.approved} icon={<TrendingUp className="w-4 h-4" />} loading={loading && !isDemoMode} subtitle={`${completionRate}% تکمیل`} />
        <KpiCard title="نسبت معلم" value={teacherRatio} icon={<Users className="w-4 h-4" />} loading={loading && !isDemoMode} subtitle="شاگرد به ازای هر معلم" />
      </div>

      {/* ACTIONS */}
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
        <Card className="border bg-muted/30">
          <CardHeader className="flex flex-row justify-between pb-1">
            <CardTitle className="text-sm">تحلیل ملی</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">بینش‌های تجمیعی ولایات</p></CardContent>
        </Card>
      </div>

      {/* INSIGHTS */}
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

/* ------------------------------------------------------------------ */
/*  KPI CARD                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  title, value, icon, loading, subtitle, suffix = '',
}: {
  title: string; value: number; icon: React.ReactNode; loading: boolean; subtitle?: string; suffix?: string;
}) {
  return (
    <Card className="border hover:shadow-md transition">
      <CardHeader className="flex flex-row justify-between pb-1">
        <CardTitle className="text-xs text-muted-foreground font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-7 w-16 rounded" /> : (
          <div className="text-xl font-bold">{value}{suffix}</div>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  INSIGHT ROW                                                        */
/* ------------------------------------------------------------------ */

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition">
      <span className="text-sm">{label}</span>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}
