import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_CONFIG, TYPE_LABELS } from '@/lib/statusConfig';
import type { Submission } from '@/hooks/useSubmissions';
import { format } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface SubmissionListProps {
  title: string;
  submissions: Submission[];
  loading: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  onApprove?: (id: string, type: string) => void;
  onReject?: (id: string, type: string, reason?: string) => void;
  actionLoading?: boolean;
}

export function SubmissionList({
  title,
  submissions,
  loading,
  emptyMessage = 'هنوز ارسالی وجود ندارد',
  showActions = false,
  onApprove,
  onReject,
  actionLoading = false,
}: SubmissionListProps) {
  const tableMap: Record<string, string> = {
    statistics: 'statistics_submissions',
    report: 'report_submissions',
    form: 'form_submissions',
  };

  const [confirmAction, setConfirmAction] = useState<{ id: string; type: string; action: 'approve' | 'reject' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.action === 'approve') {
      onApprove?.(confirmAction.id, tableMap[confirmAction.type]);
    } else {
      onReject?.(confirmAction.id, tableMap[confirmAction.type], rejectReason || undefined);
    }
    setConfirmAction(null);
    setRejectReason('');
  };

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">{emptyMessage}</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-3 rounded-xl border hover:bg-muted/50 transition">
                  <div>
                    <p className="text-sm font-medium">{TYPE_LABELS[s.type] ?? s.type}</p>
                    <p className="text-xs text-muted-foreground">{s.district ?? s.province ?? ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${STATUS_CONFIG[s.status].className}`}>
                      {STATUS_CONFIG[s.status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), 'd MMM')}
                    </span>
                    {showActions && s.status === 'pending' && (
                      <div className="flex gap-1 mr-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-success hover:text-success hover:bg-success/10"
                          disabled={actionLoading}
                          onClick={() => setConfirmAction({ id: s.id, type: s.type, action: 'approve' })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          disabled={actionLoading}
                          onClick={() => setConfirmAction({ id: s.id, type: s.type, action: 'reject' })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) { setConfirmAction(null); setRejectReason(''); } }}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === 'approve' ? 'تأیید ارسال' : 'رد ارسال'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === 'approve'
                ? 'آیا مطمئن هستید که می‌خواهید این ارسال را تأیید کنید؟'
                : 'آیا مطمئن هستید که می‌خواهید این ارسال را رد کنید؟'}
            </DialogDescription>
          </DialogHeader>
          {confirmAction?.action === 'reject' && (
            <Textarea
              placeholder="دلیل رد (اختیاری)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmAction(null); setRejectReason(''); }}>
              انصراف
            </Button>
            <Button
              variant={confirmAction?.action === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirm}
              disabled={actionLoading}
            >
              {confirmAction?.action === 'approve' ? 'تأیید' : 'رد کردن'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
