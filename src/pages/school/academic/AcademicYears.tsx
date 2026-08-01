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
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import {
  AcademicYear, useAcademicMutation, useAcademicScope, useAcademicYears,
} from '@/hooks/useAcademic';
import { CalendarRange, Pencil, Plus, Trash2, Archive } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = { active: 'فعال', archived: 'بایگانی شده' };

export default function AcademicYears() {
  const { data: years = [], isLoading } = useAcademicYears();
  const { canManage, schoolId } = useAcademicScope();
  const { save, remove } = useAcademicMutation('academic_years');
  const { showConfirmation } = useConfirmation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', status: 'active', description: '' });
  const [error, setError] = useState<string | null>(null);

  const activeYear = years.find((y) => y.status === 'active');

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', start_date: '', end_date: '', status: 'active', description: '' });
    setError(null);
    setOpen(true);
  };

  const openEdit = (y: AcademicYear) => {
    setEditing(y);
    setForm({
      name: y.name, start_date: y.start_date, end_date: y.end_date,
      status: y.status, description: y.description ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return setError('نام سال تحصیلی الزامی است');
    if (!form.start_date || !form.end_date) return setError('تاریخ شروع و پایان الزامی است');
    if (form.end_date <= form.start_date) return setError('تاریخ پایان باید بعد از تاریخ شروع باشد');
    setError(null);
    await save.mutateAsync({
      id: editing?.id,
      values: {
        name: form.name.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
        description: form.description.trim() || null,
      },
    });
    setOpen(false);
  };

  const confirmDelete = (y: AcademicYear) =>
    showConfirmation({
      title: 'حذف سال تحصیلی',
      description: `آیا از حذف «${y.name}» مطمئن هستید؟ تمام صنف‌های مرتبط نیز حذف می‌شوند.`,
      confirmLabel: 'حذف',
      isDangerous: true,
      onConfirm: () => remove.mutateAsync(y.id),
    });

  const archive = (y: AcademicYear) =>
    showConfirmation({
      title: 'بایگانی سال تحصیلی',
      description: `«${y.name}» به حالت بایگانی منتقل شود؟`,
      confirmLabel: 'بایگانی',
      onConfirm: () => save.mutateAsync({ id: y.id, values: { status: 'archived' } }),
    });

  const columns = useMemo<ColumnDef<AcademicYear, any>[]>(() => [
    { accessorKey: 'name', header: 'نام' },
    { accessorKey: 'start_date', header: 'تاریخ شروع' },
    { accessorKey: 'end_date', header: 'تاریخ پایان' },
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
            {row.original.status === 'active' && (
              <Button variant="ghost" size="icon" aria-label="بایگانی" onClick={() => archive(row.original)}>
                <Archive className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => confirmDelete(row.original)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : <span className="text-xs text-muted-foreground">—</span>,
    },
  ], [canManage]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="سال‌های تحصیلی"
        description="مدیریت سال‌های تحصیلی مکتب شما"
        icon={<CalendarRange className="h-7 w-7" />}
        actions={canManage ? [{ label: 'سال تحصیلی جدید', onClick: openNew }] : undefined}
      />

      {activeYear && (
        <Card className="mb-4 border-primary/40">
          <CardContent className="py-4 flex flex-wrap items-center gap-3">
            <Badge variant="success">سال فعال</Badge>
            <span className="font-semibold">{activeYear.name}</span>
            <span className="text-sm text-muted-foreground">
              {activeYear.start_date} تا {activeYear.end_date}
            </span>
          </CardContent>
        </Card>
      )}

      {!isLoading && years.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="هنوز سال تحصیلی ثبت نشده است"
          description={schoolId ? 'برای شروع، اولین سال تحصیلی مکتب را ایجاد کنید.' : 'ابتدا مکتب خود را در پروفایل مشخص کنید.'}
          action={canManage && schoolId ? <Button onClick={openNew}><Plus className="h-4 w-4 me-1" />سال تحصیلی جدید</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={years}
          loading={isLoading}
          searchPlaceholder="جستجوی سال تحصیلی..."
          searchableKeys={['name', 'description']}
          exportFilename="academic-years"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش سال تحصیلی' : 'سال تحصیلی جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="ay-name">نام</Label>
              <Input id="ay-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="۱۴۰۴ - ۱۴۰۵" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ay-start">تاریخ شروع</Label>
                <Input id="ay-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ay-end">تاریخ پایان</Label>
                <Input id="ay-end" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ay-status">وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="ay-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="archived">بایگانی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ay-desc">توضیحات (اختیاری)</Label>
              <Textarea id="ay-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
