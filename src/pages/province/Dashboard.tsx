import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, BarChart3, AlertCircle, Users, Loader2, TrendingUp } from 'lucide-react';

/* ---------------- TYPES ---------------- */
type Status = 'pending' | 'approved' | 'rejected';

interface Stats {
  districts: number;
  schools: number;
  submissions: number;
  pending: number;
  approved: number;
  students: number;
}

/* ---------------- DATA HOOK ---------------- */
function useProvinceStats(province?: string) {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!province) return;

    try {
      setLoading(true);
      setError(null);

      const [schoolsRes, statsRes, reportsRes, formsRes] = await Promise.all([
        supabase.from('schools')
          .select('district')
          .eq('province', province),

        supabase.from('statistics_submissions')
          .select('status,total_students')
          .eq('province', province),

        supabase.from('report_submissions')
          .select('status')
          .eq('province', province),

        supabase.from('form_submissions')
          .select('status')
          .eq('province', province)
      ]);

      const schools = schoolsRes.data || [];
      const stats = statsRes.data || [];
      const reports = reportsRes.data || [];
      const forms = formsRes.data || [];

      const all = [...stats, ...reports, ...forms];

      // single-pass aggregation ⚡
      let pending = 0;
      let approved = 0;

      for (const s of all) {
        const status = normalizeStatus(s.status);
        if (status === 'pending') pending++;
        if (status === 'approved') approved++;
      }

      const result: Stats = {
        districts: new Set(schools.map(s => s.district)).size,
        schools: schools.length,
        submissions: all.length,
        pending,
        approved,
        students: stats.reduce((sum, s: any) => sum + (s.total_students || 0), 0)
      };

      setData(result);

    } catch (err: any) {
      setError('خطا در دریافت داده‌ها');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [province]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/* ---------------- HELPERS ---------------- */
function normalizeStatus(status: string): Status {
  if (!status) return 'pending';

  if (['pending', 'در انتظار تأیید'].includes(status)) return 'pending';
  if (['approved', 'تأیید شده'].includes(status)) return 'approved';
  return 'rejected';
}

/* ---------------- UI COMPONENT ---------------- */
function StatCard({ title, value, icon: Icon, loading }: any) {
  return (
    <Card className="bg-white border shadow-sm hover:shadow-md transition">
      <CardHeader className="flex flex-row justify-between pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-900" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <div className="h-6 w-16 bg-slate-200 animate-pulse rounded" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- MAIN ---------------- */
export default function ProvinceDashboard() {
  const { profile } = useAuth();
  const province = profile?.province;

  const { data, loading, error, refetch } = useProvinceStats(province);

  const stats = useMemo(() => data, [data]);

  return (
    <div className="space-y-6 bg-white text-slate-800 p-4 rounded-2xl">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">داشبورد ولایت</h1>
          <p className="text-sm text-slate-500">
            {province || 'ولایت شما'}
          </p>
        </div>

        <Badge className="bg-slate-100 text-slate-700 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          فعال
        </Badge>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border text-red-700 p-3 rounded-xl flex justify-between items-center">
          <span>{error}</span>
          <button onClick={refetch} className="text-sm underline">تلاش دوباره</button>
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="ولسوالی‌ها" value={stats?.districts} icon={MapPin} loading={loading} />
        <StatCard title="مکاتب" value={stats?.schools} icon={BarChart3} loading={loading} />
        <StatCard title="دانش‌آموزان" value={stats?.students?.toLocaleString('fa-AF')} icon={Users} loading={loading} />
        <StatCard title="در انتظار" value={stats?.pending} icon={AlertCircle} loading={loading} />
      </div>

      {/* PERFORMANCE */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p>کل ارسال‌ها</p><p className="text-2xl font-bold">{stats?.submissions}</p></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="p-4"><p>تأیید شده</p><p className="text-2xl font-bold">{stats?.approved}</p></CardContent></Card>
        <Card className="bg-amber-50"><CardContent className="p-4"><p>در انتظار</p><p className="text-2xl font-bold">{stats?.pending}</p></CardContent></Card>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin" />
        </div>
      )}

    </div>
  );
}
