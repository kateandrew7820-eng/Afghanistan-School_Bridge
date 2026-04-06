import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import sanitizeError from '@/lib/sanitizeError';
import { School, Phone, Mail, Plus, Loader2, Search } from 'lucide-react';

export default function DistrictSchools() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '', code: '', contact_email: '', contact_phone: ''
  });

  const { data: schools, isLoading } = useQuery({
    queryKey: ['district-schools', profile?.district],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('district', profile?.district ?? '')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.district,
  });

  const addSchoolMutation = useMutation({
    mutationFn: async (school: typeof newSchool) => {
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
      toast({ title: 'خطا در افزودن مکتب', description: sanitizeErrorMessage(error?.message), variant: 'destructive' });
    },
  });

  const filteredSchools = (schools ?? []).filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <Input id="name" value={newSchool.name} onChange={e => setNewSchool({ ...newSchool, name: e.target.value })} placeholder="لیسه ذکور..." required />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">کد مکتب</Label>
                  <Input id="code" value={newSchool.code} onChange={e => setNewSchool({ ...newSchool, code: e.target.value })} placeholder="DAY-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input id="phone" value={newSchool.contact_phone} onChange={e => setNewSchool({ ...newSchool, contact_phone: e.target.value })} placeholder="0700000000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل تماس</Label>
                <Input id="email" type="email" value={newSchool.contact_email} onChange={e => setNewSchool({ ...newSchool, contact_email: e.target.value })} placeholder="school@example.com" />
              </div>
              <Button type="submit" className="w-full" disabled={addSchoolMutation.isPending}>
                {addSchoolMutation.isPending ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />درحال افزودن...</> : 'افزودن مکتب'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="جستجوی مکاتب..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !filteredSchools.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'مکتبی با این جستجو یافت نشد' : 'هیچ مکتبی در این ولسوالی ثبت نشده است'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map(school => (
            <Card key={school.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{school.name}</span>
                  <div className="flex items-center gap-1.5">
                    {school.code && <Badge variant="outline" className="text-xs">{school.code}</Badge>}
                    <Badge variant={school.is_active ? 'default' : 'secondary'} className="text-xs">
                      {school.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                {school.contact_phone && (
                  <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /><span dir="ltr">{school.contact_phone}</span></div>
                )}
                {school.contact_email && (
                  <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /><span>{school.contact_email}</span></div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
