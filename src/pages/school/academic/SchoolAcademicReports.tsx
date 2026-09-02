import { useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { Sparkline } from '@/components/Sparkline';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  gradeBand,
  useAcademicYears,
  useGradeLevels,
  useSchoolAcademicReports,
  useSections,
  useSubjects,
  type ReportSectionRow,
  type ReportStudentRow,
} from '@/hooks/useAcademic';
import {
  AlertTriangle, BarChart3, BookOpen, CalendarCheck, GraduationCap, Printer, Users,
} from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fa-AF', { maximumFractionDigits: 1 });
const int = (n: number) => n.toLocaleString('fa-AF');
const pct = (n: number | null) => (n === null ? '—' : `${fmt(n)}٪`);

const ALL = 'all';

function StudentList({ rows, metric, emptyText }: {
  rows: ReportStudentRow[];
  metric: 'average' | 'attendance';
  emptyText: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-2">{emptyText}</p>;
  return (
    <ul className="divide-y">
      {rows.map((s) => {
        const value = metric === 'average' ? s.average : s.attendance_rate;
        return (
          <li key={s.student_id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{s.student_name}</p>
              <p className="text-xs text-muted-foreground">
                {s.student_code} · {s.grade_name} — {s.section_name}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold">{pct(value)}</span>
              <Badge variant={value !== null && value < 50 ? 'destructive' : 'warning'}>
                {metric === 'average' ? 'نمرات' : 'حاضری'}
              </Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SectionTable({ rows }: { rows: ReportSectionRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>صنف / بخش</TableHead>
          <TableHead>شاگردان</TableHead>
          <TableHead>پسر / دختر</TableHead>
          <TableHead>حاضری</TableHead>
          <TableHead>اوسط نمرات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.section_id}>
            <TableCell className="font-medium">{s.grade_name} — {s.section_name}</TableCell>
            <TableCell>{int(s.student_count)}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {int(s.male)} / {int(s.female)}
            </TableCell>
            <TableCell>{pct(s.attendance_rate)}</TableCell>
            <TableCell>
              {s.average === null ? '—' : (
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{fmt(s.average)}٪</span>
                  <Badge variant={gradeBand(s.average).variant}>{gradeBand(s.average).label}</Badge>
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function SchoolAcademicReports() {
  const [yearId, setYearId] = useState(ALL);
  const [gradeId, setGradeId] = useState(ALL);
  const [sectionId, setSectionId] = useState(ALL);
  const [subjectId, setSubjectId] = useState(ALL);

  const { data: years = [] } = useAcademicYears();
  const { data: grades = [] } = useGradeLevels();
  const { data: sections = [] } = useSections();
  const { data: subjects = [] } = useSubjects();

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
    subjectId: subjectId === ALL ? undefined : subjectId,
  }), [yearId, gradeId, sectionId, subjectId]);

  const { data, isLoading, isError } = useSchoolAcademicReports(filters);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 print:p-0">
      <PageHeader
        title="گزارش‌های تحصیلی"
        description="تحلیل کارکرد، حاضری، ثبت‌نام و مقایسه بخش‌ها"
        icon={<BarChart3 className="h-7 w-7" />}
      />

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="pt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="rep-year">سال تحصیلی</Label>
            <Select value={yearId} onValueChange={(v) => { setYearId(v); setSectionId(ALL); }}>
              <SelectTrigger id="rep-year"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه سال‌ها</SelectItem>
                {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rep-grade">صنف</Label>
            <Select value={gradeId} onValueChange={(v) => { setGradeId(v); setSectionId(ALL); }}>
              <SelectTrigger id="rep-grade"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه صنف‌ها</SelectItem>
                {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rep-section">بخش</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger id="rep-section"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه بخش‌ها</SelectItem>
                {sectionOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.grade_name} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rep-subject">مضمون</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="rep-subject"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه مضامین</SelectItem>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 me-1" />
              چاپ گزارش
            </Button>
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
          icon={BarChart3}
          title="معلومات در دسترس نیست"
          description="در حال حاضر امکان بارگیری گزارش‌های تحصیلی وجود ندارد."
        />
      ) : data.sections.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="معلوماتی برای این فلترها موجود نیست"
          description="بخش فعالی با این فلترها یافت نشد. فلترها را تغییر دهید یا ابتدا بخش‌ها را ایجاد کنید."
        />
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <KpiCard label="شاگردان" value={int(data.enrollment.total)} icon={Users}
              hint={`${int(data.enrollment.male)} پسر · ${int(data.enrollment.female)} دختر`} />
            <KpiCard label="اوسط کارکرد" value={pct(data.performance.school_average)} icon={GraduationCap}
              tone="info" hint={`${int(data.performance.graded_students)} شاگرد نمره‌دار`} />
            <KpiCard label="فیصدی حضور" value={pct(data.attendance.overall_rate)} icon={CalendarCheck}
              tone="success" sparkline={data.attendance.trend} />
            <KpiCard label="بخش‌ها" value={int(data.sections.length)} icon={BookOpen} />
          </div>

          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList className="print:hidden">
              <TabsTrigger value="performance">کارکرد شاگردان</TabsTrigger>
              <TabsTrigger value="attendance">حاضری</TabsTrigger>
              <TabsTrigger value="enrollment">ثبت‌نام</TabsTrigger>
              <TabsTrigger value="comparison">مقایسه بخش‌ها</TabsTrigger>
            </TabsList>

            {/* A. Performance */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">اوسط نمرات بر اساس مضمون</CardTitle></CardHeader>
                  <CardContent>
                    {data.performance.subject_averages.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">هنوز نمره‌ای ثبت نشده است.</p>
                    ) : (
                      <ul className="divide-y">
                        {data.performance.subject_averages.map((s) => {
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
                    {data.performance.best_subject && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                        <p>بهترین مضمون: {data.performance.best_subject.subject_name} ({fmt(data.performance.best_subject.percent)}٪)</p>
                        {data.performance.worst_subject && (
                          <p>ضعیف‌ترین مضمون: {data.performance.worst_subject.subject_name} ({fmt(data.performance.worst_subject.percent)}٪)</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">مقایسه کارکرد صنف‌ها</CardTitle></CardHeader>
                  <CardContent>
                    {data.performance.grade_rows.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">معلوماتی موجود نیست.</p>
                    ) : (
                      <ul className="divide-y">
                        {data.performance.grade_rows.map((g) => (
                          <li key={g.grade_id} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{g.grade_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {int(g.student_count)} شاگرد · حضور {pct(g.attendance_rate)}
                              </p>
                            </div>
                            <span className="text-sm font-semibold shrink-0">{pct(g.average)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4" />
                    شاگردان نیازمند توجه تحصیلی
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StudentList
                    rows={data.performance.attention_students}
                    metric="average"
                    emptyText="هیچ شاگردی با نمرات پایین ثبت نشده است."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* B. Attendance */}
            <TabsContent value="attendance" className="space-y-4">
              {data.attendance.total_records === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="حاضری ثبت نشده است"
                  description="برای دیدن گزارش حاضری، ابتدا در صفحه «حاضری» حاضری روزانه را ثبت کنید."
                />
              ) : (
                <>
                  <Card>
                    <CardHeader><CardTitle className="text-base">روند حاضری (۳۰ روز اخیر)</CardTitle></CardHeader>
                    <CardContent>
                      {data.attendance.trend.length > 1 ? (
                        <Sparkline data={data.attendance.trend} height={72} />
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">معلومات کافی برای نمایش روند وجود ندارد.</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {int(data.attendance.total_records)} سابقه حاضری · فیصدی کلی {pct(data.attendance.overall_rate)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-base">حاضری بر اساس بخش</CardTitle></CardHeader>
                    <CardContent className="p-0 sm:p-0">
                      <SectionTable rows={data.attendance.by_section} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-4 w-4" />
                        شاگردان با حاضری نگران‌کننده
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StudentList
                        rows={data.attendance.concerning_students}
                        metric="attendance"
                        emptyText="حاضری تمام شاگردان در حد قابل قبول است."
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* C. Enrollment */}
            <TabsContent value="enrollment" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">ثبت‌نام بر اساس صنف</CardTitle></CardHeader>
                  <CardContent>
                    {data.enrollment.by_grade.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">هنوز ثبت‌نامی موجود نیست.</p>
                    ) : (
                      <ul className="divide-y">
                        {data.enrollment.by_grade.map((g) => (
                          <li key={g.grade_id} className="flex items-center justify-between gap-3 py-2.5">
                            <span className="text-sm font-medium">{g.grade_name}</span>
                            <span className="text-sm">{int(g.student_count)} شاگرد</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">روند ماهانه ثبت‌نام</CardTitle></CardHeader>
                  <CardContent>
                    {data.enrollment.monthly_trend.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">هنوز ثبت‌نامی ثبت نشده است.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.enrollment.monthly_trend.map((p) => {
                          const max = Math.max(1, ...data.enrollment.monthly_trend.map((x) => x.count));
                          return (
                            <li key={p.month} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-16 shrink-0">{p.month}</span>
                              <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <span className="block h-full rounded-full bg-primary" style={{ width: `${(p.count / max) * 100}%` }} />
                              </span>
                              <span className="text-xs font-medium w-10 text-end shrink-0">{int(p.count)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">ثبت‌نام بر اساس بخش</CardTitle></CardHeader>
                <CardContent className="p-0 sm:p-0">
                  <SectionTable rows={data.enrollment.by_section} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* D. Section comparison */}
            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">مقایسه بخش‌ها</CardTitle></CardHeader>
                <CardContent className="p-0 sm:p-0">
                  <SectionTable rows={data.sections} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
