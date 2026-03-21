import { useState, useEffect } from 'react';

export interface ProfileCompletionData {
  isCompleted: boolean;
  answers: Record<string, string>;
}

export function useProfileCompletion() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('profileCompletion');
      if (saved) {
        const data = JSON.parse(saved);
        setIsCompleted(data.isCompleted || false);
      }
    } catch (err) {
      console.error('Failed to load profile completion status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save answers to localStorage
  const saveAnswers = async (answers: Record<string, string>) => {
    try {
      const completionData: ProfileCompletionData = {
        isCompleted: true,
        answers,
      };
      localStorage.setItem('profileCompletion', JSON.stringify(completionData));
      setIsCompleted(true);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save answers');
      console.error('Profile completion save error:', error);
      return { error };
    }
  };

  // Mark as skipped
  const skipForNow = async () => {
    try {
      localStorage.setItem('profileCompletionSkipped', 'true');
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to skip profile completion');
      console.error('Skip profile completion error:', error);
      return { error };
    }
  };

  return {
    isCompleted,
    loading,
    saveAnswers,
    skipForNow,
  };
}
