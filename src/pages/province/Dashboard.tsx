import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useSubmissionActions } from '@/hooks/useSubmissionActions';
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { SubmissionList } from '@/components/SubmissionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, BarChart3, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function ProvinceDashboard() {
  const { profile } = useAuth();
  const province = profile?.province;

  const { data, loading, error, refetch } = useSubmissions({
    province: province ?? undefined,
    enabled: !!province,
  });

  const { approve, reject, isUpdating } = useSubmissionActions();

  // District breakdown
  const { data: districtBreakdown } = useQuery({
    queryKey: ['district-breakdown', province],
    queryFn: async () => {
      if (!province) return [];
      const { data } = await supabase
        .from('schools')
        .select('district')
        .eq('province', province);
      const counts: Record<string, number> = {};
      for (const s of data ?? []) {
        if (s.district) counts[s.district] = (counts[s.district] || 0) + 1;
      }
      return Object.entries(counts).map(([name, schoolCount]) => ({ name, schoolCount })).sort((a, b) => b.schoolCount - a.schoolCount);
    },
    enabled: !!province,
    staleTime: 60_000,
  });

  const stats = data?.stats;
  const recent = data?.submissions.slice(0, 8) ?? [];

  return (
    <div className="space-y-6 bg-background text-foreground p-4 rounded-2xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">داشبورد ولایت</h1>
          <p className="text-sm text-muted-foreground">{province ?? 'ولایت شما'}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          فعال
        </Badge>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-xl flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => refetch()} className="text-sm underline">تلاش دوباره</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard title="ولسوالی‌ها" value={districtBreakdown?.length} icon={<MapPin className="h-4 w-4" />} loading={loading} />
        <DashboardStatCard title="مکاتب" value={data?.schoolCount} icon={<BarChart3 className="h-4 w-4" />} loading={loading} />
        <DashboardStatCard title="دانش‌آموزان" value={data?.totalStudents} icon={<Users className="h-4 w-4" />} loading={loading} format />
        <DashboardStatCard title="در انتظار" value={stats?.pending} loading={loading} />
      </div>

      {/* District Breakdown */}
      {districtBreakdown && districtBreakdown.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-sm">ولسوالی‌ها</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {districtBreakdown.map((d) => (
              <div key={d.name} className="flex justify-between items-center p-3 rounded-xl border hover:bg-muted/50 transition">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{d.name}</p>
                </div>
                <Badge variant="outline" className="text-xs">{d.schoolCount} مکتب</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Performance */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">کل ارسال‌ها</p>
            {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold">{stats?.total ?? 0}</p>}
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">تأیید شده</p>
            {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold">{stats?.approved ?? 0}</p>}
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">در انتظار</p>
            {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold">{stats?.pending ?? 0}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Submissions with Actions */}
      <SubmissionList
        title="ارسال‌های اخیر"
        submissions={recent}
        loading={loading}
        showActions
        onApprove={approve}
        onReject={(id, table) => reject(id, table)}
        actionLoading={isUpdating}
      />
    </div>
  );
}
