import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/sanitizeError';
import { DataTable } from '@/components/DataTable';
import { Users, CheckCircle2, XCircle } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  student: 'شاگرد',
  teacher: 'معلم',
  principal: 'مدیر مکتب',
  district_admin: 'رئیس معارف ولسوالی',
  province_admin: 'رئیس معارف ولایت',
  ministry_admin: 'وزارت معارف',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending_verification: { label: 'در انتظار', className: 'bg-warning/15 text-warning' },
  verified: { label: 'تأیید شده', className: 'bg-success/15 text-success' },
  rejected: { label: 'رد شده', className: 'bg-destructive/15 text-destructive' },
};

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string | null;
  status: string | null;
  school_name: string | null;
  district: string | null;
  province: string | null;
};

export default function MinistryUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['ministry-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const filtered = useMemo(() => {
    return (profiles ?? []).filter(p => statusFilter === 'all' || p.status === statusFilter);
  }, [profiles, statusFilter]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase.rpc('admin_update_profile_status', { _target_user_id: userId, _status: newStatus });
      if (error) throw error;
      toast({ title: 'موفقیت', description: 'وضعیت کاربر به‌روزرسانی شد' });
      queryClient.invalidateQueries({ queryKey: ['ministry-profiles'] });
    } catch (err) {
      toast({ title: 'خطا', description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = useMemo<ColumnDef<Profile>[]>(() => [
    {
      accessorKey: 'full_name',
      header: 'نام',
      cell: ({ row }) => <span className="font-medium">{row.original.full_name || 'بدون نام'}</span>,
    },
    {
      accessorKey: 'role',
      header: 'نقش',
      cell: ({ row }) => ROLE_LABELS[row.original.role ?? ''] ?? row.original.role ?? '—',
    },
    { accessorKey: 'school_name', header: 'مکتب', cell: ({ row }) => row.original.school_name ?? '—' },
    { accessorKey: 'district', header: 'ولسوالی', cell: ({ row }) => row.original.district ?? '—' },
    { accessorKey: 'province', header: 'ولایت', cell: ({ row }) => row.original.province ?? '—' },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => {
        const info = STATUS_LABELS[row.original.status ?? ''] ?? STATUS_LABELS.pending_verification;
        return <Badge className={`text-xs ${info.className}`}>{info.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'عملیات',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        if (row.original.status !== 'pending_verification') return null;
        const disabled = updatingId === row.original.user_id;
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="text-success" disabled={disabled}
              onClick={() => handleStatusChange(row.original.user_id, 'verified')}>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" disabled={disabled}
              onClick={() => handleStatusChange(row.original.user_id, 'rejected')}>
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], [updatingId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          مدیریت کاربران
        </h1>
        <p className="text-muted-foreground">تمام حساب‌های کاربری سیستم</p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        searchPlaceholder="جستجوی نام، مکتب، ولسوالی یا ولایت..."
        searchableKeys={['full_name', 'school_name', 'district', 'province']}
        exportFilename="users"
        toolbarExtra={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="pending_verification">در انتظار تأیید</SelectItem>
              <SelectItem value="verified">تأیید شده</SelectItem>
              <SelectItem value="rejected">رد شده</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
