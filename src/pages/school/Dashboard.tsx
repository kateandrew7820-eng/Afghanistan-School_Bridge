import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { STATUS_CONFIG, TYPE_LABELS } from '@/lib/statusConfig';
import { BarChart3, FileText, ClipboardList, Bell, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function SchoolDashboard() {
  const { profile } = useAuth();
  const { t } = useTranslation();

  const { data, loading, error, refetch } = useSubmissions({
    school_id: profile?.school_id ?? undefined,
    enabled: !!profile?.school_id,
  });

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    async function fetchMeta() {
      const [a, d] = await Promise.all([
        supabase.from('announcements').select('*').eq('is_published', true).limit(3),
        supabase.from('deadlines').select('*').eq('is_active', true).limit(5),
      ]);
      if (a.data) setAnnouncements(a.data);
      if (d.data) setDeadlines(d.data);
      setMetaLoading(false);
    }
    fetchMeta();
  }, []);

  const stats = data?.stats;
  const recent = data?.submissions.slice(0, 5) ?? [];

  const sendItems = [
    { href: '/school/statistics', icon: BarChart3, title: 'ارسال آمار', sub: 'ثبت تعداد شاگردان' },
    { href: '/school/reports', icon: FileText, title: 'ارسال گزارش‌ها', sub: 'گزارش ماهانه' },
    { href: '/school/forms', icon: ClipboardList, title: 'ارسال فورم‌ها', sub: 'تکمیل فورم‌ها' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('school.dashboard')}</h1>
        <p className="text-xs text-muted-foreground">
          {profile?.school_name ?? profile?.full_name} — {profile?.province}
        </p>
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
        <DashboardStatCard title="مجموع ارسال" value={stats?.total} loading={loading} icon={<BarChart3 className="w-4 h-4" />} />
        <DashboardStatCard title="تأیید شده" value={stats?.approved} loading={loading} icon={<CheckCircle2 className="w-4 h-4" />} />
        <DashboardStatCard title="در انتظار" value={stats?.pending} loading={loading} />
        <DashboardStatCard title="رد شده" value={stats?.rejected} loading={loading} />
      </div>

      {/* Quick Send */}
      <div className="grid gap-3 md:grid-cols-3">
        {sendItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} to={item.href}>
              <Card className="group cursor-pointer border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Submissions */}
      {recent.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-sm">ارسال‌های اخیر</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent.map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3 rounded-xl border hover:bg-muted/50 transition">
                <p className="text-sm font-medium">{TYPE_LABELS[s.type] ?? s.type}</p>
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
          </CardContent>
        </Card>
      )}

      {/* Announcements */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">اطلاعیه‌ها</CardTitle>
          </div>
          <Link to="/school/announcements">
            <Button size="sm" variant="ghost">مشاهده همه</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {metaLoading ? <Skeleton className="h-20 w-full" /> : announcements.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">اطلاعیه‌ای وجود ندارد</p>
          ) : announcements.map((a: any) => (
            <div key={a.id} className="p-3 rounded-xl border hover:bg-muted transition mb-2">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Deadlines */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <CardTitle className="text-sm">فرصتها</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {metaLoading ? <Skeleton className="h-20 w-full" /> : deadlines.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">فرصتی وجود ندارد</p>
          ) : deadlines.map((d: any) => (
            <div key={d.id} className="p-3 rounded-xl border hover:bg-muted transition mb-2">
              <p className="text-sm font-medium">{d.title}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(d.due_date), 'MMM dd')}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
