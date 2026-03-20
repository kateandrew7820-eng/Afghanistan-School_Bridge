import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useErrorToast } from '@/lib/errorToast';
import { useToast } from '@/hooks/use-toast';
import { useAPIError } from './useAPIError';

interface ApprovalAction {
  submissionId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  table: 'statistics_submissions' | 'report_submissions' | 'form_submissions';
}

export function useSubmissionApproval() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { showErrorMessage, showSuccess } = useErrorToast();
  const { toast } = useToast();

  const approveSubmission = useCallback(
    async (action: ApprovalAction): Promise<boolean> => {
      try {
        setIsUpdating(true);

        const updateData: Record<string, any> = {
          status: action.status === 'approved' ? 'approved' : 'rejected',
        };

        if (action.status === 'rejected' && action.rejectionReason) {
          updateData.rejection_reason = action.rejectionReason;
        }

        const { error } = await supabase
          .from(action.table)
          .update(updateData)
          .eq('id', action.submissionId);

        if (error) {
          showErrorMessage(
            `خطا در ${action.status === 'approved' ? 'تایید' : 'رد'} ارسال`,
            'خطا'
          );
          return false;
        }

        const message =
          action.status === 'approved'
            ? 'ارسال با موفقیت تأیید شد'
            : 'ارسال با موفقیت رد شد';

        showSuccess(message, 'موفقیت');
        return true;
      } catch (error) {
        console.error('Approval error:', error);
        showErrorMessage('خطایی در انجام عملیات رخ داد', 'خطا');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [showErrorMessage, showSuccess]
  );

  const bulkApproveSubmissions = useCallback(
    async (submissions: ApprovalAction[]): Promise<number> => {
      let successCount = 0;

      for (const submission of submissions) {
        const success = await approveSubmission(submission);
        if (success) successCount++;
      }

      return successCount;
    },
    [approveSubmission]
  );

  return {
    approveSubmission,
    bulkApproveSubmissions,
    isUpdating,
  };
}
