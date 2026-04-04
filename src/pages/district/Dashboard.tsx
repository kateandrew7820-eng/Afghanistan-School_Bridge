import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useSubmissionActions } from '@/hooks/useSubmissionActions';
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { SubmissionList } from '@/components/SubmissionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, School, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

export default function DistrictDashboard() {
  const { profile } = useAuth();
  const district = profile?.district;

  const { data, loading, error, refetch } = useSubmissions({
    district: district ?? undefined,
    enabled: !!district,
  });

  const { approve, reject, isUpdating } = useSubmissionActions();

  // Schools in district
  const { data: schools } = useQuery({
    queryKey: ['district-schools', district],
    queryFn: async () => {
      if (!district) return [];
      const { data } = await supabase
        .from('schools')
        .select('id, name, code')
        .eq('district', district)
        .eq('is_active', true);
      return data ?? [];
    },
    enabled: !!district,
    staleTime: 60_000,
  });

  const stats = data?.stats;
  const recent = data?.submissions.slice(0, 8) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">داشبورد ولسوالی</h1>
        <p className="text-sm text-muted-foreground">{district ?? 'ولسوالی شما'}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => refetch()} className="text-sm underline">تلاش دوباره</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashboardStatCard title="مکاتب" value={schools?.length ?? data?.schoolCount} loading={loading} icon={<School className="w-4 h-4" />} />
        <DashboardStatCard title="مجموع ارسال" value={stats?.total} loading={loading} />
        <DashboardStatCard title="تأیید شده" value={stats?.approved} loading={loading} />
        <DashboardStatCard title="در انتظار" value={stats?.pending} loading={loading} />
      </div>

      {/* Schools List */}
      {schools && schools.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-sm">مکاتب ولسوالی</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {schools.slice(0, 6).map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3 rounded-xl border hover:bg-muted/50 transition">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{s.name}</p>
                </div>
                {s.code && <span className="text-xs text-muted-foreground">{s.code}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Submissions with Approve/Reject */}
      <SubmissionList
        title="ارسال‌های اخیر"
        submissions={recent}
        loading={loading}
        showActions
        onApprove={approve}
        onReject={(id, table) => reject(id, table)}
        actionLoading={isUpdating}
      />

      {/* Action Card */}
      <Link to="/district/submissions">
        <Card className="group cursor-pointer border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="flex justify-between items-center p-4">
            <span className="font-medium text-sm">مشاهده تمام ارسال‌ها</span>
            <Eye className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
