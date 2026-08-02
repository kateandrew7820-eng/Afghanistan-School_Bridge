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
  SubjectWithRelations, useAcademicMutation, useAcademicScope, useGradeLevels, useSubjects,
} from '@/hooks/useAcademic';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = { active: 'فعال', archived: 'بایگانی شده' };
const GENERAL = 'general';

export default function Subjects() {
  const { data: subjects = [], isLoading } = useSubjects();
  const { data: grades = [] } = useGradeLevels();
  const { canManage, schoolId } = useAcademicScope();
  const { save, remove } = useAcademicMutation('subjects');
  const { showConfirmation } = useConfirmation();

  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectWithRelations | null>(null);
  const [form, setForm] = useState({
    name: '', code: '', grade_level_id: GENERAL, weekly_hours: '0', status: 'active', description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => subjects.filter((s) =>
      gradeFilter === 'all' ||
      (gradeFilter === GENERAL ? !s.grade_level_id : s.grade_level_id === gradeFilter)),
    [subjects, gradeFilter],
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', code: '', grade_level_id: GENERAL, weekly_hours: '0', status: 'active', description: '' });
    setError(null);
    setOpen(true);
  };

  const openEdit = (s: SubjectWithRelations) => {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code ?? '',
      grade_level_id: s.grade_level_id ?? GENERAL,
      weekly_hours: String(s.weekly_hours),
      status: s.status,
      description: s.description ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    const name = form.name.trim();
    if (!name) return setError('نام مضمون الزامی است');
    const hours = Number(form.weekly_hours);
    if (!Number.isInteger(hours) || hours < 0) return setError('ساعت هفتگی باید عدد صحیح و نامنفی باشد');
    const code = form.code.trim();
    if (subjects.some((s) => s.id !== editing?.id && s.name.toLowerCase() === name.toLowerCase())) {
      return setError('این نام مضمون قبلاً در مکتب شما ثبت شده است');
    }
    if (code && subjects.some((s) => s.id !== editing?.id && (s.code ?? '').toLowerCase() === code.toLowerCase())) {
      return setError('این کد مضمون قبلاً استفاده شده است');
    }
    setError(null);
    await save.mutateAsync({
      id: editing?.id,
      values: {
        name,
        code: code || null,
        grade_level_id: form.grade_level_id === GENERAL ? null : form.grade_level_id,
        weekly_hours: hours,
        status: form.status,
        description: form.description.trim() || null,
      },
    });
    setOpen(false);
  };

  const confirmDelete = (s: SubjectWithRelations) =>
    showConfirmation({
      title: 'حذف مضمون',
      description: `آیا از حذف «${s.name}» مطمئن هستید؟ تخصیص‌های معلمان مرتبط نیز حذف می‌شوند.`,
      confirmLabel: 'حذف',
      isDangerous: true,
      onConfirm: () => remove.mutateAsync(s.id),
    });

  const columns = useMemo<ColumnDef<SubjectWithRelations, any>[]>(() => [
    { accessorKey: 'name', header: 'نام مضمون' },
    {
      accessorKey: 'code',
      header: 'کد',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.code || '—'}</span>,
    },
    { accessorKey: 'grade_name', header: 'صنف' },
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
  ], [canManage, subjects]);

  const canCreate = canManage && !!schoolId;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="مضامین"
        description="مدیریت لیست مضامین درسی مکتب"
        icon={<BookOpen className="h-7 w-7" />}
        actions={canCreate ? [{ label: 'مضمون جدید', onClick: openNew }] : undefined}
      />

      {!isLoading && subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="هنوز مضمونی ثبت نشده است"
          description={schoolId ? 'مضامین درسی مکتب خود را ایجاد کنید.' : 'ابتدا مکتب خود را در پروفایل مشخص کنید.'}
          action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4 me-1" />مضمون جدید</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          searchPlaceholder="جستجوی مضمون..."
          searchableKeys={['name', 'code', 'grade_name']}
          exportFilename="subjects"
          toolbarExtra={
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="h-9 w-36" aria-label="فیلتر صنف"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه صنف‌ها</SelectItem>
                <SelectItem value={GENERAL}>عمومی</SelectItem>
                {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش مضمون' : 'مضمون جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sub-name">نام مضمون</Label>
                <Input id="sub-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ریاضی" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sub-code">کد (اختیاری)</Label>
                <Input id="sub-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MATH-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sub-grade">صنف</Label>
                <Select value={form.grade_level_id} onValueChange={(v) => setForm({ ...form, grade_level_id: v })}>
                  <SelectTrigger id="sub-grade"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENERAL}>عمومی (همه صنف‌ها)</SelectItem>
                    {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sub-hours">ساعت هفتگی</Label>
                <Input id="sub-hours" type="number" min={0} value={form.weekly_hours} onChange={(e) => setForm({ ...form, weekly_hours: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sub-status">وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="sub-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="archived">بایگانی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sub-desc">توضیحات (اختیاری)</Label>
              <Textarea id="sub-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
