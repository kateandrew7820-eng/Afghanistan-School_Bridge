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
import { GradeLevel, useAcademicMutation, useAcademicScope, useGradeLevels } from '@/hooks/useAcademic';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = { active: 'فعال', archived: 'بایگانی شده' };

export default function Grades() {
  const { data: grades = [], isLoading } = useGradeLevels();
  const { canManage, schoolId } = useAcademicScope();
  const { save, remove } = useAcademicMutation('grade_levels');
  const { showConfirmation } = useConfirmation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GradeLevel | null>(null);
  const [form, setForm] = useState({ name: '', display_order: '0', status: 'active', description: '' });
  const [error, setError] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', display_order: String(grades.length + 1), status: 'active', description: '' });
    setError(null);
    setOpen(true);
  };

  const openEdit = (g: GradeLevel) => {
    setEditing(g);
    setForm({
      name: g.name, display_order: String(g.display_order),
      status: g.status, description: g.description ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    const name = form.name.trim();
    if (!name) return setError('نام صنف الزامی است');
    const order = Number(form.display_order);
    if (!Number.isInteger(order) || order < 0) return setError('ترتیب نمایش باید عدد صحیح باشد');
    if (grades.some((g) => g.name === name && g.id !== editing?.id)) {
      return setError('این نام قبلاً در مکتب شما ثبت شده است');
    }
    setError(null);
    await save.mutateAsync({
      id: editing?.id,
      values: {
        name,
        display_order: order,
        status: form.status,
        description: form.description.trim() || null,
      },
    });
    setOpen(false);
  };

  const confirmDelete = (g: GradeLevel) =>
    showConfirmation({
      title: 'حذف صنف',
      description: `آیا از حذف «${g.name}» مطمئن هستید؟ بخش‌های مرتبط نیز حذف می‌شوند.`,
      confirmLabel: 'حذف',
      isDangerous: true,
      onConfirm: () => remove.mutateAsync(g.id),
    });

  const columns = useMemo<ColumnDef<GradeLevel, any>[]>(() => [
    { accessorKey: 'display_order', header: 'ترتیب' },
    { accessorKey: 'name', header: 'نام صنف' },
    {
      accessorKey: 'description',
      header: 'توضیحات',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.description || '—'}</span>,
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
  ], [canManage, grades]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="صنف‌ها"
        description="مدیریت لیست صنف‌های مکتب (صنف ۱ تا ۱۲)"
        icon={<Layers className="h-7 w-7" />}
        actions={canManage ? [{ label: 'صنف جدید', onClick: openNew }] : undefined}
      />

      {!isLoading && grades.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="هنوز صنفی ثبت نشده است"
          description={schoolId ? 'لیست صنف‌های مکتب خود را ایجاد کنید.' : 'ابتدا مکتب خود را در پروفایل مشخص کنید.'}
          action={canManage && schoolId ? <Button onClick={openNew}><Plus className="h-4 w-4 me-1" />صنف جدید</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={grades}
          loading={isLoading}
          searchPlaceholder="جستجوی صنف..."
          searchableKeys={['name', 'description']}
          exportFilename="grade-levels"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش صنف' : 'صنف جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="g-name">نام صنف</Label>
              <Input id="g-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="صنف ۱۰" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="g-order">ترتیب نمایش</Label>
              <Input id="g-order" type="number" min={0} value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="g-status">وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="g-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="archived">بایگانی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="g-desc">توضیحات (اختیاری)</Label>
              <Textarea id="g-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
