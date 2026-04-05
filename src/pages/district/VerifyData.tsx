import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useSubmissionActions } from '@/hooks/useSubmissionActions';
import { SubmissionList } from '@/components/SubmissionList';
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { CheckSquare, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyData() {
  const { profile } = useAuth();
  const { data, loading } = useSubmissions({ district: profile?.district });
  const { approve, reject, isUpdating } = useSubmissionActions();

  const pending = (data?.submissions ?? []).filter(s => s.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare className="h-6 w-6" />
          تأیید داده‌ها
        </h1>
        <p className="text-muted-foreground">ارسال‌های در انتظار تأیید را بررسی و تأیید/رد کنید</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard title="در انتظار" value={data?.stats.pending ?? 0} icon={Clock} />
        <DashboardStatCard title="تأیید شده" value={data?.stats.approved ?? 0} icon={CheckCircle2} />
        <DashboardStatCard title="رد شده" value={data?.stats.rejected ?? 0} icon={XCircle} />
      </div>

      <SubmissionList
        title={`ارسال‌های در انتظار تأیید (${pending.length})`}
        submissions={pending}
        loading={loading}
        emptyMessage="هیچ ارسال در انتظار تأیید وجود ندارد 🎉"
        showActions={true}
        onApprove={approve}
        onReject={reject}
        actionLoading={isUpdating}
      />
    </div>
  );
}
