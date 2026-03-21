import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileCompletionData {
  fullName: string;
  email: string;
  school: string;
  district: string;
  province: string;
  [key: string]: string; // Additional question answers
}

interface ProfileCompletionState {
  isCompleted: boolean;
  data?: ProfileCompletionData;
  completedAt?: string;
}

export function useProfileCompletion() {
  const { profile } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load completion status from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('profileCompletion');
      if (saved) {
        const data = JSON.parse(saved);
        setIsCompleted(data.isCompleted);
      }
    } catch (err) {
      console.error('Error loading profile completion status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAnswers = async (data: ProfileCompletionData) => {
    try {
      setLoading(true);

      // Prepare completion data with identity and answers
      const completionData: ProfileCompletionState = {
        isCompleted: true,
        data: {
          fullName: data.fullName,
          email: data.email,
          school: data.school,
          district: data.district,
          province: data.province,
          // Additional question answers
          ...Object.fromEntries(
            Object.entries(data).filter(
              ([key]) => !['fullName', 'email', 'school', 'district', 'province'].includes(key)
            )
          ),
        },
        completedAt: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem('profileCompletion', JSON.stringify(completionData));
      localStorage.setItem('profileCompletionData', JSON.stringify(completionData.data));
      setIsCompleted(true);

      return { data: completionData, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save profile completion');
      console.error('Error in saveAnswers:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const skipForNow = async () => {
    try {
      setLoading(true);

      // Mark as shown so modal doesn't appear again immediately
      localStorage.setItem('profileCompletionShown', JSON.stringify({
        shown: true,
        skippedAt: new Date().toISOString(),
      }));

      return { data: { skipped: true }, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to skip profile completion');
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    isCompleted,
    loading,
    saveAnswers,
    skipForNow,
  };
}
