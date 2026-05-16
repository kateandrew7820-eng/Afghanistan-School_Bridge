import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useSubmissionActions } from '@/hooks/useSubmissionActions';
import { supabase } from '@/integrations/supabase/client';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge, normalizeStatus, TYPE_LABELS } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import {
  School, BarChart3, CheckCircle2, Clock, XCircle, Inbox,
  Check, X, ArrowLeft, Eye,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DistrictDashboard() {
  const { profile } = useAuth();
  const district = profile?.district ?? undefined;

  const { data, loading, error, refetch } = useSubmissions({ district, enabled: !!district });
  const { approve, reject, isUpdating } = useSubmissionActions();

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
  const submissions = data?.submissions ?? [];

  const pendingItems = useMemo(
    () => submissions.filter((s) => normalizeStatus(s.status) === 'pending').slice(0, 5),
    [submissions]
  );
  const recent = submissions.slice(0, 6);
  const completionRate = stats && stats.total > 0
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">داشبورد ولسوالی</h1>
          <p className="text-sm text-muted-foreground mt-1">
            خلاصه فعالیت و کارهای در انتظار برای {district ?? 'ولسوالی شما'}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/district/verify">
            <CheckCircle2 className="h-4 w-4 me-1.5" />
            بازکردن صندوق تأیید
          </Link>
        </Button>
      </header>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => refetch()} className="text-sm underline hover:no-underline">تلاش دوباره</button>
        </div>
      )}

      {/* KPIs */}
      <section aria-label="شاخص‌های کلیدی" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="مکاتب فعال" value={schools?.length ?? data?.schoolCount}
          icon={School} tone="info" loading={loading}
          to="/district/schools" hint="مکاتب ولسوالی شما"
        />
        <KpiCard
          label="مجموع ارسال‌ها" value={stats?.total}
          icon={BarChart3} tone="default" loading={loading}
          hint={`${completionRate}% تأیید شده`}
        />
        <KpiCard
          label="تأیید شده" value={stats?.approved}
          icon={CheckCircle2} tone="success" loading={loading}
        />
        <KpiCard
          label="در انتظار" value={stats?.pending}
          icon={Clock} tone="warning" loading={loading}
          to="/district/verify"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Action Required */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">نیازمند اقدام</CardTitle>
              {pendingItems.length > 0 && (
                <span className="text-[10px] font-bold bg-warning/15 text-warning px-1.5 py-0.5 rounded-full">
                  {pendingItems.length}
                </span>
              )}
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/district/verify">
                مشاهده همه <ArrowLeft className="h-3 w-3 ms-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))
            ) : pendingItems.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="همه چیز در جریان است"
                description="هیچ ارسال در انتظار بررسی وجود ندارد."
              />
            ) : (
              pendingItems.map((s) => (
                <div
                  key={`${s.type}-${s.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {TYPE_LABELS[s.type] ?? s.type}
                      </span>
                      <StatusBadge status={s.status} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {(s as any).schools?.name ?? 'مکتب نامشخص'} • {format(new Date(s.created_at), 'd MMM، HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm" variant="outline"
                      className="h-8 px-2 text-success border-success/30 hover:bg-success/10 hover:text-success"
                      onClick={() => approve(s.id, s.type === 'statistics' ? 'statistics_submissions' : s.type === 'report' ? 'report_submissions' : 'form_submissions')}
                      disabled={isUpdating}
                      aria-label="تأیید"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="h-8 px-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => reject(s.id, s.type === 'statistics' ? 'statistics_submissions' : s.type === 'report' ? 'report_submissions' : 'form_submissions')}
                      disabled={isUpdating}
                      aria-label="رد"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Schools snapshot */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">مکاتب</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/district/schools">
                همه <ArrowLeft className="h-3 w-3 ms-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {schools && schools.length > 0 ? (
              schools.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center p-2.5 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  {s.code && <span className="text-[10px] text-muted-foreground font-mono">{s.code}</span>}
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-muted-foreground py-6">مکتبی ثبت نشده است</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">فعالیت اخیر</CardTitle>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/district/submissions">
              مشاهده همه <ArrowLeft className="h-3 w-3 ms-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))
          ) : recent.length === 0 ? (
            <EmptyState
              icon={Inbox} title="هنوز فعالیتی نیست"
              description="با ثبت ارسال‌ها در مکاتب، در اینجا نمایش داده می‌شود."
            />
          ) : (
            recent.map((s) => (
              <div
                key={`${s.type}-${s.id}`}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <StatusBadge status={s.status} size="sm" />
                  <span className="text-sm font-medium truncate">{TYPE_LABELS[s.type] ?? s.type}</span>
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                    • {(s as any).schools?.name ?? 'مکتب'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(s.created_at), 'd MMM')}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
