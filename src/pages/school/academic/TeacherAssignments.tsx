import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import {
  TeacherAssignmentWithRelations, useAcademicMutation, useAcademicScope, useAcademicYears,
  useSchoolTeachers, useSections, useSubjects, useTeacherAssignments,
} from '@/hooks/useAcademic';
import { Pencil, Plus, Trash2, UserCheck } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = { active: 'فعال', archived: 'بایگانی شده' };

export default function TeacherAssignments() {
  const { data: assignments = [], isLoading } = useTeacherAssignments();
  const { data: teachers = [] } = useSchoolTeachers();
  const { data: subjects = [] } = useSubjects();
  const { data: sections = [] } = useSections();
  const { data: years = [] } = useAcademicYears();
  const { canManage, schoolId } = useAcademicScope();
  const { save, remove } = useAcademicMutation('teacher_assignments');
  const { showConfirmation } = useConfirmation();

  const [yearFilter, setYearFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherAssignmentWithRelations | null>(null);
  const [form, setForm] = useState({
    teacher_user_id: '', subject_id: '', section_id: '', academic_year_id: '',
    weekly_hours: '0', status: 'active', notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => assignments.filter((a) =>
      (yearFilter === 'all' || a.academic_year_id === yearFilter) &&
      (teacherFilter === 'all' || a.teacher_user_id === teacherFilter)),
    [assignments, yearFilter, teacherFilter],
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      teacher_user_id: teachers[0]?.user_id ?? '',
      subject_id: subjects[0]?.id ?? '',
      section_id: sections[0]?.id ?? '',
      academic_year_id: years.find((y) => y.status === 'active')?.id ?? years[0]?.id ?? '',
      weekly_hours: '0',
      status: 'active',
      notes: '',
    });
    setError(null);
    setOpen(true);
  };

  const openEdit = (a: TeacherAssignmentWithRelations) => {
    setEditing(a);
    setForm({
      teacher_user_id: a.teacher_user_id,
      subject_id: a.subject_id,
      section_id: a.section_id,
      academic_year_id: a.academic_year_id,
      weekly_hours: String(a.weekly_hours),
      status: a.status,
      notes: a.notes ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.teacher_user_id) return setError('انتخاب معلم الزامی است');
    if (!form.subject_id) return setError('انتخاب مضمون الزامی است');
    if (!form.section_id) return setError('انتخاب بخش الزامی است');
    if (!form.academic_year_id) return setError('انتخاب سال تحصیلی الزامی است');
    const hours = Number(form.weekly_hours);
    if (!Number.isInteger(hours) || hours < 0) return setError('ساعت هفتگی باید عدد صحیح و نامنفی باشد');
    const duplicate = assignments.some((a) =>
      a.id !== editing?.id &&
      a.teacher_user_id === form.teacher_user_id &&
      a.subject_id === form.subject_id &&
      a.section_id === form.section_id &&
      a.academic_year_id === form.academic_year_id);
    if (duplicate) return setError('این تخصیص قبلاً ثبت شده است');
    setError(null);
    await save.mutateAsync({
      id: editing?.id,
      values: {
        teacher_user_id: form.teacher_user_id,
        subject_id: form.subject_id,
        section_id: form.section_id,
        academic_year_id: form.academic_year_id,
        weekly_hours: hours,
        status: form.status,
        notes: form.notes.trim() || null,
      },
    });
    setOpen(false);
  };

  const confirmDelete = (a: TeacherAssignmentWithRelations) =>
    showConfirmation({
      title: 'حذف تخصیص',
      description: `آیا از حذف تخصیص «${a.teacher_name} - ${a.subject_name}» مطمئن هستید؟`,
      confirmLabel: 'حذف',
      isDangerous: true,
      onConfirm: () => remove.mutateAsync(a.id),
    });

  const columns = useMemo<ColumnDef<TeacherAssignmentWithRelations, any>[]>(() => [
    { accessorKey: 'teacher_name', header: 'معلم' },
    { accessorKey: 'subject_name', header: 'مضمون' },
    {
      id: 'class',
      header: 'صنف / بخش',
      accessorFn: (row) => `${row.grade_name} - ${row.section_name}`,
      cell: ({ row }) => <span>{row.original.grade_name} - {row.original.section_name}</span>,
    },
    { accessorKey: 'academic_year_name', header: 'سال تحصیلی' },
    { accessorKey: 'weekly_hours', header: 'ساعت هفتگی' },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'success' : 'muted'}>
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'عملیات',
      enableSorting: false,
      cell: ({ row }) =>
        canManage ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="ویرایش" onClick={() => openEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => confirmDelete(row.original)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : <span className="text-xs text-muted-foreground">—</span>,
    },
  ], [canManage, assignments]);

  const canCreate = canManage && teachers.length > 0 && subjects.length > 0 && sections.length > 0 && years.length > 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="تخصیص معلمان"
        description="تعیین معلم برای هر مضمون در بخش‌های مکتب"
        icon={<UserCheck className="h-7 w-7" />}
        actions={canCreate ? [{ label: 'تخصیص جدید', onClick: openNew }] : undefined}
      />

      {!isLoading && assignments.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="هنوز تخصیصی ثبت نشده است"
          description={
            !schoolId ? 'ابتدا مکتب خود را در پروفایل مشخص کنید.'
              : !canCreate ? 'ابتدا معلمان، مضامین، بخش‌ها و سال تحصیلی را ایجاد کنید.'
                : 'اولین تخصیص معلم را ثبت کنید.'
          }
          action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4 me-1" />تخصیص جدید</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          searchPlaceholder="جستجوی تخصیص..."
          searchableKeys={['teacher_name', 'subject_name', 'section_name', 'grade_name']}
          exportFilename="teacher-assignments"
          toolbarExtra={
            <div className="flex items-center gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-9 w-36" aria-label="فیلتر سال تحصیلی"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سال‌ها</SelectItem>
                  {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                <SelectTrigger className="h-9 w-40" aria-label="فیلتر معلم"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه معلمان</SelectItem>
                  {teachers.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش تخصیص' : 'تخصیص جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="ta-teacher">معلم</Label>
              <Select value={form.teacher_user_id} onValueChange={(v) => setForm({ ...form, teacher_user_id: v })}>
                <SelectTrigger id="ta-teacher"><SelectValue placeholder="انتخاب معلم" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ta-subject">مضمون</Label>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger id="ta-subject"><SelectValue placeholder="انتخاب مضمون" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ta-section">بخش</Label>
                <Select value={form.section_id} onValueChange={(v) => setForm({ ...form, section_id: v })}>
                  <SelectTrigger id="ta-section"><SelectValue placeholder="انتخاب بخش" /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.grade_name} - {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ta-year">سال تحصیلی</Label>
                <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
                  <SelectTrigger id="ta-year"><SelectValue placeholder="انتخاب سال" /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ta-hours">ساعت هفتگی</Label>
                <Input id="ta-hours" type="number" min={0} value={form.weekly_hours} onChange={(e) => setForm({ ...form, weekly_hours: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ta-status">وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="ta-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="archived">بایگانی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ta-notes">یادداشت (اختیاری)</Label>
              <Textarea id="ta-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={submit} disabled={save.isPending}>ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
