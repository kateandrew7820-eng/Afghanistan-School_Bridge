import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useSubmissionActions } from '@/hooks/useSubmissionActions';
import { SubmissionList } from '@/components/SubmissionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BarChart3, Filter } from 'lucide-react';

export default function DistrictSubmissions() {
  const { profile } = useAuth();
  const { data, loading } = useSubmissions({ district: profile?.district });
  const { approve, reject, isUpdating } = useSubmissionActions();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = (data?.submissions ?? []).filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          ارسال‌های مکاتب
        </h1>
        <p className="text-muted-foreground">تمام ارسال‌های مکاتب ولسوالی {profile?.district}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="approved">تأیید شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="نوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه انواع</SelectItem>
            <SelectItem value="statistics">آمار</SelectItem>
            <SelectItem value="report">گزارش</SelectItem>
            <SelectItem value="form">فورم</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 mr-auto">
          <Badge variant="secondary">{filtered.length} ارسال</Badge>
        </div>
      </div>

      <SubmissionList
        title={`ارسال‌ها (${filtered.length})`}
        submissions={filtered}
        loading={loading}
        emptyMessage="هیچ ارسالی با فیلترهای انتخاب شده یافت نشد"
        showActions={true}
        onApprove={approve}
        onReject={reject}
        actionLoading={isUpdating}
      />
    </div>
  );
}
