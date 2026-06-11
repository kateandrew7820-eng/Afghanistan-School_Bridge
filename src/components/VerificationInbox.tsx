import { ReactNode, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useSubmissionActions } from '@/hooks/useSubmissionActions';
import { SubmissionList } from '@/components/SubmissionList';
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Inbox, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';

export interface VerificationInboxScope {
  province?: string | null;
  district?: string | null;
}

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  scope: VerificationInboxScope;
  /** Whether the current role can approve/reject from this view. */
  canAct?: boolean;
}

/**
 * Shared verification inbox used by District, Province and Ministry roles.
 * Filters persist in the URL (?status, ?type, ?q) so back/forward and shareable
 * links work consistently.
 */
export function VerificationInbox({ title, subtitle, icon, scope, canAct = true }: Props) {
  const { data, loading } = useSubmissions(scope);
  const { approve, reject, isUpdating, actorStage } = useSubmissionActions();

  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'pending';
  const type = params.get('type') ?? 'all';
  const q = params.get('q') ?? '';

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (!value || value === 'all') p.delete(key);
    else p.set(key, value);
    setParams(p, { replace: true });
  };

  const filtered = useMemo(() => {
    const list = data?.submissions ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter((s: any) => {
      if (status !== 'all' && s.status !== status) return false;
      // Only show pending items at THIS role's stage so the approval chain works.
      if (status === 'pending' && actorStage && s.current_stage !== actorStage) return false;
      if (type !== 'all' && s.type !== type) return false;
      if (needle) {
        const hay = `${s.title ?? ''} ${s.school_name ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data, status, type, q, actorStage]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon ?? <Inbox className="h-5 w-5" />}
        </div>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <DashboardStatCard title="در انتظار" value={data?.stats.pending ?? 0} icon={<Clock className="h-4 w-4" />} loading={loading} />
        <DashboardStatCard title="تأیید شده" value={data?.stats.approved ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} loading={loading} />
        <DashboardStatCard title="رد شده" value={data?.stats.rejected ?? 0} icon={<XCircle className="h-4 w-4" />} loading={loading} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="وضعیت" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="approved">تأیید شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => update('type', v)}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="نوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه انواع</SelectItem>
            <SelectItem value="statistics">آمار</SelectItem>
            <SelectItem value="report">گزارش</SelectItem>
            <SelectItem value="form">فورم</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute top-1/2 right-2.5 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => update('q', e.target.value)}
            placeholder="جستجو در عنوان یا مکتب…"
            className="h-9 pe-8"
          />
        </div>
        <Badge variant="secondary" className="ms-auto">{filtered.length} ارسال</Badge>
      </div>

      <SubmissionList
        title={status === 'pending' ? `در انتظار تأیید (${filtered.length})` : `ارسال‌ها (${filtered.length})`}
        submissions={filtered}
        loading={loading}
        emptyMessage={status === 'pending' ? 'هیچ ارسال در انتظار تأیید وجود ندارد 🎉' : 'هیچ ارسالی با فیلترهای انتخاب شده یافت نشد'}
        showActions={canAct}
        onApprove={canAct ? approve : undefined}
        onReject={canAct ? reject : undefined}
        actionLoading={isUpdating}
      />
    </div>
  );
}
