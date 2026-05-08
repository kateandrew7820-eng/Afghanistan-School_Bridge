import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/sanitizeError';
import { Users, CheckCircle2, XCircle, Clock, Shield, Search } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  student: 'شاگرد',
  teacher: 'معلم',
  principal: 'مدیر مکتب',
  district_admin: 'رئیس معارف ولسوالی',
  province_admin: 'رئیس معارف ولایت',
  ministry_admin: 'وزارت معارف',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending_verification: { label: 'در انتظار', className: 'bg-amber-100 text-amber-800' },
  verified: { label: 'تأیید شده', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'رد شده', className: 'bg-red-100 text-red-800' },
};

export default function MinistryUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['ministry-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (profiles ?? []).filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${p.full_name ?? ''} ${p.school_name ?? ''} ${p.district ?? ''} ${p.province ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase.rpc('admin_update_profile_status', {
        _target_user_id: userId,
        _status: newStatus,
      });
      if (error) throw error;
      toast({ title: 'موفقیت', description: `وضعیت کاربر به‌روزرسانی شد` });
      queryClient.invalidateQueries({ queryKey: ['ministry-profiles'] });
    } catch (err) {
      toast({ title: 'خطا', description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          مدیریت کاربران
        </h1>
        <p className="text-muted-foreground">تمام حساب‌های کاربری سیستم</p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فیلتر وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending_verification">در انتظار تأیید</SelectItem>
            <SelectItem value="verified">تأیید شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} کاربر</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(profile => {
            const statusInfo = STATUS_LABELS[profile.status ?? ''] ?? STATUS_LABELS.pending_verification;
            return (
              <Card key={profile.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{profile.full_name || 'بدون نام'}</span>
                      <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                      <span>{ROLE_LABELS[profile.role ?? ''] ?? profile.role}</span>
                      {profile.school_name && <span>• {profile.school_name}</span>}
                      {profile.district && <span>• {profile.district}</span>}
                      {profile.province && <span>• {profile.province}</span>}
                    </div>
                  </div>
                  {profile.status === 'pending_verification' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        disabled={updatingId === profile.user_id}
                        onClick={() => handleStatusChange(profile.user_id, 'verified')}
                      >
                        <CheckCircle2 className="h-4 w-4 ml-1" />
                        تأیید
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/20 hover:bg-destructive/5"
                        disabled={updatingId === profile.user_id}
                        onClick={() => handleStatusChange(profile.user_id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        رد
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">هیچ کاربری با فیلتر انتخاب شده یافت نشد</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
