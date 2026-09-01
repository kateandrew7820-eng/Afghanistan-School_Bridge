import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { Sparkline } from '@/components/Sparkline';
import { Timeline, TimelineEvent, TIMELINE_ICONS } from '@/components/Timeline';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { gradeBand, useSchoolAcademicDashboard } from '@/hooks/useAcademic';
import {
  Award, BookOpen, CalendarCheck, Grid3x3, Users, UserCheck, AlertTriangle, TrendingUp, LayoutDashboard,
} from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fa-AF', { maximumFractionDigits: 1 });
const int = (n: number) => n.toLocaleString('fa-AF');

export default function SchoolAcademicDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useSchoolAcademicDashboard();

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
        <PageHeader title="داشبورد تحصیلی مکتب" icon={<LayoutDashboard className="h-7 w-7" />} />
        <EmptyState
          icon={LayoutDashboard}
          title="معلومات در دسترس نیست"
          description="در حال حاضر امکان بارگیری معلومات تحصیلی مکتب وجود ندارد."
        />
      </div>
    );
  }

  const {
    total_students, male_students, female_students, total_teachers, total_sections,
    overall_attendance_rate, attendance_trend, subject_averages, school_average,
    enrollment_trend, top_sections, attention_sections,
  } = data;

  const maxEnroll = Math.max(1, ...enrollment_trend.map((p) => p.count));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <PageHeader
        title="داشبورد تحصیلی مکتب"
        description="نمای کلی از شاگردان، معلمان، حاضری و کارکرد تحصیلی"
        icon={<LayoutDashboard className="h-7 w-7" />}
      />

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="مجموع شاگردان"
          value={int(total_students)}
          icon={Users}
          hint={`${int(male_students)} پسر · ${int(female_students)} دختر`}
          to="/school/academic/students"
        />
        <KpiCard
          label="معلمان"
          value={int(total_teachers)}
          icon={UserCheck}
          tone="info"
          hint="معلمان ثبت‌شده مکتب"
          to="/school/academic/assignments"
        />
        <KpiCard
          label="بخش‌های فعال"
          value={int(total_sections)}
          icon={Grid3x3}
          tone="default"
          hint="صنف‌های فعال"
          to="/school/academic/sections"
        />
        <KpiCard
          label="فیصدی حضور کلی"
          value={overall_attendance_rate === null ? '—' : `${fmt(overall_attendance_rate)}٪`}
          icon={CalendarCheck}
          tone="success"
          sparkline={attendance_trend}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Attendance trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4" />
              روند حضور مکتب (۳۰ روز اخیر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance_trend.length > 1 ? (
              <Sparkline data={attendance_trend} height={72} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">معلومات کافی برای نمایش روند وجود ندارد.</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              اوسط کارکرد تحصیلی مکتب: {school_average === null ? '—' : `${fmt(school_average)}٪`}
            </p>
          </CardContent>
        </Card>

        {/* Enrollment trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              روند ثبت‌نام شاگردان
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollment_trend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">هنوز ثبت‌نامی ثبت نشده است.</p>
            ) : (
              <ul className="space-y-2">
                {enrollment_trend.map((p) => (
                  <li key={p.month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{p.month}</span>
                    <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(p.count / maxEnroll) * 100}%` }}
                      />
                    </span>
                    <span className="text-xs font-medium w-10 text-end shrink-0">{int(p.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

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
            <p className="text-sm text-muted-foreground py-2">هنوز نمره‌ای در مکتب ثبت نشده است.</p>
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
        {/* Top sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              بخش‌های برتر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {top_sections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">هنوز نمره‌ای ثبت نشده است.</p>
            ) : (
              <ol className="divide-y">
                {top_sections.map((s, i) => (
                  <li key={s.section_id} className="flex items-center justify-between gap-3 py-2.5">
                    <button
                      type="button"
                      className="flex items-center gap-2 min-w-0 text-start hover:underline"
                      onClick={() => navigate(`/school/academic/sections/${s.section_id}`)}
                    >
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{int(i + 1)}.</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {s.grade_name} — {s.section_name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {int(s.student_count)} شاگرد
                        </span>
                      </span>
                    </button>
                    <Badge variant={gradeBand(s.average ?? 0).variant}>{fmt(s.average ?? 0)}٪</Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Sections needing attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              بخش‌های نیازمند توجه
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attention_sections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">هیچ بخشی در حال حاضر نیاز به توجه ندارد.</p>
            ) : (
              <ul className="divide-y">
                {attention_sections.map((s) => (
                  <li key={s.section_id} className="flex items-center justify-between gap-3 py-2.5">
                    <button
                      type="button"
                      className="min-w-0 text-start hover:underline"
                      onClick={() => navigate(`/school/academic/sections/${s.section_id}`)}
                    >
                      <span className="block text-sm font-medium truncate">
                        {s.grade_name} — {s.section_name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        حضور: {s.attendance_rate === null ? '—' : `${fmt(s.attendance_rate)}٪`}
                        {' · '}
                        اوسط: {s.average === null ? '—' : `${fmt(s.average)}٪`}
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-1 justify-end shrink-0">
                      {(s.reasons ?? []).map((r) => (
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
          <CardTitle className="text-base">فعالیت‌های اخیر تحصیلی</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={activityEvents} emptyMessage="هنوز حاضری یا ارزیابی ثبت نشده است" />
        </CardContent>
      </Card>
    </div>
  );
}
