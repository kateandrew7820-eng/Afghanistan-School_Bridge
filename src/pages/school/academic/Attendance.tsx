import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AttendanceStatus,
  useAttendance,
  useAcademicScope,
  useSaveAttendance,
  useSectionRoster,
  useSections,
} from '@/hooks/useAcademic';
import { CalendarCheck, Users } from 'lucide-react';

const STATUSES: { value: AttendanceStatus; label: string; variant: 'success' | 'destructive' | 'warning' | 'info' }[] = [
  { value: 'present', label: 'حاضر', variant: 'success' },
  { value: 'absent', label: 'غایب', variant: 'destructive' },
  { value: 'late', label: 'ناوقت', variant: 'warning' },
  { value: 'excused', label: 'رخصتی', variant: 'info' },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const { schoolId, canManage, role } = useAcademicScope();
  const canRecord = canManage || role === 'teacher';
  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const activeSections = useMemo(() => sections.filter((s) => s.status === 'active'), [sections]);

  const [sectionId, setSectionId] = useState<string>('');
  const [date, setDate] = useState<string>(today());
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    if (!sectionId && activeSections.length) setSectionId(activeSections[0].id);
  }, [activeSections, sectionId]);

  const section = activeSections.find((s) => s.id === sectionId) ?? null;
  const { data: roster = [], isLoading: rosterLoading } = useSectionRoster(sectionId || null);
  const { data: records = [] } = useAttendance(sectionId || null, date);
  const saveAttendance = useSaveAttendance(sectionId || null, date);

  // Reset the draft whenever the saved records for the selected day change.
  useEffect(() => {
    const next: Record<string, AttendanceStatus> = {};
    for (const student of roster) next[student.student_id] = 'present';
    for (const r of records) next[r.student_id] = r.status;
    setDraft(next);
  }, [records, roster]);

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const s of Object.values(draft)) c[s] += 1;
    return c;
  }, [draft]);

  const markAll = (status: AttendanceStatus) =>
    setDraft(Object.fromEntries(roster.map((s) => [s.student_id, status])));

  const submit = async () => {
    if (!section) return;
    await saveAttendance.mutateAsync(
      roster.map((s) => ({
        student_id: s.student_id,
        status: draft[s.student_id] ?? 'present',
        academic_year_id: section.academic_year_id,
      })),
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="حاضری شاگردان"
        description="ثبت روزانه حاضری برای هر بخش"
        icon={<CalendarCheck className="h-7 w-7" />}
      />

      {!sectionsLoading && activeSections.length === 0 ? (
        <EmptyState
          icon={Users}
          title="بخش فعالی موجود نیست"
          description={schoolId ? 'ابتدا در بخش «بخش‌ها» یک صنف فعال ایجاد کنید.' : 'ابتدا مکتب خود را در پروفایل مشخص کنید.'}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="att-section">بخش</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger id="att-section"><SelectValue placeholder="انتخاب بخش" /></SelectTrigger>
                  <SelectContent>
                    {activeSections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.grade_name} — {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="att-date">تاریخ</Label>
                <Input id="att-date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {!rosterLoading && roster.length === 0 ? (
            <EmptyState
              icon={Users}
              title="شاگردی در این بخش ثبت‌نام نشده است"
              description="ابتدا در صفحه «ثبت‌نام شاگردان» شاگردان را به این بخش اضافه کنید."
            />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">
                  لیست حاضری ({roster.length} شاگرد)
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUSES.map((s) => (
                    <Badge key={s.value} variant={s.variant === 'destructive' ? 'destructive' : s.variant}>
                      {s.label}: {counts[s.value]}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {canRecord && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">علامت‌گذاری همه:</span>
                    {STATUSES.map((s) => (
                      <Button key={s.value} size="sm" variant="outline" onClick={() => markAll(s.value)}>
                        {s.label}
                      </Button>
                    ))}
                  </div>
                )}

                <ul className="divide-y rounded-md border">
                  {roster.map((student) => (
                    <li key={student.student_id} className="flex items-center justify-between gap-3 p-3 flex-wrap">
                      <div>
                        <p className="text-sm font-medium">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.student_code}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {STATUSES.map((s) => {
                          const active = (draft[student.student_id] ?? 'present') === s.value;
                          return (
                            <Button
                              key={s.value}
                              size="sm"
                              variant={active ? 'default' : 'outline'}
                              disabled={!canRecord}
                              aria-pressed={active}
                              onClick={() => setDraft((d) => ({ ...d, [student.student_id]: s.value }))}
                            >
                              {s.label}
                            </Button>
                          );
                        })}
                      </div>
                    </li>
                  ))}
                </ul>

                {canRecord && (
                  <div className="flex justify-end">
                    <Button onClick={submit} disabled={saveAttendance.isPending || roster.length === 0}>
                      ذخیره حاضری
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
