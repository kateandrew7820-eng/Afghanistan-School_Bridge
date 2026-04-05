import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3, School, Users, CheckCircle2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STATUS_COLORS = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)'];

export default function ProvinceAnalytics() {
  const { profile } = useAuth();
  const { data, loading } = useSubmissions({ province: profile?.province });

  const statusData = data ? [
    { name: 'در انتظار', value: data.stats.pending },
    { name: 'تأیید شده', value: data.stats.approved },
    { name: 'رد شده', value: data.stats.rejected },
  ] : [];

  // Group submissions by type
  const typeData = data ? [
    { name: 'آمار', count: data.submissions.filter(s => s.type === 'statistics').length },
    { name: 'گزارش', count: data.submissions.filter(s => s.type === 'report').length },
    { name: 'فورم', count: data.submissions.filter(s => s.type === 'form').length },
  ] : [];

  const approvalRate = data && data.stats.total > 0
    ? Math.round((data.stats.approved / data.stats.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          تحلیل و آمار
        </h1>
        <p className="text-muted-foreground">تحلیل داده‌های ولایت {profile?.province}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard title="کل ارسال‌ها" value={data?.stats.total ?? 0} icon={BarChart3} />
        <DashboardStatCard title="نرخ تأیید" value={`${approvalRate}%`} icon={CheckCircle2} />
        <DashboardStatCard title="مکاتب" value={data?.schoolCount ?? 0} icon={School} />
        <DashboardStatCard title="در انتظار" value={data?.stats.pending ?? 0} icon={Clock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ارسال‌ها بر اساس نوع</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">وضعیت ارسال‌ها</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
