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
  EnrollmentWithRelations, useAcademicMutation, useAcademicScope, useAcademicYears,
  useEnrollments, useSections, useStudents,
} from '@/hooks/useAcademic';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  active: 'فعال',
  transferred: 'انتقال یافته',
  withdrawn: 'ترک تحصیل',
  completed: 'تکمیل شده',
};

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'muted'> = {
  active: 'success',
  transferred: 'info',
  withdrawn: 'warning',
  completed: 'muted',
};

const today = () => new Date().toISOString().slice(0, 10);

export default function Enrollments() {
  const { data: enrollments = [], isLoading } = useEnrollments();
  const { data: students = [] } = useStudents();
  const { data: sections = [] } = useSections();
  const { data: years = [] } = useAcademicYears();
  const { canManage, schoolId } = useAcademicScope();
  const { save, remove } = useAcademicMutation('enrollments');
  const { showConfirmation } = useConfirmation();

  const [yearFilter, setYearFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EnrollmentWithRelations | null>(null);
  const [form, setForm] = useState({
    student_id: '', section_id: '', academic_year_id: '',
    enrollment_date: today(), status: 'active', notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'active'), [students]);

  const filtered = useMemo(
    () => enrollments.filter((e) =>
      (yearFilter === 'all' || e.academic_year_id === yearFilter) &&
      (sectionFilter === 'all' || e.section_id === sectionFilter) &&
      (statusFilter === 'all' || e.status === statusFilter)),
    [enrollments, yearFilter, sectionFilter, statusFilter],
  );

  const selectedSection = sections.find((s) => s.id === form.section_id);
  const sectionFull = !!selectedSection
    && selectedSection.enrollment_count >= selectedSection.capacity
    && !(editing && editing.section_id === form.section_id && editing.status === 'active');

  const openNew = () => {
    setEditing(null);
    setForm({
      student_id: '',
      section_id: '',
      academic_year_id: years.find((y) => y.status === 'active')?.id ?? '',
      enrollment_date: today(),
      status: 'active',
      notes: '',
    });
    setError(null);
    setOpen(true);
  };

  const openEdit = (e: EnrollmentWithRelations) => {
    setEditing(e);
    setForm({
      student_id: e.student_id,
      section_id: e.section_id,
      academic_year_id: e.academic_year_id,
      enrollment_date: e.enrollment_date,
      status: e.status,
      notes: e.notes ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.student_id) return setError('انتخاب شاگرد الزامی است');
    if (!form.section_id) return setError('انتخاب بخش الزامی است');
    if (!form.academic_year_id) return setError('انتخاب سال تحصیلی الزامی است');
    if (!form.enrollment_date) return setError('تاریخ ثبت‌نام الزامی است');
    if (
      form.status === 'active' &&
      enrollments.some((e) =>
        e.id !== editing?.id &&
        e.student_id === form.student_id &&
        e.academic_year_id === form.academic_year_id &&
        e.status === 'active')
    ) {
      return setError('این شاگرد در همین سال تحصیلی ثبت‌نام فعال دارد');
    }
    if (form.status === 'active' && sectionFull) {
      return setError('ظرفیت این بخش تکمیل است');
    }
    setError(null);
    await save.mutateAsync({
      id: editing?.id,
      values: {
        student_id: form.student_id,
        section_id: form.section_id,
        academic_year_id: form.academic_year_id,
        enrollment_date: form.enrollment_date,
        status: form.status,
        notes: form.notes.trim() || null,
      },
    });
    setOpen(false);
  };

  const confirmDelete = (e: EnrollmentWithRelations) =>
    showConfirmation({
      title: 'حذف ثبت‌نام',
      description: `آیا از حذف ثبت‌نام «${e.student_name}» مطمئن هستید؟`,
      confirmLabel: 'حذف',
      isDangerous: true,
      onConfirm: () => remove.mutateAsync(e.id),
    });

  const columns = useMemo<ColumnDef<EnrollmentWithRelations, any>[]>(() => [
    { accessorKey: 'student_name', header: 'شاگرد' },
    {
      accessorKey: 'student_code',
      header: 'شماره',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.student_code}</span>,
    },
    { accessorKey: 'grade_name', header: 'صنف' },
    { accessorKey: 'section_name', header: 'بخش' },
    { accessorKey: 'academic_year_name', header: 'سال تحصیلی' },
    { accessorKey: 'enrollment_date', header: 'تاریخ ثبت‌نام' },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? 'muted'}>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
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
  ], [canManage, enrollments]);

  const canCreate = canManage && !!schoolId;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="ثبت‌نام شاگردان"
        description="تخصیص شاگردان به بخش‌ها در سال تحصیلی"
        icon={<ClipboardList className="h-7 w-7" />}
        actions={canCreate ? [{ label: 'ثبت‌نام جدید', onClick: openNew }] : undefined}
      />

      {!isLoading && enrollments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="هنوز ثبت‌نامی انجام نشده است"
          description={schoolId ? 'شاگردان را به بخش‌های مکتب تخصیص دهید.' : 'ابتدا مکتب خود را در پروفایل مشخص کنید.'}
          action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4 me-1" />ثبت‌نام جدید</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          searchPlaceholder="جستجوی شاگرد..."
          searchableKeys={['student_name', 'student_code', 'section_name', 'grade_name']}
          exportFilename="enrollments"
          toolbarExtra={
            <div className="flex items-center gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-9 w-36" aria-label="فیلتر سال تحصیلی"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سال‌ها</SelectItem>
                  {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="h-9 w-36" aria-label="فیلتر بخش"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه بخش‌ها</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.grade_name} — {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-32" aria-label="فیلتر وضعیت"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش ثبت‌نام' : 'ثبت‌نام جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="en-student">شاگرد</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger id="en-student"><SelectValue placeholder="انتخاب شاگرد" /></SelectTrigger>
                <SelectContent>
                  {activeStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.student_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="en-section">بخش</Label>
                <Select value={form.section_id} onValueChange={(v) => setForm({ ...form, section_id: v })}>
                  <SelectTrigger id="en-section"><SelectValue placeholder="انتخاب بخش" /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.grade_name} — {s.name} ({s.enrollment_count}/{s.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSection && (
                  <p className={`text-xs ${sectionFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                    ظرفیت: {selectedSection.enrollment_count} از {selectedSection.capacity}
                    {sectionFull ? ' — تکمیل است' : ''}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="en-year">سال تحصیلی</Label>
                <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
                  <SelectTrigger id="en-year"><SelectValue placeholder="انتخاب سال" /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="en-date">تاریخ ثبت‌نام</Label>
                <Input id="en-date" type="date" value={form.enrollment_date} onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="en-status">وضعیت</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger id="en-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="en-notes">یادداشت (اختیاری)</Label>
              <Textarea id="en-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
