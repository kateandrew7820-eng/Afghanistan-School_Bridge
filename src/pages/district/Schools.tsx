import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import sanitizeError from '@/lib/sanitizeError';
import { DataTable } from '@/components/DataTable';
import { School, Plus, Loader2 } from 'lucide-react';

type SchoolRow = {
  id: string;
  name: string;
  code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
};

export default function DistrictSchools() {
  const { profile, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', code: '', contact_email: '', contact_phone: '' });

  const { data: schools, isLoading } = useQuery({
    queryKey: ['district-schools', profile?.district],
    queryFn: async () => {
      const { data, error } = await supabase.from('schools').select('*').eq('district', profile?.district ?? '').order('name');
      if (error) throw error;
      return data as SchoolRow[];
    },
    enabled: !!profile?.district,
  });

  const addSchoolMutation = useMutation({
    mutationFn: async (school: typeof newSchool) => {
      if (!session?.access_token) throw new Error('لطفاً دوباره وارد سیستم شوید');
      const { error } = await supabase.from('schools').insert({
        name: school.name,
        code: school.code || null,
        province: profile?.province || null,
        district: profile?.district || null,
        contact_email: school.contact_email || null,
        contact_phone: school.contact_phone || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'مکتب افزوده شد', description: `${newSchool.name} با موفقیت ثبت شد.` });
      setIsAddDialogOpen(false);
      setNewSchool({ name: '', code: '', contact_email: '', contact_phone: '' });
      queryClient.invalidateQueries({ queryKey: ['district-schools'] });
    },
    onError: (error: any) => {
      toast({ title: 'خطا در افزودن مکتب', description: sanitizeError(error?.message), variant: 'destructive' });
    },
  });

  const columns = useMemo<ColumnDef<SchoolRow>[]>(() => [
    { accessorKey: 'name', header: 'نام مکتب', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'code', header: 'کد', cell: ({ row }) => row.original.code ?? '—' },
    { accessorKey: 'contact_phone', header: 'تماس', cell: ({ row }) => <span dir="ltr">{row.original.contact_phone ?? '—'}</span> },
    { accessorKey: 'contact_email', header: 'ایمیل', cell: ({ row }) => row.original.contact_email ?? '—' },
    {
      accessorKey: 'is_active',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'} className="text-xs">
          {row.original.is_active ? 'فعال' : 'غیرفعال'}
        </Badge>
      ),
    },
  ], []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSchoolMutation.mutate(newSchool);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6" />
            مکاتب ولسوالی
          </h1>
          <p className="text-muted-foreground">مدیریت مکاتب ولسوالی {profile?.district}</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="ml-2 h-4 w-4" />افزودن مکتب</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن مکتب جدید</DialogTitle>
              <DialogDescription>مکتب جدید در ولسوالی {profile?.district} ثبت شود</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام مکتب *</Label>
                <Input id="name" value={newSchool.name} onChange={e => setNewSchool({ ...newSchool, name: e.target.value })} required />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">کد مکتب</Label>
                  <Input id="code" value={newSchool.code} onChange={e => setNewSchool({ ...newSchool, code: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input id="phone" value={newSchool.contact_phone} onChange={e => setNewSchool({ ...newSchool, contact_phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل تماس</Label>
                <Input id="email" type="email" value={newSchool.contact_email} onChange={e => setNewSchool({ ...newSchool, contact_email: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={addSchoolMutation.isPending}>
                {addSchoolMutation.isPending ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />درحال افزودن...</> : 'افزودن مکتب'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={schools ?? []}
        loading={isLoading}
        searchPlaceholder="جستجوی مکاتب..."
        searchableKeys={['name', 'code']}
        exportFilename="schools"
      />
    </div>
  );
}
