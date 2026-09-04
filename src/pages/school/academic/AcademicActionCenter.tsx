import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  gradeBand,
  useAcademicYears,
  useGradeLevels,
  useSchoolAcademicReports,
  useSections,
  type ReportSectionRow,
  type ReportStudentRow,
} from '@/hooks/useAcademic';
import {
  AlertTriangle, CalendarCheck, CheckCircle2, ClipboardCheck,
  FileQuestion, GraduationCap, ListChecks, Sparkles,
} from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fa-AF', { maximumFractionDigits: 1 });
const int = (n: number) => n.toLocaleString('fa-AF');
const pct = (n: number | null) => (n === null ? '—' : `${fmt(n)}٪`);

const ALL = 'all';

/** Explainable thresholds, shared with the Phase 4C reporting logic. */
const LOW_ATTENDANCE = 80;
const LOW_AVERAGE = 50;
const STRONG_AVERAGE = 80;
const STALE_ATTENDANCE_DAYS = 7;

type Severity = 'high' | 'medium' | 'info';

const SEVERITY: Record<Severity, { label: string; variant: 'destructive' | 'warning' | 'info' }> = {
  high: { label: 'فوری', variant: 'destructive' },
  medium: { label: 'متوسط', variant: 'warning' },
  info: { label: 'معلوماتی', variant: 'info' },
};

interface ActionItem {
  id: string;
  title: string;
  context: string;
  reason: string;
  metric?: string;
  severity: Severity;
  to: string;
  actionLabel: string;
}

function ActionRow({ item }: { item: ActionItem }) {
  const sev = SEVERITY[item.severity];
  return (
    <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <Badge variant={sev.variant}>{sev.label}</Badge>
          {item.metric && <span className="text-sm font-semibold">{item.metric}</span>}
        </div>
        <p className="text-xs text-muted-foreground">{item.context}</p>
        <p className="text-xs text-muted-foreground">دلیل: {item.reason}</p>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
        <Link to={item.to}>{item.actionLabel}</Link>
      </Button>
    </li>
  );
}

function ActionGroup({ title, icon: Icon, items, emptyText }: {
  title: string;
  icon: typeof AlertTriangle;
  items: ActionItem[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <Badge variant={items.length === 0 ? 'success' : 'muted'}>{int(items.length)} مورد</Badge>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{emptyText}</p>
        ) : (
          <ul className="divide-y">
            {items.map((i) => <ActionRow key={i.id} item={i} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function AcademicActionCenter() {
  const [yearId, setYearId] = useState(ALL);
  const [gradeId, setGradeId] = useState(ALL);
  const [sectionId, setSectionId] = useState(ALL);

  const { data: years = [] } = useAcademicYears();
  const { data: grades = [] } = useGradeLevels();
  const { data: sections = [] } = useSections();

  const sectionOptions = useMemo(
    () => sections.filter((s) => s.status === 'active'
      && (yearId === ALL || s.academic_year_id === yearId)
      && (gradeId === ALL || s.grade_level_id === gradeId)),
    [sections, yearId, gradeId],
  );

  const filters = useMemo(() => ({
    academicYearId: yearId === ALL ? undefined : yearId,
    gradeId: gradeId === ALL ? undefined : gradeId,
    sectionId: sectionId === ALL ? undefined : sectionId,
  }), [yearId, gradeId, sectionId]);

  const { data, isLoading, isError } = useSchoolAcademicReports(filters);

  const groups = useMemo(() => {
    const attendance: ActionItem[] = [];
    const performance: ActionItem[] = [];
    const missing: ActionItem[] = [];
    const positive: ActionItem[] = [];
    if (!data) return { attendance, performance, missing, positive };

    const sectionLink = (s: ReportSectionRow) => `/school/academic/sections/${s.section_id}`;
    const studentContext = (s: ReportStudentRow) => `${s.student_code} · ${s.grade_name} — ${s.section_name}`;

    // --- A. Attendance attention ---
    for (const s of data.attendance.by_section) {
      if (s.attendance_records > 0 && s.attendance_rate !== null && s.attendance_rate < LOW_ATTENDANCE) {
        attendance.push({
          id: `sec-att-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: `${int(s.student_count)} شاگرد · ${int(s.attendance_records)} سابقه حاضری`,
          reason: `فیصدی حضور بخش کمتر از ${int(LOW_ATTENDANCE)}٪ است`,
          metric: pct(s.attendance_rate),
          severity: s.attendance_rate < 60 ? 'high' : 'medium',
          to: sectionLink(s),
          actionLabel: 'مشاهده صنف',
        });
      }
    }
    for (const s of data.attendance.concerning_students) {
      attendance.push({
        id: `std-att-${s.student_id}`,
        title: s.student_name,
        context: studentContext(s),
        reason: `حضور شاگرد کمتر از ${int(LOW_ATTENDANCE)}٪ است`,
        metric: pct(s.attendance_rate),
        severity: (s.attendance_rate ?? 100) < 60 ? 'high' : 'medium',
        to: `/school/academic/students/${s.student_id}`,
        actionLabel: 'مشاهده شاگرد',
      });
    }

    // --- B. Performance attention ---
    const schoolAvg = data.performance.school_average;
    for (const s of data.sections) {
      if (s.average !== null && s.average < LOW_AVERAGE) {
        performance.push({
          id: `sec-perf-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: `${int(s.student_count)} شاگرد · ${int(s.assessment_count)} امتحان`,
          reason: `اوسط نمرات بخش کمتر از ${int(LOW_AVERAGE)}٪ است`,
          metric: pct(s.average),
          severity: 'high',
          to: sectionLink(s),
          actionLabel: 'مشاهده صنف',
        });
      }
    }
    for (const sub of data.performance.subject_averages) {
      if (sub.percent < LOW_AVERAGE) {
        performance.push({
          id: `sub-perf-${sub.subject_id}`,
          title: sub.subject_name,
          context: `${int(sub.graded_students)} شاگرد نمره‌دار`,
          reason: `اوسط مضمون کمتر از ${int(LOW_AVERAGE)}٪ است`,
          metric: pct(sub.percent),
          severity: 'medium',
          to: '/school/academic/assessments',
          actionLabel: 'مشاهده امتحانات',
        });
      }
    }
    for (const s of data.performance.attention_students) {
      const belowSchool = schoolAvg !== null && s.average !== null && s.average < schoolAvg - 15;
      performance.push({
        id: `std-perf-${s.student_id}`,
        title: s.student_name,
        context: studentContext(s),
        reason: belowSchool
          ? `نمرات به‌طور قابل توجه پایین‌تر از اوسط مکتب (${pct(schoolAvg)}) است`
          : `اوسط نمرات کمتر از ${int(LOW_AVERAGE)}٪ است`,
        metric: pct(s.average),
        severity: 'high',
        to: `/school/academic/students/${s.student_id}`,
        actionLabel: 'مشاهده شاگرد',
      });
    }

    // --- C. Missing data (only where the schema can establish absence) ---
    const staleBefore = new Date(Date.now() - STALE_ATTENDANCE_DAYS * 86400000)
      .toISOString().slice(0, 10);
    for (const s of data.sections) {
      if (s.student_count === 0) {
        missing.push({
          id: `sec-noenroll-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: 'بدون شاگرد ثبت‌نام‌شده',
          reason: 'هیچ ثبت‌نام فعالی برای این بخش موجود نیست',
          severity: 'medium',
          to: '/school/academic/enrollments',
          actionLabel: 'ثبت‌نام شاگردان',
        });
        continue;
      }
      if (s.attendance_records === 0) {
        missing.push({
          id: `sec-noatt-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: `${int(s.student_count)} شاگرد`,
          reason: 'هیچ سابقه حاضری برای این بخش ثبت نشده است',
          severity: 'high',
          to: '/school/academic/attendance',
          actionLabel: 'ثبت حاضری',
        });
      } else if (s.last_attendance_date && s.last_attendance_date < staleBefore) {
        missing.push({
          id: `sec-staleatt-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: `آخرین حاضری: ${s.last_attendance_date}`,
          reason: `بیش از ${int(STALE_ATTENDANCE_DAYS)} روز حاضری ثبت نشده است`,
          severity: 'medium',
          to: '/school/academic/attendance',
          actionLabel: 'ثبت حاضری',
        });
      }
      if (s.assessment_count === 0) {
        missing.push({
          id: `sec-noassess-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: `${int(s.student_count)} شاگرد`,
          reason: 'هیچ امتحان فعالی برای این بخش ایجاد نشده است',
          severity: 'medium',
          to: '/school/academic/assessments',
          actionLabel: 'ایجاد امتحان',
        });
      } else if (s.mark_count === 0) {
        missing.push({
          id: `sec-nomarks-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: `${int(s.assessment_count)} امتحان`,
          reason: 'برای امتحانات این بخش هیچ نمره‌ای ثبت نشده است',
          severity: 'high',
          to: '/school/academic/assessments',
          actionLabel: 'ثبت نمرات',
        });
      }
    }

    // --- D. Positive signals ---
    for (const s of data.sections) {
      if (s.average !== null && s.average >= STRONG_AVERAGE) {
        positive.push({
          id: `pos-sec-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: `${int(s.student_count)} شاگرد · ${gradeBand(s.average).label}`,
          reason: 'کارکرد تحصیلی قوی',
          metric: pct(s.average),
          severity: 'info',
          to: sectionLink(s),
          actionLabel: 'مشاهده صنف',
        });
      } else if (s.attendance_records > 0 && s.attendance_rate !== null && s.attendance_rate >= 95) {
        positive.push({
          id: `pos-att-${s.section_id}`,
          title: `${s.grade_name} — ${s.section_name}`,
          context: `${int(s.attendance_records)} سابقه حاضری`,
          reason: 'حضور بسیار منظم',
          metric: pct(s.attendance_rate),
          severity: 'info',
          to: sectionLink(s),
          actionLabel: 'مشاهده صنف',
        });
      }
    }
    const best = data.performance.best_subject;
    if (best && best.percent >= STRONG_AVERAGE) {
      positive.push({
        id: `pos-sub-${best.subject_id}`,
        title: best.subject_name,
        context: `${int(best.graded_students)} شاگرد نمره‌دار`,
        reason: 'بهترین اوسط در میان مضامین',
        metric: pct(best.percent),
        severity: 'info',
        to: '/school/academic/reports',
        actionLabel: 'مشاهده گزارش',
      });
    }

    return {
      attendance,
      performance,
      missing,
      positive: positive.slice(0, 6),
    };
  }, [data]);

  const totalIssues = groups.attendance.length + groups.performance.length + groups.missing.length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <PageHeader
        title="اقدامات تحصیلی"
        description="مواردی که امروز به توجه شما نیاز دارند"
        icon={<ListChecks className="h-7 w-7" />}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="act-year">سال تحصیلی</Label>
            <Select value={yearId} onValueChange={(v) => { setYearId(v); setSectionId(ALL); }}>
              <SelectTrigger id="act-year"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه سال‌ها</SelectItem>
                {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="act-grade">صنف</Label>
            <Select value={gradeId} onValueChange={(v) => { setGradeId(v); setSectionId(ALL); }}>
              <SelectTrigger id="act-grade"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه صنف‌ها</SelectItem>
                {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="act-section">بخش</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger id="act-section"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه بخش‌ها</SelectItem>
                {sectionOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.grade_name} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError || !data ? (
        <EmptyState
          icon={AlertTriangle}
          title="معلومات در دسترس نیست"
          description="در حال حاضر امکان بارگیری اقدامات تحصیلی وجود ندارد."
        />
      ) : data.sections.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="معلوماتی برای این فلترها موجود نیست"
          description="بخش فعالی با این فلترها یافت نشد. فلترها را تغییر دهید یا ابتدا بخش‌ها را ایجاد کنید."
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <KpiCard label="نیاز به توجه" value={int(totalIssues)} icon={AlertTriangle}
              tone={totalIssues > 0 ? 'danger' : 'success'} hint={`${int(data.sections.length)} بخش بررسی شد`} />
            <KpiCard label="مشکلات حضور و غیاب" value={int(groups.attendance.length)} icon={CalendarCheck}
              tone={groups.attendance.length > 0 ? 'warning' : 'success'} />
            <KpiCard label="مشکلات تحصیلی" value={int(groups.performance.length)} icon={GraduationCap}
              tone={groups.performance.length > 0 ? 'warning' : 'success'} />
            <KpiCard label="داده‌های ناقص" value={int(groups.missing.length)} icon={FileQuestion}
              tone={groups.missing.length > 0 ? 'info' : 'success'} />
          </div>

          {totalIssues === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="در حال حاضر موردی برای پیگیری وجود ندارد"
              description="بر اساس معلومات موجود، حاضری، نمرات و مکمل بودن داده‌ها در وضعیت مناسب است."
            />
          ) : (
            <div className="space-y-4">
              <ActionGroup
                title="توجه به حاضری"
                icon={CalendarCheck}
                items={groups.attendance}
                emptyText="موردی در حاضری یافت نشد."
              />
              <ActionGroup
                title="توجه به کارکرد تحصیلی"
                icon={ClipboardCheck}
                items={groups.performance}
                emptyText="موردی در کارکرد تحصیلی یافت نشد."
              />
              <ActionGroup
                title="داده‌های ناقص"
                icon={FileQuestion}
                items={groups.missing}
                emptyText="داده ناقصی یافت نشد."
              />
            </div>
          )}

          {groups.positive.length > 0 && (
            <ActionGroup
              title="نشانه‌های مثبت"
              icon={Sparkles}
              items={groups.positive}
              emptyText="—"
            />
          )}
        </>
      )}
    </div>
  );
}
