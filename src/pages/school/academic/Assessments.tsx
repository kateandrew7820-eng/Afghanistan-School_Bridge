import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { DetailDrawer } from '@/components/DetailDrawer';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import {
  AssessmentWithRelations,
  useAcademicMutation,
  useAcademicScope,
  useAcademicYears,
  useAssessments,
  useMarks,
  useSaveMarks,
  useSections,
  useSectionRoster,
  useSubjects,
} from '@/hooks/useAcademic';
import { ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';

const TERM_LABEL: Record<string, string> = { term1: 'چهارماه اول', term2: 'چهارماه دوم', final: 'امتحان سالانه' };

const EMPTY_FORM = {
  title: '',
  section_id: '',
  subject_id: '',
  academic_year_id: '',
  term: 'term1',
  assessment_date: new Date().toISOString().slice(0, 10),
  max_score: '100',
  weight: '1',
  status: 'active',
};

export default function Assessments() {
  const { schoolId, canManage, role } = useAcademicScope();
  const canRecord = canManage || role === 'teacher';
  const { data: assessments = [], isLoading } = useAssessments();
  const { data: sections = [] } = useSections();
  const { data: subjects = [] } = useSubjects();
  const { data: years = [] } = useAcademicYears();
  const { save, remove } = useAcademicMutation('assessments');
  const { showConfirmation } = useConfirmation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AssessmentWithRelations | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState('all');

  // Marks entry drawer
  const [marksFor, setMarksFor] = useState<AssessmentWithRelations | null>(null);
  const { data: roster = [] } = useSectionRoster(marksFor?.section_id ?? null);
  const { data: marks = [] } = useMarks(marksFor?.id ?? null);
  const saveMarks = useSaveMarks(marksFor?.id ?? null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [marksError, setMarksError] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const s of roster) next[s.student_id] = '';
    for (const m of marks) next[m.student_id] = m.score === null ? '' : String(m.score);
    setScores(next);
  }, [marks, roster]);

  const filtered = useMemo(
    () => assessments.filter((a) => termFilter === 'all' || a.term === termFilter),
    [assessments, termFilter],
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      section_id: sections.find((s) => s.status === 'active')?.id ?? '',
      academic_year_id: years.find((y) => y.status === 'active')?.id ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const openEdit = (a: AssessmentWithRelations) => {
    setEditing(a);
    setForm({
      title: a.title,
      section_id: a.section_id,
      subject_id: a.subject_id,
      academic_year_id: a.academic_year_id,
      term: a.term,
      assessment_date: a.assessment_date,
      max_score: String(a.max_score),
      weight: String(a.weight),
      status: a.status,
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    const title = form.title.trim();
    if (!title) return setError('عنوان امتحان الزامی است');
    if (title.length > 120) return setError('عنوان نباید بیشتر از ۱۲۰ حرف باشد');
    if (!form.section_id) return setError('انتخاب بخش الزامی است');
    if (!form.subject_id) return setError('انتخاب مضمون الزامی است');
    if (!form.academic_year_id) return setError('انتخاب سال تحصیلی الزامی است');
    const maxScore = Number(form.max_score);
    const weight = Number(form.weight);
    if (!Number.isFinite(maxScore) || maxScore <= 0) return setError('نمره مجموعی باید بیشتر از صفر باشد');
    if (!Number.isFinite(weight) || weight <= 0) return setError('ضریب باید بیشتر از صفر باشد');
    setError(null);
    await save.mutateAsync({
      id: editing?.id,
      values: {
        title,
        section_id: form.section_id,
        subject_id: form.subject_id,
        academic_year_id: form.academic_year_id,
        term: form.term,
        assessment_date: form.assessment_date,
        max_score: maxScore,
        weight,
        status: form.status,
      },
    });
    setOpen(false);
  };

  const confirmDelete = (a: AssessmentWithRelations) =>
    showConfirmation({
      title: 'حذف امتحان',
      description: `آیا از حذف «${a.title}» مطمئن هستید؟ نمرات ثبت‌شده نیز حذف می‌شوند.`,
      confirmLabel: 'حذف',
      isDangerous: true,
      onConfirm: () => remove.mutateAsync(a.id),
    });

  const submitMarks = async () => {
    if (!marksFor) return;
    const rows: { student_id: string; score: number | null }[] = [];
    for (const s of roster) {
      const raw = (scores[s.student_id] ?? '').trim();
      if (raw === '') {
        rows.push({ student_id: s.student_id, score: null });
        continue;
      }
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) return setMarksError(`نمره «${s.full_name}» معتبر نیست`);
      if (value > Number(marksFor.max_score)) return setMarksError(`نمره «${s.full_name}» از نمره مجموعی بیشتر است`);
      rows.push({ student_id: s.student_id, score: value });
    }
    setMarksError(null);
    await saveMarks.mutateAsync(rows);
    setMarksFor(null);
  };

  const columns = useMemo<ColumnDef<AssessmentWithRelations, any>[]>(() => [
    { accessorKey: 'title', header: 'عنوان' },
    { accessorKey: 'subject_name', header: 'مضمون' },
    {
      accessorKey: 'section_name',
      header: 'بخش',
      cell: ({ row }) => `${row.original.grade_name} — ${row.original.section_name}`,
    },
    {
      accessorKey: 'term',
      header: 'دوره',
      cell: ({ row }) => <Badge variant="info">{TERM_LABEL[row.original.term]}</Badge>,
    },
    {
      accessorKey: 'assessment_date',
      header: 'تاریخ',
      cell: ({ row }) => <span dir="ltr" className="text-xs text-muted-foreground">{row.original.assessment_date}</span>,
    },
    {
      accessorKey: 'max_score',
      header: 'نمره مجموعی',
      cell: ({ row }) => `${row.original.max_score} (ضریب ${row.original.weight})`,
    },
    {
      id: 'actions',
      header: 'عملیات',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {canRecord && (
            <Button variant="outline" size="sm" onClick={() => { setMarksError(null); setMarksFor(row.original); }}>
              ثبت نمرات
            </Button>
          )}
          {canRecord && (
            <Button variant="ghost" size="icon" aria-label="ویرایش" onClick={() => openEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canManage && (
            <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => confirmDelete(row.original)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ], [canManage, canRecord]);

  const subjectOptions = useMemo(() => {
    const section = sections.find((s) => s.id === form.section_id);
    if (!section) return subjects;
    return subjects.filter((s) => !s.grade_level_id || s.grade_level_id === section.grade_level_id);
  }, [subjects, sections, form.section_id]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="امتحانات و نمرات"
        description="ایجاد امتحان و ثبت نمرات شاگردان"
        icon={<ClipboardCheck className="h-7 w-7" />}
        actions={canRecord && schoolId ? [{ label: 'امتحان جدید', onClick: openNew }] : undefined}
      />

      {!isLoading && assessments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="هنوز امتحانی ثبت نشده است"
          description={schoolId ? 'اولین امتحان را برای یک بخش و مضمون ایجاد کنید.' : 'ابتدا مکتب خود را در پروفایل مشخص کنید.'}
          action={canRecord && schoolId ? <Button onClick={openNew}><Plus className="h-4 w-4 me-1" />امتحان جدید</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          searchPlaceholder="جستجوی عنوان یا مضمون..."
          searchableKeys={['title', 'subject_name', 'section_name']}
          exportFilename="assessments"
          toolbarExtra={
            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className="h-9 w-40" aria-label="فیلتر دوره"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دوره‌ها</SelectItem>
                <SelectItem value="term1">چهارماه اول</SelectItem>
                <SelectItem value="term2">چهارماه دوم</SelectItem>
                <SelectItem value="final">امتحان سالانه</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش امتحان' : 'امتحان جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="as-title">عنوان امتحان</Label>
              <Input id="as-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="امتحان ماهوار ریاضی" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="as-section">بخش</Label>
                <Select value={form.section_id} onValueChange={(v) => setForm({ ...form, section_id: v, subject_id: '' })}>
                  <SelectTrigger id="as-section"><SelectValue placeholder="انتخاب بخش" /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.grade_name} — {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="as-subject">مضمون</Label>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger id="as-subject"><SelectValue placeholder="انتخاب مضمون" /></SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="as-year">سال تحصیلی</Label>
                <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
                  <SelectTrigger id="as-year"><SelectValue placeholder="انتخاب سال" /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="as-term">دوره</Label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                  <SelectTrigger id="as-term"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term1">چهارماه اول</SelectItem>
                    <SelectItem value="term2">چهارماه دوم</SelectItem>
                    <SelectItem value="final">امتحان سالانه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="as-date">تاریخ</Label>
                <Input id="as-date" type="date" value={form.assessment_date} onChange={(e) => setForm({ ...form, assessment_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="as-max">نمره مجموعی</Label>
                <Input id="as-max" type="number" min={1} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="as-weight">ضریب</Label>
                <Input id="as-weight" type="number" min={1} step="0.5" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="as-status">وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="as-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="archived">بایگانی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={submit} disabled={save.isPending}>ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailDrawer
        open={!!marksFor}
        onOpenChange={(o) => !o && setMarksFor(null)}
        title={marksFor ? `ثبت نمرات — ${marksFor.title}` : ''}
        description={marksFor ? `${marksFor.grade_name} — ${marksFor.section_name} • نمره مجموعی ${marksFor.max_score}` : undefined}
        footer={
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setMarksFor(null)}>انصراف</Button>
            <Button onClick={submitMarks} disabled={saveMarks.isPending || roster.length === 0}>ذخیره نمرات</Button>
          </div>
        }
      >
        {roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">شاگردی در این بخش ثبت‌نام نشده است.</p>
        ) : (
          <div className="space-y-2">
            {roster.map((s) => (
              <div key={s.student_id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">{s.student_code}</p>
                </div>
                <Input
                  className="w-24"
                  type="number"
                  min={0}
                  max={marksFor ? Number(marksFor.max_score) : undefined}
                  aria-label={`نمره ${s.full_name}`}
                  value={scores[s.student_id] ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [s.student_id]: e.target.value }))}
                />
              </div>
            ))}
            {marksError && <p className="text-sm text-destructive" role="alert">{marksError}</p>}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
