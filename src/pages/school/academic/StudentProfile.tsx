import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Timeline, TimelineEvent } from '@/components/Timeline';
import { Sparkline } from '@/components/Sparkline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { gradeBand, useStudentProfile } from '@/hooks/useAcademic';
import type { EnrollmentStatus } from '@/hooks/useAcademic';
import { Award, CalendarCheck, ClipboardList, GraduationCap, UserX } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fa-AF', { maximumFractionDigits: 1 });
const int = (n: number) => n.toLocaleString('fa-AF');

const GENDER_LABEL: Record<string, string> = { male: 'پسر', female: 'دختر' };
const STUDENT_STATUS_LABEL: Record<string, string> = { active: 'فعال', archived: 'بایگانی شده' };

const ENROLLMENT_STATUS: Record<EnrollmentStatus, { label: string; tone: 'success' | 'info' | 'warning' | 'muted' }> = {
  active: { label: 'فعال', tone: 'success' },
  completed: { label: 'تکمیل شده', tone: 'info' },
  transferred: { label: 'انتقال یافته', tone: 'warning' },
  withdrawn: { label: 'ترک تحصیل', tone: 'muted' },
};

const ATTENDANCE_TILES = [
  { key: 'present', label: 'حاضر', className: 'text-success' },
  { key: 'absent', label: 'غایب', className: 'text-destructive' },
  { key: 'late', label: 'تأخیر', className: 'text-warning' },
  { key: 'excused', label: 'رخصتی', className: 'text-muted-foreground' },
] as const;

function InfoRow({ label, value, dir }: { label: string; value: string; dir?: 'ltr' }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium" dir={dir}>{value}</p>
    </div>
  );
}

export default function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useStudentProfile(studentId ?? null);

  const enrollmentEvents = useMemo<TimelineEvent[]>(
    () => (data?.enrollments ?? []).map((e) => {
      const status = ENROLLMENT_STATUS[e.status];
      return {
        id: e.id,
        title: `${e.grade_name} — ${e.section_name}`,
        description: [e.academic_year_name, status.label, e.notes].filter(Boolean).join(' · '),
        timestamp: e.enrollment_date,
        tone: status.tone,
      };
    }),
    [data?.enrollments],
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <PageHeader title="پروفایل شاگرد" backTo="/school/academic/students" icon={<GraduationCap className="h-7 w-7" />} />
        <EmptyState
          icon={UserX}
          title="شاگرد یافت نشد"
          description="این شاگرد وجود ندارد یا به مکتب شما تعلق ندارد."
          action={<Button onClick={() => navigate('/school/academic/students')}>بازگشت به فهرست شاگردان</Button>}
        />
      </div>
    );
  }

  const { student, attendance, subjects, average, currentEnrollment } = data;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <PageHeader
        title={student.full_name}
        description={`شماره شاگرد: ${student.student_code}`}
        backTo="/school/academic/students"
        icon={<GraduationCap className="h-7 w-7" />}
      />

      {/* Identity */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={student.status === 'active' ? 'success' : 'muted'}>
              {STUDENT_STATUS_LABEL[student.status]}
            </Badge>
            <Badge variant={student.gender === 'female' ? 'info' : 'muted'}>
              {GENDER_LABEL[student.gender]}
            </Badge>
            {currentEnrollment && (
              <Badge variant="outline">
                {currentEnrollment.grade_name} — {currentEnrollment.section_name} · {currentEnrollment.academic_year_name}
              </Badge>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoRow label="نام پدر" value={student.father_name || '—'} />
            <InfoRow label="تاریخ تولد" value={student.date_of_birth || '—'} dir={student.date_of_birth ? 'ltr' : undefined} />
            <InfoRow label="شماره تذکره" value={student.national_id || '—'} dir={student.national_id ? 'ltr' : undefined} />
            <InfoRow label="نام سرپرست" value={student.guardian_name || '—'} />
            <InfoRow label="تماس سرپرست" value={student.guardian_phone || '—'} dir={student.guardian_phone ? 'ltr' : undefined} />
            <InfoRow label="آدرس" value={student.address || '—'} />
          </div>
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4" />
            خلاصه حاضری
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {attendance.total === 0 ? (
            <p className="text-sm text-muted-foreground py-2">هنوز حاضری برای این شاگرد ثبت نشده است.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ATTENDANCE_TILES.map((tile) => (
                  <div key={tile.key} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{tile.label}</p>
                    <p className={`text-lg font-semibold ${tile.className}`}>{int(attendance[tile.key])}</p>
                  </div>
                ))}
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">فیصدی حضور</p>
                  <p className="text-lg font-semibold">
                    {attendance.rate === null ? '—' : `${fmt(attendance.rate)}٪`}
                  </p>
                </div>
              </div>
              {attendance.trend.length > 1 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    روند حاضری ({int(attendance.total)} روز ثبت شده)
                  </p>
                  <Sparkline data={attendance.trend} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Academic performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4" />
            کارکرد تحصیلی
            {average !== null && (
              <Badge variant={gradeBand(average).variant} className="ms-auto">
                اوسط: {fmt(average)}٪ · {gradeBand(average).label}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">هنوز نمره‌ای برای این شاگرد ثبت نشده است.</p>
          ) : (
            <ul className="divide-y">
              {subjects.map((s) => {
                const band = gradeBand(s.percent);
                return (
                  <li key={s.subject_id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.subject_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(s.earned)} از {fmt(s.possible)}
                      </p>
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

      {/* Enrollment history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" />
            سابقه ثبت‌نام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={enrollmentEvents} emptyMessage="این شاگرد در هیچ بخشی ثبت‌نام نشده است" />
        </CardContent>
      </Card>
    </div>
  );
}
