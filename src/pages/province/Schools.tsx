import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import sanitizeError from '@/lib/sanitizeError';
import { EmptyState } from '@/components/EmptyState';
import { School, Search, CheckCircle2, XCircle } from 'lucide-react';

export default function ProvinceSchools() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState('');

  const { data: schools, isLoading } = useQuery({
    queryKey: ['province-schools', profile?.province],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('province', profile?.province ?? '')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.province,
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('schools').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['province-schools'] });
      toast({ title: 'به‌روزرسانی شد' });
    },
    onError: (e: any) => toast({ title: 'خطا', description: sanitizeError(e?.message), variant: 'destructive' }),
  });

  const filtered = (schools ?? []).filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) || s.district?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><School className="h-6 w-6" />مکاتب ولایت</h1>
        <p className="text-muted-foreground">بازبینی و تأیید مکاتب ثبت‌شده توسط ولسوالی‌ها</p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="جستجو نام مکتب یا ولسوالی..." value={q} onChange={e => setQ(e.target.value)} className="pr-10" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState icon={School} title="هیچ مکتبی یافت نشد"
          description="پس از ثبت مکاتب توسط ریاست‌های ولسوالی اینجا نمایش داده می‌شود." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{s.name}</span>
                  <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs">
                    {s.is_active ? 'تأیید شده' : 'غیرفعال'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div>{s.district}</div>
                <div className="flex gap-2">
                  {s.is_active ? (
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/20"
                      onClick={() => toggle.mutate({ id: s.id, active: false })}>
                      <XCircle className="h-3.5 w-3.5 ml-1" />غیرفعال‌سازی
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-success border-success/20"
                      onClick={() => toggle.mutate({ id: s.id, active: true })}>
                      <CheckCircle2 className="h-3.5 w-3.5 ml-1" />تأیید
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
