import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { KpiCard } from '@/components/KpiCard';
import { Sparkline } from '@/components/Sparkline';
import { Timeline, TimelineEvent, TIMELINE_ICONS } from '@/components/Timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { gradeBand, useSectionDashboard } from '@/hooks/useAcademic';
import { Award, CalendarCheck, Grid3x3, Users, AlertTriangle, BookOpen } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fa-AF', { maximumFractionDigits: 1 });
const int = (n: number) => n.toLocaleString('fa-AF');

const TODAY_TILES = [
  { key: 'present', label: 'حاضر', className: 'text-success' },
  { key: 'absent', label: 'غایب', className: 'text-destructive' },
  { key: 'late', label: 'تأخیر', className: 'text-warning' },
  { key: 'excused', label: 'رخصتی', className: 'text-muted-foreground' },
] as const;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function ClassDashboard() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useSectionDashboard(sectionId ?? null);

  const activityEvents = useMemo<TimelineEvent[]>(
    () => (data?.activity ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      timestamp: a.date,
      tone: a.kind === 'attendance' ? 'info' : 'success',
      icon: a.kind === 'attendance' ? TIMELINE_ICONS.CheckCircle2 : TIMELINE_ICONS.FileText,
    })),
    [data?.activity],
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <PageHeader title="داشبورد صنف" backTo="/school/academic/sections" icon={<Grid3x3 className="h-7 w-7" />} />
        <EmptyState
          icon={Grid3x3}
          title="بخش یافت نشد"
          description="این بخش وجود ندارد یا به مکتب شما تعلق ندارد."
          action={<Button onClick={() => navigate('/school/academic/sections')}>بازگشت به فهرست بخش‌ها</Button>}
        />
      </div>
    );
  }

  const {
    section, homeroom_teacher_name, total_students, male_students, female_students,
    today, overall_attendance_rate, attendance_trend, subject_averages, class_average,
    top_students, at_risk_students,
  } = data;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <PageHeader
        title={`${section.grade_name} — ${section.name}`}
        description={`سال تحصیلی ${section.academic_year_name}`}
        backTo="/school/academic/sections"
        icon={<Grid3x3 className="h-7 w-7" />}
      />

      {/* Class info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={section.status === 'active' ? 'success' : 'muted'}>
              {section.status === 'active' ? 'فعال' : 'بایگانی شده'}
            </Badge>
            <Badge variant="outline">ظرفیت: {int(section.capacity)}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <InfoRow label="صنف" value={section.grade_name} />
            <InfoRow label="نام بخش" value={section.name} />
            <InfoRow label="سال تحصیلی" value={section.academic_year_name} />
            <InfoRow label="سرمعلم صنف" value={homeroom_teacher_name || '—'} />
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="مجموع شاگردان"
          value={int(total_students)}
          icon={Users}
          hint={`${int(section.capacity)} ظرفیت`}
        />
        <KpiCard
          label="پسر / دختر"
          value={`${int(male_students)} / ${int(female_students)}`}
          icon={Users}
          tone="info"
          hint="توزیع جنسیت"
        />
        <KpiCard
          label="فیصدی حضور کلی"
          value={overall_attendance_rate === null ? '—' : `${fmt(overall_attendance_rate)}٪`}
          icon={CalendarCheck}
          tone="success"
          sparkline={attendance_trend}
        />
        <KpiCard
          label="اوسط صنف"
          value={class_average === null ? '—' : `${fmt(class_average)}٪`}
          icon={Award}
          tone="warning"
          hint={class_average === null ? 'نمره‌ای ثبت نشده' : gradeBand(class_average).label}
        />
      </div>

      {/* Today attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4" />
            حاضری امروز
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!today.recorded ? (
            <p className="text-sm text-muted-foreground py-2">حاضری امروز هنوز ثبت نشده است.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TODAY_TILES.map((tile) => (
                <div key={tile.key} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{tile.label}</p>
                  <p className={`text-lg font-semibold ${tile.className}`}>{int(today[tile.key])}</p>
                </div>
              ))}
            </div>
          )}
          {attendance_trend.length > 1 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">روند حضور صنف (۳۰ روز اخیر)</p>
              <Sparkline data={attendance_trend} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject averages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            اوسط نمرات بر اساس مضمون
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subject_averages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">هنوز نمره‌ای برای این بخش ثبت نشده است.</p>
          ) : (
            <ul className="divide-y">
              {subject_averages.map((s) => {
                const band = gradeBand(s.percent);
                return (
                  <li key={s.subject_id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.subject_name}</p>
                      <p className="text-xs text-muted-foreground">{int(s.graded_students)} شاگرد نمره‌دار</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">{fmt(s.percent)}٪</span>
                      <Badge variant={band.variant}>{band.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              شاگردان ممتاز
            </CardTitle>
          </CardHeader>
          <CardContent>
            {top_students.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">هنوز نمره‌ای ثبت نشده است.</p>
            ) : (
              <ol className="divide-y">
                {top_students.map((s, i) => (
                  <li key={s.student_id} className="flex items-center justify-between gap-3 py-2.5">
                    <button
                      type="button"
                      className="flex items-center gap-2 min-w-0 text-start hover:underline"
                      onClick={() => navigate(`/school/academic/students/${s.student_id}`)}
                    >
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{int(i + 1)}.</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">{s.full_name}</span>
                        <span className="block text-xs text-muted-foreground">{s.student_code}</span>
                      </span>
                    </button>
                    <Badge variant={gradeBand(s.average ?? 0).variant}>{fmt(s.average ?? 0)}٪</Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Needs attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              شاگردان نیازمند توجه
            </CardTitle>
          </CardHeader>
          <CardContent>
            {at_risk_students.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">هیچ شاگردی در حال حاضر نیاز به توجه ندارد.</p>
            ) : (
              <ul className="divide-y">
                {at_risk_students.map((s) => (
                  <li key={s.student_id} className="flex items-center justify-between gap-3 py-2.5">
                    <button
                      type="button"
                      className="min-w-0 text-start hover:underline"
                      onClick={() => navigate(`/school/academic/students/${s.student_id}`)}
                    >
                      <span className="block text-sm font-medium truncate">{s.full_name}</span>
                      <span className="block text-xs text-muted-foreground">
                        حضور: {s.attendance_rate === null ? '—' : `${fmt(s.attendance_rate)}٪`}
                        {' · '}
                        اوسط: {s.average === null ? '—' : `${fmt(s.average)}٪`}
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-1 justify-end shrink-0">
                      {s.reasons.map((r) => (
                        <Badge key={r} variant="warning">{r}</Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">فعالیت‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={activityEvents} emptyMessage="هنوز حاضری یا ارزیابی ثبت نشده است" />
        </CardContent>
      </Card>
    </div>
  );
}
