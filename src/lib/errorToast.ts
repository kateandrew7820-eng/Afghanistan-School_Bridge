/**
 * Error Toast Notification Utilities
 * 
 * Integrates the error system with toast notifications for user feedback
 */

import { useToast } from '@/hooks/use-toast';
import { AppError, ErrorType, VALIDATION_ERRORS_FA, ERROR_MESSAGES_FA } from '@/lib/errors';

export interface ErrorToastOptions {
  /** Show as destructive variant (red) */
  variant?: 'default' | 'destructive';
  /** Duration in ms (0 = no auto-close) */
  duration?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * Hook for showing error toasts with Persian messages
 */
export function useErrorToast() {
  const { toast } = useToast();

  const showError = (error: AppError, options: ErrorToastOptions = {}) => {
    const {
      variant = 'destructive',
      duration = 5000,
      className,
    } = options;

    toast({
      title: ERROR_MESSAGES_FA[error.type as unknown as ErrorType]?.title || 'خطا',
      description: error.messageFa || error.message,
      variant,
      duration,
      className,
    });
  };

  const showErrorMessage = (message: string, title: string = 'خطا', options: ErrorToastOptions = {}) => {
    const {
      variant = 'destructive',
      duration = 5000,
      className,
    } = options;

    toast({
      title,
      description: message,
      variant,
      duration,
      className,
    });
  };

  const showValidationError = (message: string, field?: string) => {
    toast({
      title: 'خطای اعتبارسنجی',
      description: message,
      variant: 'destructive',
      duration: 4000,
    });
  };

  const showSuccess = (message: string, title: string = 'موفق') => {
    toast({
      title,
      description: message,
      variant: 'default',
      duration: 3000,
    });
  };

  const showInfo = (message: string, title: string = 'اطلاعات') => {
    toast({
      title,
      description: message,
      variant: 'default',
      duration: 4000,
    });
  };

  return {
    showError,
    showErrorMessage,
    showValidationError,
    showSuccess,
    showInfo,
  };
}

/**
 * Show error from AppError object
 */
export function showErrorToast(toast: any, error: AppError, autoClose: boolean = true) {
  toast({
    title: ERROR_MESSAGES_FA[error.type as unknown as ErrorType]?.title || 'خطا',
    description: error.messageFa,
    variant: 'destructive',
    duration: autoClose ? 5000 : 0,
  });
}

/**
 * Show validation error toast
 */
export function showValidationToast(toast: any, field: string, message: string) {
  toast({
    title: 'خطا در فیلد: ' + field,
    description: message,
    variant: 'destructive',
    duration: 4000,
  });
}

/**
 * Show success toast with Persian message
 */
export function showSuccessToast(toast: any, message: string, title: string = 'موفق') {
  toast({
    title,
    description: message,
    variant: 'default',
    duration: 3000,
  });
}

/**
 * Show info toast with Persian message
 */
export function showInfoToast(toast: any, message: string, title: string = 'اطلاعات') {
  toast({
    title,
    description: message,
    variant: 'default',
    duration: 4000,
  });
}

/**
 * Map validation error code to Persian message
 */
export function getValidationErrorMessageFa(errorCode: string, field?: string): string {
  // Check if it's in the validation errors dictionary
  if (VALIDATION_ERRORS_FA[errorCode]) {
    return VALIDATION_ERRORS_FA[errorCode];
  }

  // Custom messages
  const customMessages: Record<string, string> = {
    'required': `${field || 'این فیلد'} الزامی است`,
    'email_invalid': 'ایمیل معتبر وارد کنید',
    'email_required': 'ایمیل الزامی است',
    'phone_invalid': 'شماره تلفن نامعتبر است',
    'phone_invalid_afghanistan': 'لطفاً شماره تلفن افغان معتبر وارد کنید',
    'phone_required': 'شماره تلفن الزامی است',
    'password_weak': 'رمز عبور متوسط یا قوی انتخاب کنید',
    'file_required': 'فایل انتخاب کنید',
    'file_too_large': 'حجم فایل خیلی بزرگ است',
  };

  return customMessages[errorCode] || 'خطایی در اعتبارسنجی رخ داده است';
}

export default {
  useErrorToast,
  showErrorToast,
  showValidationToast,
  showSuccessToast,
  showInfoToast,
  getValidationErrorMessageFa,
};
