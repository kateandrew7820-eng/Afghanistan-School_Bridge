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
  const { showErrorMessage, showSuccess } = useErrorToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const submitStatistics = useCallback(async (data: any): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      if (Math.random() > 0.1) {
        const submissionId = `STAT-${Date.now()}`;
        showSuccess('آمار مکتب با موفقیت ارسال شد', 'موفقیت');
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
      showErrorMessage('خطایی در ارسال آمار رخ داد. دوباره تلاش کنید.', 'خطا');
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorMessage, showSuccess]);

  const submitReport = useCallback(async (data: any, file: File): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      const delay = Math.random() * 2000 + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      if (Math.random() > 0.1) {
        const submissionId = `REP-${Date.now()}`;
        showSuccess('گزارش با موفقیت ارسال شد', 'موفقیت');
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
      showErrorMessage('خطایی در ارسال گزارش رخ داد. دوباره تلاش کنید.', 'خطا');
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorMessage, showSuccess]);

  const submitForm = useCallback(async (data: any): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      if (Math.random() > 0.1) {
        const submissionId = `FORM-${Date.now()}`;
        showSuccess('فورم با موفقیت ارسال شد', 'موفقیت');
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
      showErrorMessage('خطایی در ارسال فورم رخ داد. دوباره تلاش کنید.', 'خطا');
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorMessage, showSuccess]);

  const approveSubmission = useCallback(async (submissionId: string): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));

      if (Math.random() > 0.1) {
        showSuccess('ارسال با موفقیت تصویب شد', 'موفقیت');
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
      showErrorMessage('خطایی در تصویب رخ داد. دوباره تلاش کنید.', 'خطا');
      return { success: false, message: 'Error approving submission' };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorMessage, showSuccess]);

  const rejectSubmission = useCallback(async (submissionId: string, reason: string): Promise<SubmissionResult> => {
    if (!isDemoMode) return { success: false, message: 'Not in demo mode' };

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));

      if (Math.random() > 0.1) {
        showSuccess('ارسال رد شد', 'موفقیت');
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
      showErrorMessage('خطایی در رد کردن رخ داد. دوباره تلاش کنید.', 'خطا');
      return { success: false, message: 'Error rejecting submission' };
    } finally {
      setIsProcessing(false);
    }
  }, [isDemoMode, showErrorMessage, showSuccess]);

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
