import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface SubmissionStatusCardProps {
  id: string;
  schoolName: string;
  submissionType: 'statistics' | 'reports' | 'forms' | 'approval';
  status: 'pending' | 'approved' | 'rejected';
  title?: string;
  createdAt: string;
  rejectionReason?: string | null;
  onView?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
}

export const SubmissionStatusCard: React.FC<SubmissionStatusCardProps> = ({
  id,
  schoolName,
  submissionType,
  status,
  title,
  createdAt,
  rejectionReason,
  onView,
  onApprove,
  onReject,
  isLoading = false,
  showActions = false,
}) => {
  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusBadgeVariant = (s: string) => {
    switch (s) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'approved':
        return 'تایید شده';
      case 'rejected':
        return 'رد شده';
      case 'pending':
        return 'در انتظار بررسی';
      default:
        return s;
    }
  };

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'statistics':
        return 'آمار';
      case 'reports':
        return 'گزارش';
      case 'forms':
        return 'فورم';
      case 'approval':
        return 'تأیید';
      default:
        return t;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="truncate">{schoolName}</span>
              {title && <span className="text-muted-foreground text-sm">— {title}</span>}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {getTypeLabel(submissionType)}
              </Badge>
              <Badge className={`text-xs ${getStatusBadgeVariant(status)}`}>
                {getStatusLabel(status)}
              </Badge>
            </div>
          </div>
          {getStatusIcon(status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Submission Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>تاریخ ارسال:</span>
          <span dir="ltr">{format(new Date(createdAt), 'dd MMMM yyyy - HH:mm', { locale: faIR })}</span>
        </div>

        {/* Rejection Reason */}
        {status === 'rejected' && rejectionReason && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs font-medium text-red-900 mb-1">دلیل رد:</p>
            <p className="text-sm text-red-800">{rejectionReason}</p>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                disabled={isLoading}
                className="flex-1"
              >
                <Eye className="h-4 w-4 ml-2" />
                مشاهده
              </Button>
            )}
            {status === 'pending' && (
              <>
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={onApprove}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'در حال...' : 'تایید'}
                  </Button>
                )}
                {onReject && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReject}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'در حال...' : 'رد'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
