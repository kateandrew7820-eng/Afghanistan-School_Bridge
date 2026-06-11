import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/sanitizeError';
import { useAuth } from '@/contexts/AuthContext';

type SubmissionTable = 'statistics_submissions' | 'report_submissions' | 'form_submissions';
type ReviewStage = 'school' | 'district' | 'province' | 'ministry' | 'completed';

const NEXT_STAGE: Record<ReviewStage, ReviewStage> = {
  school: 'district',
  district: 'province',
  province: 'ministry',
  ministry: 'completed',
  completed: 'completed',
};

const ROLE_STAGE: Record<string, ReviewStage> = {
  principal: 'district',
  district_admin: 'district',
  province_admin: 'province',
  ministry_admin: 'ministry',
  admin: 'ministry',
};

export function useSubmissionActions() {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { role, user } = useAuth();

  const performAction = useCallback(async (
    id: string,
    table: string,
    action: 'approve' | 'reject',
    reason?: string,
  ): Promise<boolean> => {
    setIsUpdating(true);
    try {
      // Fetch current stage
      const { data: current, error: fetchErr } = await supabase
        .from(table as SubmissionTable)
        .select('current_stage, status')
        .eq('id', id)
        .single();
      if (fetchErr) {
        toast({ title: 'خطا', description: sanitizeError(fetchErr), variant: 'destructive' });
        return false;
      }

      const fromStage = (current?.current_stage as ReviewStage) ?? 'district';
      const updateData: Record<string, any> = {};
      let toStage: ReviewStage = fromStage;

      if (action === 'approve') {
        toStage = NEXT_STAGE[fromStage];
        updateData.current_stage = toStage;
        // Final approval: ministry → completed
        if (toStage === 'completed') {
          updateData.status = 'approved';
        }
      } else {
        updateData.status = 'rejected';
        if (reason) updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from(table as SubmissionTable)
        .update(updateData)
        .eq('id', id);

      if (error) {
        toast({ title: 'خطا', description: sanitizeError(error), variant: 'destructive' });
        return false;
      }

      // Log event (best-effort)
      try {
        await supabase.from('submission_events').insert({
          submission_id: id,
          submission_table: table,
          actor_user_id: user?.id ?? null,
          actor_role: role ?? null,
          action,
          from_stage: fromStage,
          to_stage: toStage,
          note: reason ?? null,
        } as any);
      } catch { /* non-fatal */ }

      const successMsg =
        action === 'approve'
          ? toStage === 'completed'
            ? 'ارسال نهایی تأیید شد'
            : 'به مرحله بعدی ارجاع شد'
          : 'ارسال رد شد';
      toast({ title: 'موفقیت', description: successMsg });

      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      return true;
    } catch {
      toast({ title: 'خطا', description: 'عملیات ناموفق بود', variant: 'destructive' });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [queryClient, toast, role, user?.id]);

  const approve = useCallback((id: string, table: string) => performAction(id, table, 'approve'), [performAction]);
  const reject = useCallback((id: string, table: string, reason?: string) => performAction(id, table, 'reject', reason), [performAction]);

  /** Stage this role is responsible for, or null. */
  const actorStage: ReviewStage | null = role ? ROLE_STAGE[role] ?? null : null;

  return { approve, reject, isUpdating, actorStage };
}
