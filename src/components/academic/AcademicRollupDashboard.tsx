import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, School, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { parseAcademicRollup, type RollupLevel, type RollupGroup } from '@/lib/academicRollup';

const numberFormat = new Intl.NumberFormat('fa-AF');
const formatCount = (value: number) => numberFormat.format(value);
const formatRate = (value: number | null) => value === null ? '—' : `${numberFormat.format(value)}٪`;

interface AcademicRollupDashboardProps {
  level: RollupLevel;
}

export function AcademicRollupDashboard({ level }: AcademicRollupDashboardProps) {
  const [academicYear, setAcademicYear] = useState('');
  const [gender, setGender] = useState('all');
  const [subject, setSubject] = useState('');
  const [drillPath, setDrillPath] = useState<Array<{
    level: RollupLevel;
    province: string | null;
    district: string | null;
    title: string;
  }>>([]);
  const currentDrill = drillPath[drillPath.length - 1];
  const viewLevel = currentDrill?.level ?? level;
  const provinceScope = currentDrill?.province ?? null;
  const districtScope = currentDrill?.district ?? null;

  const query = useQuery({
    queryKey: ['academic-admin-rollup', viewLevel, provinceScope, districtScope, academicYear, gender, subject],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_academic_admin_rollup', {
        _level: viewLevel,
        _academic_year: academicYear || null,
        _gender: gender,
        _subject: subject || null,
        _province: provinceScope,
        _district: districtScope,
      });
      if (error) throw error;
      if (!data) throw new Error('داده‌ای برای داشبورد تحصیلی دریافت نشد.');
      return parseAcademicRollup(data);
    },
    staleTime: 5 * 60_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const data = query.data;
  const summary = data?.summary;
  const heading = viewLevel === 'district'
    ? 'مقایسه مکاتب ولسوالی'
    : viewLevel === 'province'
      ? 'مقایسه ولسوالی‌های ولایت'
      : 'مقایسه ولایات';

  const drillInto = (group: RollupGroup) => {
    if (viewLevel === 'ministry') {
      setDrillPath([...drillPath, {
        level: 'province',
        province: group.id,
        district: null,
        title: group.label,
      }]);
    } else if (viewLevel === 'province') {
      setDrillPath([...drillPath, {
        level: 'district',
        province: provinceScope,
        district: group.id,
        title: group.label,
      }]);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby={`academic-rollup-${level}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`academic-rollup-${level}`} className="text-lg font-semibold">نظارت تحصیلی</h2>
          <p className="text-sm text-muted-foreground">
            آمار بر اساس گزارش‌های تأییدشده مکاتب و ارزیابی‌های ثبت‌شده
          </p>
        </div>
        {currentDrill && (
          <button type="button" className="text-sm text-primary underline" onClick={() => setDrillPath(drillPath.slice(0, -1))}>
            بازگشت از {currentDrill.title}
          </button>
        )}
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
          <Select value={academicYear || 'latest'} onValueChange={(value) => setAcademicYear(value === 'latest' ? '' : value)}>
            <SelectTrigger aria-label="سال تعلیمی">
              <SelectValue placeholder="همه سال‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">آخرین گزارش هر مکتب</SelectItem>
              {data?.years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger aria-label="جنسیت">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه شاگردان</SelectItem>
              <SelectItem value="male">پسران</SelectItem>
              <SelectItem value="female">دختران</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subject || 'all'} onValueChange={(value) => setSubject(value === 'all' ? '' : value)}>
            <SelectTrigger aria-label="مضمون">
              <SelectValue placeholder="همه مضامین" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه مضامین</SelectItem>
              {data?.subjects.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{query.error instanceof Error ? query.error.message : 'دریافت معلومات ناموفق بود.'}</span>
          <button type="button" className="underline" onClick={() => void query.refetch()}>تلاش دوباره</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard title="مکاتب گزارش‌دهنده" value={summary ? `${formatCount(summary.reportingSchools)} / ${formatCount(summary.totalSchools)}` : undefined} icon={<School className="h-4 w-4" />} loading={query.isPending} />
        <MetricCard title="شاگردان ثبت‌شده" value={summary ? formatCount(summary.students) : undefined} icon={<Users className="h-4 w-4" />} loading={query.isPending} />
        <MetricCard
          title="حاضری گزارش‌شده"
          value={summary ? formatRate(summary.attendanceRate) : undefined}
          detail={summary?.previousAttendanceRate === null || summary?.previousAttendanceRate === undefined
            ? 'گزارش قبلی در دسترس نیست'
            : `گزارش قبلی: ${formatRate(summary.previousAttendanceRate)}`}
          icon={<BarChart3 className="h-4 w-4" />}
          loading={query.isPending}
        />
        <MetricCard title="میانگین نمره ثبت‌شده" value={summary?.averageScore === null || summary?.averageScore === undefined ? '—' : numberFormat.format(summary.averageScore)} icon={<BarChart3 className="h-4 w-4" />} loading={query.isPending} />
      </div>

      {summary && summary.decliningSchools > 0 && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{formatCount(summary.decliningSchools)} مکتب با کاهش حداقل ۵ واحد درصدی حاضری نسبت به گزارش قبلی شناسایی شد.</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{heading}</CardTitle>
          {data?.academicYear && <p className="text-xs text-muted-foreground">سال تعلیمی: {data.academicYear}</p>}
        </CardHeader>
        <CardContent>
          {query.isPending ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
          ) : !data?.groups.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">برای نمایش مقایسه، مکتب فعالی ثبت نشده است.</p>
          ) : (
            <div className="space-y-2">
              <div className="hidden grid-cols-[minmax(8rem,1fr)_minmax(6rem,1.2fr)_5rem_7rem_7rem] gap-3 px-3 text-xs text-muted-foreground sm:grid">
                <span>واحد</span><span>حاضری</span><span>شاگردان</span><span>مکاتب گزارش‌دهنده</span><span>کاهش حاضری</span>
              </div>
              {data.groups.map((group) => (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => drillInto(group)}
                  disabled={viewLevel === 'district'}
                  className="grid w-full gap-2 rounded-lg border bg-background p-3 text-start transition-colors enabled:hover:border-primary/40 enabled:hover:bg-muted/30 disabled:cursor-default sm:grid-cols-[minmax(8rem,1fr)_minmax(6rem,1.2fr)_5rem_7rem_7rem] sm:items-center sm:gap-3"
                  aria-label={viewLevel === 'district' ? group.label : `نمایش جزییات ${group.label}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{group.label}</p>
                    {group.averageScore !== null && <p className="text-xs text-muted-foreground">میانگین نمره: {numberFormat.format(group.averageScore)}</p>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{formatRate(group.attendanceRate)}</span>
                      {group.previousAttendanceRate !== null && <span className="text-muted-foreground">قبلی: {formatRate(group.previousAttendanceRate)}</span>}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, group.attendanceRate ?? 0))}%` }} />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm">{formatCount(group.students)} <span className="sm:hidden">شاگرد</span></p>
                  <p className="text-xs sm:text-sm">{formatCount(group.reportingSchools)} / {formatCount(group.totalSchools)} <span className="sm:hidden">مکتب گزارش‌دهنده</span></p>
                  <p className="text-xs sm:text-sm">{formatCount(group.decliningSchools)} <span className="sm:hidden">کاهش حاضری</span></p>
                </button>
              ))}
            </div>
          )}
          {summary && (
            <p className="mt-3 text-xs text-muted-foreground">
              {formatCount(summary.assessmentCount)} ارزیابی تأییدشده در میانگین نمره محاسبه شده است.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function MetricCard({ title, value, detail, icon, loading }: { title: string; value?: string; detail?: string; icon: ReactNode; loading: boolean }) {
  return (
    <Card>
      <CardContent className="flex min-h-24 items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          {loading ? <Skeleton className="mt-2 h-6 w-16" /> : <p className="truncate text-lg font-bold">{value ?? '—'}</p>}
          {!loading && detail && <p className="truncate text-[10px] text-muted-foreground">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
