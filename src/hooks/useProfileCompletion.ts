import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileCompletionData {
  user_id: string;
  is_profile_completed: boolean;
  answers: Record<string, string>;
  completed_at: string | null;
  needs_approval: boolean;
}

export function useProfileCompletion() {
  const { user } = useAuth();
  const [completionData, setCompletionData] = useState<ProfileCompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load profile completion status
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadCompletionStatus = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('is_profile_completed, profile_answers')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        setCompletionData({
          user_id: user.id,
          is_profile_completed: data?.is_profile_completed || false,
          answers: data?.profile_answers || {},
          completed_at: data?.profile_completed_at || null,
          needs_approval: true,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load profile completion status');
        setError(error);
        console.error('Profile completion load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompletionStatus();
  }, [user]);

  // Save profile answers
  const saveAnswers = async (answers: Record<string, string>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_profile_completed: true,
          profile_answers: answers,
          profile_completed_at: new Date().toISOString(),
          status: 'pending_verification', // User still needs admin approval
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setCompletionData(prev => 
        prev ? {
          ...prev,
          is_profile_completed: true,
          answers,
          completed_at: new Date().toISOString(),
        } : null
      );

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save answers');
      setError(error);
      return { error };
    }
  };

  // Mark as skipped (user can edit later)
  const skipForNow = async () => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      // Just mark that user skipped, don't mark as completed
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_completion_skipped: true,
          profile_skipped_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to skip profile completion');
      setError(error);
      return { error };
    }
  };

  return {
    completionData,
    loading,
    error,
    saveAnswers,
    skipForNow,
    isCompleted: completionData?.is_profile_completed || false,
  };
}
