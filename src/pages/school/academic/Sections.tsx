import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
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
  SectionWithRelations, useAcademicMutation, useAcademicScope, useAcademicYears,
  useGradeLevels, useSections,
} from '@/hooks/useAcademic';
import { Grid3x3, Pencil, Plus, Trash2 } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = { active: 'فعال', archived: 'بایگانی شده' };

export default function Sections() {
  const { data: sections = [], isLoading } = useSections();
  const { data: grades = [] } = useGradeLevels();
  const { data: years = [] } = useAcademicYears();
  const { canManage, schoolId } = useAcademicScope();
  const { save, remove } = useAcademicMutation('sections');
  const { showConfirmation } = useConfirmation();

  const [yearFilter, setYearFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SectionWithRelations | null>(null);
  const [form, setForm] = useState({
    name: '', grade_level_id: '', academic_year_id: '', capacity: '30', status: 'active',
  });
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => sections.filter((s) =>
      (yearFilter === 'all' || s.academic_year_id === yearFilter) &&
      (gradeFilter === 'all' || s.grade_level_id === gradeFilter)),
    [sections, yearFilter, gradeFilter],
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      grade_level_id: grades[0]?.id ?? '',
      academic_year_id: years.find((y) => y.status === 'active')?.id ?? years[0]?.id ?? '',
      capacity: '30',
      status: 'active',
    });
    setError(null);
    setOpen(true);
  };

  const openEdit = (s: SectionWithRelations) => {
    setEditing(s);
    setForm({
      name: s.name, grade_level_id: s.grade_level_id, academic_year_id: s.academic_year_id,
      capacity: String(s.capacity), status: s.status,
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    const name = form.name.trim();
    if (!name) return setError('نام بخش الزامی است');
    if (!form.grade_level_id) return setError('انتخاب صنف الزامی است');
    if (!form.academic_year_id) return setError('انتخاب سال تحصیلی الزامی است');
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0) return setError('ظرفیت باید عدد صحیح مثبت باشد');
    const duplicate = sections.some((s) =>
      s.id !== editing?.id && s.name === name &&
      s.grade_level_id === form.grade_level_id && s.academic_year_id === form.academic_year_id);
    if (duplicate) return setError('این بخش در همین صنف و سال تحصیلی وجود دارد');
    setError(null);
    await save.mutateAsync({
      id: editing?.id,
      values: {
        name,
        grade_level_id: form.grade_level_id,
        academic_year_id: form.academic_year_id,
        capacity,
        status: form.status,
      },
    });
    setOpen(false);
  };

  const confirmDelete = (s: SectionWithRelations) =>
    showConfirmation({
      title: 'حذف بخش',
      description: `آیا از حذف «${s.grade_name} - ${s.name}» مطمئن هستید؟`,
      confirmLabel: 'حذف',
      isDangerous: true,
      onConfirm: () => remove.mutateAsync(s.id),
    });

  const columns = useMemo<ColumnDef<SectionWithRelations, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'نام بخش',
      cell: ({ row }) => (
        <Link
          to={`/school/academic/sections/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: 'grade_name', header: 'صنف' },
    { accessorKey: 'academic_year_name', header: 'سال تحصیلی' },
    { accessorKey: 'capacity', header: 'ظرفیت' },
    {
      accessorKey: 'enrollment_count',
      header: 'شاگردان ثبت‌شده',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.enrollment_count} / {row.original.capacity}
        </span>
      ),
    },
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
  ], [canManage, sections]);

  const canCreate = canManage && grades.length > 0 && years.length > 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="بخش‌ها (صنوف درسی)"
        description="مدیریت بخش‌های هر صنف در سال تحصیلی"
        icon={<Grid3x3 className="h-7 w-7" />}
        actions={canCreate ? [{ label: 'بخش جدید', onClick: openNew }] : undefined}
      />

      {!isLoading && sections.length === 0 ? (
        <EmptyState
          icon={Grid3x3}
          title="هنوز بخشی ثبت نشده است"
          description={
            !schoolId ? 'ابتدا مکتب خود را در پروفایل مشخص کنید.'
              : grades.length === 0 || years.length === 0
                ? 'ابتدا سال تحصیلی و صنف‌ها را ایجاد کنید.'
                : 'اولین بخش را برای صنف‌های خود ایجاد کنید.'
          }
          action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4 me-1" />بخش جدید</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          searchPlaceholder="جستجوی بخش..."
          searchableKeys={['name', 'grade_name', 'academic_year_name']}
          exportFilename="sections"
          toolbarExtra={
            <div className="flex items-center gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-9 w-36" aria-label="فیلتر سال تحصیلی"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سال‌ها</SelectItem>
                  {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-9 w-32" aria-label="فیلتر صنف"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه صنف‌ها</SelectItem>
                  {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش بخش' : 'بخش جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="s-name">نام بخش</Label>
              <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الف" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="s-grade">صنف</Label>
                <Select value={form.grade_level_id} onValueChange={(v) => setForm({ ...form, grade_level_id: v })}>
                  <SelectTrigger id="s-grade"><SelectValue placeholder="انتخاب صنف" /></SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="s-year">سال تحصیلی</Label>
                <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
                  <SelectTrigger id="s-year"><SelectValue placeholder="انتخاب سال" /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-capacity">ظرفیت</Label>
              <Input id="s-capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-status">وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="s-status"><SelectValue /></SelectTrigger>
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
    </div>
  );
}
