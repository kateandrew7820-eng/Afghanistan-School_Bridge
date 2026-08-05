import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicScope, useReportCard, useSections } from '@/hooks/useAcademic';
import { Award, Users } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fa-AF', { maximumFractionDigits: 1 });

function gradeBadge(percent: number): { label: string; variant: 'success' | 'info' | 'warning' | 'destructive' } {
  if (percent >= 80) return { label: 'عالی', variant: 'success' };
  if (percent >= 65) return { label: 'خوب', variant: 'info' };
  if (percent >= 50) return { label: 'قابل قبول', variant: 'warning' };
  return { label: 'ناکام', variant: 'destructive' };
}

export default function ReportCards() {
  const { schoolId } = useAcademicScope();
  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const activeSections = useMemo(() => sections.filter((s) => s.status === 'active'), [sections]);

  const [sectionId, setSectionId] = useState('');
  const [term, setTerm] = useState('all');

  useEffect(() => {
    if (!sectionId && activeSections.length) setSectionId(activeSections[0].id);
  }, [activeSections, sectionId]);

  const { data: rows = [], isLoading } = useReportCard(sectionId || null, term);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="کارنامه شاگردان"
        description="اوسط نمرات هر شاگرد به تفکیک مضمون"
        icon={<Award className="h-7 w-7" />}
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
                <Label htmlFor="rc-section">بخش</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger id="rc-section"><SelectValue placeholder="انتخاب بخش" /></SelectTrigger>
                  <SelectContent>
                    {activeSections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.grade_name} — {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="rc-term">دوره</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger id="rc-term"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">تمام سال</SelectItem>
                    <SelectItem value="term1">چهارماه اول</SelectItem>
                    <SelectItem value="term2">چهارماه دوم</SelectItem>
                    <SelectItem value="final">امتحان سالانه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {!isLoading && rows.length === 0 ? (
            <EmptyState
              icon={Award}
              title="کارنامه‌ای موجود نیست"
              description="ابتدا شاگردان را در این بخش ثبت‌نام و نمرات امتحانات را وارد کنید."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((row) => {
                const badge = row.average === null ? null : gradeBadge(row.average);
                return (
                  <Card key={row.student_id}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                      <div>
                        <CardTitle className="text-base">{row.student_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{row.student_code}</p>
                      </div>
                      {badge ? (
                        <Badge variant={badge.variant}>{fmt(row.average!)}٪ — {badge.label}</Badge>
                      ) : (
                        <Badge variant="muted">بدون نمره</Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      {row.subjects.length === 0 ? (
                        <p className="text-xs text-muted-foreground">هنوز نمره‌ای برای این شاگرد ثبت نشده است.</p>
                      ) : (
                        <ul className="space-y-1">
                          {row.subjects.map((s) => (
                            <li key={s.subject_id} className="flex items-center justify-between text-sm">
                              <span>{s.subject_name}</span>
                              <span className="text-muted-foreground text-xs">
                                {fmt(s.earned)} / {fmt(s.possible)} ({fmt(s.percent)}٪)
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
