import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions, SubmissionStatus } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

/* ------------------------------------------------------------------ */
/*  STATUS UI MAP                                                      */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; className: string }> = {
  approved: { label: 'تأیید شده', className: 'bg-accent/10 text-accent border-accent/20' },
  pending:  { label: 'در انتظار', className: 'bg-warning/10 text-warning border-warning/20' },
  rejected: { label: 'رد شده',    className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const TYPE_LABELS: Record<string, string> = {
  statistics: 'آمار',
  report: 'گزارش',
  form: 'فورم',
};

/* ------------------------------------------------------------------ */
/*  DASHBOARD                                                          */
/* ------------------------------------------------------------------ */

export default function DistrictDashboard() {
  const { profile } = useAuth();
  const district = profile?.district;

  const { data, loading, error, refetch } = useSubmissions({
    district: district ?? undefined,
    enabled: !!district,
  });

  const stats = data?.stats;
  const recent = data?.submissions.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 space-y-8">

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">داشبورد ولسوالی</h1>
        <p className="text-sm text-muted-foreground">{district ?? 'ولسوالی شما'}</p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => refetch()} className="text-sm underline">تلاش دوباره</button>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="مکاتب" value={data?.schoolCount} loading={loading} />
        <StatCard title="مجموع ارسال" value={stats?.total} loading={loading} />
        <StatCard title="تأیید شده" value={stats?.approved} loading={loading} />
        <StatCard title="در انتظار" value={stats?.pending} loading={loading} />
      </div>

      {/* ACTION CARD */}
      <Link to="/district/submissions">
        <Card className="group cursor-pointer border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="flex justify-between items-center p-4">
            <span className="font-medium text-sm">مشاهده تمام ارسال‌ها</span>
            <Eye className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
          </CardContent>
        </Card>
      </Link>

      {/* RECENT */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">فعالیت‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">هنوز ارسالی وجود ندارد</p>
          ) : (
            <div className="space-y-2">
              {recent.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-3 rounded-xl border hover:bg-muted/50 transition">
                  <div>
                    <p className="text-sm font-medium">{TYPE_LABELS[s.type] ?? s.type}</p>
                    <p className="text-xs text-muted-foreground">{s.district}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${STATUS_CONFIG[s.status].className}`}>
                      {STATUS_CONFIG[s.status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), 'd MMM')}
                    </span>
                  </div>
                </div>
              ))}

              <Button asChild variant="outline" className="w-full mt-3" size="sm">
                <Link to="/district/submissions">مشاهده لیست کامل</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STAT CARD                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ title, value, loading }: { title: string; value?: number; loading: boolean }) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-16 rounded" />
        ) : (
          <div className="text-xl font-bold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
