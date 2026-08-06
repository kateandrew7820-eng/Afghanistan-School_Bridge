import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/PageHeader';
import AcademicTrendChart from '@/components/academic/AcademicTrendChart';
import AcademicStatusBadge from '@/components/academic/AcademicStatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { FileText, GraduationCap, TrendingUp, NotebookText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AttendanceRow = {
  present: boolean | null;
  date?: string | null;
  section?: string | null;
};

type AssessmentRecord = {
  id: string;
  created_at: string;
  form_data?: {
    subject?: string;
    score?: number | string;
    total_score?: number | string;
    student_name?: string;
  } | null;
};

function toScore(value: number | string | undefined | null): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [attendanceSummary, setAttendanceSummary] = React.useState<{ total: number; present: number; rate: number | null } | null>(null);
  const [assessments, setAssessments] = React.useState<AssessmentRecord[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const [{ data: attendanceRows }, { data: assessmentRows, error: assessmentError }] = await Promise.all([
          supabase.from('attendance_records').select('present, date, section').eq('student_id', id),
          supabase.from('form_submissions').select('id, created_at, form_data').eq('form_type', 'student_assessment').filter('form_data->>student_id', 'eq', id),
        ]);

        if (!mounted) return;
        if (assessmentError) throw assessmentError;

        const safeAttendanceRows = (attendanceRows as AttendanceRow[] | null) ?? [];
        const total = safeAttendanceRows.length;
        const present = safeAttendanceRows.filter((row) => row.present).length;
        setAttendanceSummary({ total, present, rate: total > 0 ? Math.round((present / total) * 100) : null });
        setAssessments((assessmentRows as AssessmentRecord[] | null) ?? []);
      } catch (caughtError) {
        if (!mounted) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load student profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const subjectBreakdown = React.useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>();
    assessments.forEach((assessment) => {
      const subject = assessment.form_data?.subject || 'General';
      const score = toScore(assessment.form_data?.score ?? assessment.form_data?.total_score);
      if (!score) return;
      const current = totals.get(subject) || { total: 0, count: 0 };
      totals.set(subject, { total: current.total + score, count: current.count + 1 });
    });

    return Array.from(totals.entries()).map(([subject, values]) => ({ subject, avg: Math.round(values.total / values.count) }));
  }, [assessments]);

  const trendData = React.useMemo(() => {
    return assessments.slice(0, 8).reverse().map((assessment) => ({
      label: new Date(assessment.created_at).toLocaleDateString(),
      value: Math.round(toScore(assessment.form_data?.score ?? assessment.form_data?.total_score) ?? 0),
    }));
  }, [assessments]);

  const overallGrade = assessments.length > 0 ? Math.round(subjectBreakdown.reduce((acc, cur) => acc + cur.avg, 0) / Math.max(subjectBreakdown.length, 1)) : null;
  const status: 'excellent' | 'good' | 'needs-attention' | 'at-risk' = overallGrade !== null && overallGrade >= 85 ? 'excellent' : overallGrade !== null && overallGrade >= 70 ? 'good' : overallGrade !== null && overallGrade >= 60 ? 'needs-attention' : 'at-risk';

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="پروفایل دانش‌آموز" description={id ? `مشاهده عملکرد ${id}` : 'شناسه دانش‌آموز یافت نشد'} />

      {error ? (
        <EmptyState icon={FileText} title="در بارگذاری اطلاعات خطایی رخ داد" description={error} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card variant="gradient">
              <CardHeader>
                <CardTitle className="text-base">اطلاعات دانش‌آموز</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{id ?? 'Student'}</p>
                      <p className="text-sm text-muted-foreground">شناسه: {id ?? '—'}</p>
                    </div>
                    <AcademicStatusBadge status={status} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="stat">
              <CardHeader>
                <CardTitle className="text-base">میانگین کلی</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-10 w-24" /> : (
                  <div className="text-3xl font-bold">{overallGrade !== null ? `${overallGrade}%` : '—'}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card variant="stat">
              <CardHeader><CardTitle className="text-sm">حضور کلی</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-semibold">{attendanceSummary?.rate != null ? `${attendanceSummary.rate}%` : '—'}</div>}
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardHeader><CardTitle className="text-sm">تعداد رکوردها</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-semibold">{attendanceSummary?.total ?? 0}</div>}
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardHeader><CardTitle className="text-sm">ارزیابی‌ها</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-semibold">{assessments.length}</div>}
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardHeader><CardTitle className="text-sm">وضعیت</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-20" /> : <AcademicStatusBadge status={status} />}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <AcademicTrendChart title="روند عملکرد" description="روند امتیازها در طول زمان" data={trendData} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">خلاصه حضور</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : attendanceSummary ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span>حضور</span><span className="font-semibold">{attendanceSummary.present}</span></div>
                    <div className="flex items-center justify-between"><span>غیبت</span><span className="font-semibold">{attendanceSummary.total - attendanceSummary.present}</span></div>
                    <div className="flex items-center justify-between"><span>نرخ حضور</span><span className="font-semibold">{attendanceSummary.rate ?? '—'}%</span></div>
                  </div>
                ) : <p className="text-sm text-muted-foreground">هیچ رکورد حضوری موجود نیست.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">تاریخچه ارزیابی</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : assessments.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {assessments.map((assessment) => (
                      <li key={assessment.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                        <div>
                          <p className="font-medium">{assessment.form_data?.subject || 'Assessment'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(assessment.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="font-semibold">{toScore(assessment.form_data?.score ?? assessment.form_data?.total_score) ?? '—'}</p>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">هیچ ارزیابی‌ای ثبت نشده است.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">عملکرد بر اساس درس</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : subjectBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {subjectBreakdown.map((item) => (
                      <div key={item.subject} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                        <span className="font-medium">{item.subject}</span>
                        <span className="font-semibold">{item.avg}%</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">هنوز داده‌ای برای تحلیل درس‌ها وجود ندارد.</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">یادداشت معلم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                <NotebookText className="mt-0.5 h-4 w-4" />
                <p>این بخش برای یادداشت‌های معلم در آینده در نظر گرفته شده است. در حال حاضر فقط رابط کاربری آماده شده است.</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
