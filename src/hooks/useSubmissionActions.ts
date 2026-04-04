import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type SubmissionTable = 'statistics_submissions' | 'report_submissions' | 'form_submissions';

export function useSubmissionActions() {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStatus = useCallback(async (
    id: string,
    table: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const updateData: Record<string, string> = { status };
      if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from(table as SubmissionTable)
        .update(updateData)
        .eq('id', id);

      if (error) {
        toast({ title: 'خطا', description: error.message, variant: 'destructive' });
        return false;
      }

      toast({
        title: 'موفقیت',
        description: status === 'approved' ? 'ارسال تأیید شد' : 'ارسال رد شد',
      });

      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      return true;
    } catch {
      toast({ title: 'خطا', description: 'عملیات ناموفق بود', variant: 'destructive' });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [queryClient, toast]);

  const approve = useCallback((id: string, table: string) => updateStatus(id, table, 'approved'), [updateStatus]);
  const reject = useCallback((id: string, table: string, reason?: string) => updateStatus(id, table, 'rejected', reason), [updateStatus]);

  return { approve, reject, isUpdating };
}
