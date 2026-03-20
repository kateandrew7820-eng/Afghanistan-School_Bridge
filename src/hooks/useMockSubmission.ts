/**
 * Mock submission handler for demo/dev mode
 * Allows testing all submission flows without database
 */

import { useAuth } from '@/contexts/AuthContext';
import { useErrorToast } from '@/lib/errorToast';
import { useState, useCallback } from 'react';

export interface SubmissionResult {
  success: boolean;
  message: string;
  submissionId?: string;
  timestamp?: string;
}

export function useMockSubmission() {
  const { isDemoMode } = useAuth();
  const { showErrorToast, showSuccessToast } = useErrorToast();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Simulate form submission with realistic delay
   */
  const submitStatistics = useCallback(async (data: any): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      // Simulate network delay (500-1500ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      // Randomly succeed (90% success rate for better testing)
      if (Math.random() > 0.1) {
        const submissionId = `STAT-${Date.now()}`;
        showSuccessToast('موفقیت', 'آمار مکتب با موفقیت ارسال شد');
        return {
          success: true,
          message: 'Statistics submitted successfully',
          submissionId,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('Simulated submission error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطایی نامعلوم رخ داد';
      showErrorToast('خطا', 'خطایی در ارسال آمار رخ داد. دوباره تلاش کنید.');
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorToast, showSuccessToast]);

  /**
   * Simulate report submission with file handling
   */
  const submitReport = useCallback(async (data: any, file: File): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      // Simulate file processing delay (1-3 seconds)
      const delay = Math.random() * 2000 + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Randomly succeed (90% success rate)
      if (Math.random() > 0.1) {
        const submissionId = `REP-${Date.now()}`;
        showSuccessToast('موفقیت', 'گزارش با موفقیت ارسال شد');
        return {
          success: true,
          message: 'Report submitted successfully',
          submissionId,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('Simulated submission error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطایی نامعلوم رخ داد';
      showErrorToast('خطا', 'خطایی در ارسال گزارش رخ داد. دوباره تلاش کنید.');
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorToast, showSuccessToast]);

  /**
   * Simulate form submission (generic)
   */
  const submitForm = useCallback(async (data: any): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      // Randomly succeed (90% success rate)
      if (Math.random() > 0.1) {
        const submissionId = `FORM-${Date.now()}`;
        showSuccessToast('موفقیت', 'فرم با موفقیت ارسال شد');
        return {
          success: true,
          message: 'Form submitted successfully',
          submissionId,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('Simulated submission error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطایی نامعلوم رخ داد';
      showErrorToast('خطا', 'خطایی در ارسال فرم رخ داد. دوباره تلاش کنید.');
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorToast, showSuccessToast]);

  /**
   * Simulate approval action
   */
  const approveSubmission = useCallback(async (submissionId: string): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));

      if (Math.random() > 0.1) {
        showSuccessToast('موفقیت', 'ارسال با موفقیت تصویب شد');
        return {
          success: true,
          message: 'Submission approved successfully',
          submissionId,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('Simulated approval error');
      }
    } catch (error) {
      showErrorToast('خطا', 'خطایی در تصویب رخ داد. دوباره تلاش کنید.');
      return { success: false, message: 'Error approving submission' };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorToast, showSuccessToast]);

  /**
   * Simulate rejection action
   */
  const rejectSubmission = useCallback(async (submissionId: string, reason: string): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));

      if (Math.random() > 0.1) {
        showSuccessToast('موفقیت', 'ارسال reddکل شد');
        return {
          success: true,
          message: 'Submission rejected successfully',
          submissionId,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('Simulated rejection error');
      }
    } catch (error) {
      showErrorToast('خطا', 'خطایی در رد کردن رخ داد. دوباره تلاش کنید.');
      return { success: false, message: 'Error rejecting submission' };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorToast, showSuccessToast]);

  return {
    isDemoMode,
    isProcessing,
    submitStatistics,
    submitReport,
    submitForm,
    approveSubmission,
    rejectSubmission,
  };
}
