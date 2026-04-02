import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, BarChart3, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

/* ------------------------------------------------------------------ */
/*  DASHBOARD                                                          */
/* ------------------------------------------------------------------ */

export default function ProvinceDashboard() {
  const { profile } = useAuth();
  const province = profile?.province;

  const { data, loading, error, refetch } = useSubmissions({
    province: province ?? undefined,
    enabled: !!province,
  });

  // Distinct districts count
  const { data: districtCount } = useQuery({
    queryKey: ['district-count', province],
    queryFn: async () => {
      if (!province) return 0;
      const { data } = await supabase
        .from('schools')
        .select('district')
        .eq('province', province);
      return new Set((data ?? []).map((s) => s.district)).size;
    },
    enabled: !!province,
    staleTime: 60_000,
  });

  const stats = data?.stats;

  return (
    <div className="space-y-6 bg-background text-foreground p-4 rounded-2xl">

      {/* HEADER */}
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

      {/* ERROR */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-xl flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => refetch()} className="text-sm underline">تلاش دوباره</button>
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard title="ولسوالی‌ها" value={districtCount} icon={MapPin} loading={loading} />
        <StatCard title="مکاتب" value={data?.schoolCount} icon={BarChart3} loading={loading} />
        <StatCard title="دانش‌آموزان" value={data?.totalStudents} icon={Users} loading={loading} format />
        <StatCard title="در انتظار" value={stats?.pending} icon={AlertCircle} loading={loading} />
      </div>

      {/* PERFORMANCE */}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STAT CARD                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  format: doFormat,
}: {
  title: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  format?: boolean;
}) {
  const display = doFormat ? (value ?? 0).toLocaleString('fa-AF') : (value ?? 0);

  return (
    <Card className="border shadow-sm hover:shadow-md transition">
      <CardHeader className="flex flex-row justify-between pb-1">
        <CardTitle className="text-xs text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-7 w-16 rounded" /> : <div className="text-xl font-bold">{display}</div>}
      </CardContent>
    </Card>
  );
}
