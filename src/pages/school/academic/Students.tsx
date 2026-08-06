import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Student, useAcademicMutation, useAcademicScope, useStudents } from '@/hooks/useAcademic';
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = { active: 'فعال', archived: 'بایگانی شده' };
const GENDER_LABEL: Record<string, string> = { male: 'پسر', female: 'دختر' };

const EMPTY_FORM = {
  student_code: '',
  full_name: '',
  father_name: '',
  gender: 'male',
  date_of_birth: '',
  national_id: '',
  guardian_name: '',
  guardian_phone: '',
  address: '',
  status: 'active',
};

export default function Students() {
  const navigate = useNavigate();
  const { data: students = [], isLoading } = useStudents();
  const { canManage, schoolId } = useAcademicScope();
  const { save, remove } = useAcademicMutation('students');
  const { showConfirmation } = useConfirmation();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => students.filter((s) =>
      (statusFilter === 'all' || s.status === statusFilter) &&
      (genderFilter === 'all' || s.gender === genderFilter)),
    [students, statusFilter, genderFilter],
  );

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      student_code: s.student_code,
      full_name: s.full_name,
      father_name: s.father_name ?? '',
      gender: s.gender,
      date_of_birth: s.date_of_birth ?? '',
      national_id: s.national_id ?? '',
      guardian_name: s.guardian_name ?? '',
      guardian_phone: s.guardian_phone ?? '',
      address: s.address ?? '',
      status: s.status,
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    const code = form.student_code.trim();
    const name = form.full_name.trim();
    if (!code) return setError('شماره شاگرد الزامی است');
    if (code.length > 40) return setError('شماره شاگرد نباید بیشتر از ۴۰ حرف باشد');
    if (!name) return setError('نام کامل شاگرد الزامی است');
    if (name.length > 120) return setError('نام نباید بیشتر از ۱۲۰ حرف باشد');
    const phone = form.guardian_phone.trim();
    if (phone && !/^[0-9+\-\s]{7,20}$/.test(phone)) return setError('شماره تماس معتبر نیست');
    if (students.some((s) => s.id !== editing?.id && s.student_code.toLowerCase() === code.toLowerCase())) {
      return setError('این شماره شاگرد قبلاً در مکتب شما ثبت شده است');
    }
    setError(null);
    await save.mutateAsync({
      id: editing?.id,
      values: {
        student_code: code,
        full_name: name,
        father_name: form.father_name.trim() || null,
        gender: form.gender,
        date_of_birth: form.date_of_birth || null,
        national_id: form.national_id.trim() || null,
        guardian_name: form.guardian_name.trim() || null,
        guardian_phone: phone || null,
        address: form.address.trim() || null,
        status: form.status,
      },
    });
    setOpen(false);
  };

  const confirmDelete = (s: Student) =>
    showConfirmation({
      title: 'حذف شاگرد',
      description: `آیا از حذف «${s.full_name}» مطمئن هستید؟ ثبت‌نام‌های مرتبط نیز حذف می‌شوند.`,
      confirmLabel: 'حذف',
      isDangerous: true,
      onConfirm: () => remove.mutateAsync(s.id),
    });

  const columns = useMemo<ColumnDef<Student, any>[]>(() => [
    {
      accessorKey: 'student_code',
      header: 'شماره',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.student_code}</span>,
    },
    {
      accessorKey: 'full_name',
      header: 'نام کامل',
      cell: ({ row }) => (
        <button
          type="button"
          className="text-start font-medium text-primary hover:underline"
          onClick={() => navigate(`/school/academic/students/${row.original.id}`)}
        >
          {row.original.full_name}
        </button>
      ),
    },
    {
      accessorKey: 'father_name',
      header: 'نام پدر',
      cell: ({ row }) => row.original.father_name || '—',
    },
    {
      accessorKey: 'gender',
      header: 'جنسیت',
      cell: ({ row }) => (
        <Badge variant={row.original.gender === 'female' ? 'info' : 'muted'}>
          {GENDER_LABEL[row.original.gender]}
        </Badge>
      ),
    },
    {
      accessorKey: 'guardian_phone',
      header: 'تماس سرپرست',
      cell: ({ row }) => <span dir="ltr">{row.original.guardian_phone || '—'}</span>,
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
  ], [canManage, students, navigate]);

  const canCreate = canManage && !!schoolId;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="شاگردان"
        description="ثبت و مدیریت معلومات شاگردان مکتب"
        icon={<GraduationCap className="h-7 w-7" />}
        actions={canCreate ? [{ label: 'شاگرد جدید', onClick: openNew }] : undefined}
      />

      {!isLoading && students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="هنوز شاگردی ثبت نشده است"
          description={schoolId ? 'اولین شاگرد مکتب خود را ثبت کنید.' : 'ابتدا مکتب خود را در پروفایل مشخص کنید.'}
          action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4 me-1" />شاگرد جدید</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          searchPlaceholder="جستجوی نام یا شماره شاگرد..."
          searchableKeys={['full_name', 'student_code', 'father_name']}
          exportFilename="students"
          toolbarExtra={
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-32" aria-label="فیلتر وضعیت"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="archived">بایگانی شده</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="h-9 w-28" aria-label="فیلتر جنسیت"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="male">پسر</SelectItem>
                  <SelectItem value="female">دختر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش شاگرد' : 'شاگرد جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="st-code">شماره شاگرد</Label>
                <Input id="st-code" value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value })} placeholder="1403-001" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="st-name">نام کامل</Label>
                <Input id="st-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="احمد احمدی" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="st-father">نام پدر</Label>
                <Input id="st-father" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="st-gender">جنسیت</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger id="st-gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">پسر</SelectItem>
                    <SelectItem value="female">دختر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="st-dob">تاریخ تولد (اختیاری)</Label>
                <Input id="st-dob" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="st-nid">شماره تذکره (اختیاری)</Label>
                <Input id="st-nid" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="st-guardian">نام سرپرست</Label>
                <Input id="st-guardian" value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="st-phone">شماره تماس سرپرست</Label>
                <Input id="st-phone" dir="ltr" value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} placeholder="07XXXXXXXX" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="st-status">وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="st-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="archived">بایگانی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="st-address">آدرس (اختیاری)</Label>
              <Textarea id="st-address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
