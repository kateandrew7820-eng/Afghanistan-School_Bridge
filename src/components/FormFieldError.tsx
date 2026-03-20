/**
 * Smart Form Error Component
 * 
 * Displays form validation errors with Persian localization
 * Can be used as inline errors or summary
 */

import React from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SmartFormErrorProps {
  /** Error message to display */
  error?: string | null;
  /** Field name for context (used in summary mode) */
  fieldName?: string;
  /** Display style: 'inline' for inline errors, 'summary' for top of form */
  style?: 'inline' | 'summary';
  /** Show success state instead of error */
  success?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Show icon */
  showIcon?: boolean;
}

/**
 * Inline error component (shown next to field)
 */
export const FormFieldError: React.FC<SmartFormErrorProps> = ({
  error,
  style = 'inline',
  success,
  className,
  showIcon = true,
}) => {
  if (!error && !success) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm transition-all duration-200',
        success
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
        style === 'summary' && 'mb-2',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        success ? (
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 flex-shrink-0" />
        )
      )}
      <span>{error || 'درست'}</span>
    </div>
  );
};

/**
 * Error summary component (shown at top of form)
 */
export interface ErrorSummaryProps {
  /** Dictionary of field names and error messages */
  errors: Record<string, string>;
  /** CSS class for container */
  className?: string;
  /** Callback when error is dismissed */
  onDismiss?: () => void;
}

export const FormErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  className,
  onDismiss,
}) => {
  const errorCount = Object.keys(errors).length;

  if (errorCount === 0) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
            {errorCount} خطا در فورم
          </h3>
          <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
            {Object.entries(errors).map(([fieldName, error]) => (
              <li key={fieldName} className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 font-medium">•</span>
                <div>
                  <span className="font-medium capitalize">{fieldName}: </span>
                  <span>{error}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            aria-label="بستن"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Field wrapper with error display
 */
export interface FormFieldWrapperProps {
  /** Field label in Persian */
  label?: string;
  /** Field name (for accessibility) */
  name?: string;
  /** Error message */
  error?: string | null;
  /** Whether field was touched */
  touched?: boolean;
  /** Field is required */
  required?: boolean;
  /** Child input element */
  children: React.ReactNode;
  /** Help text below field */
  hint?: string;
  /** CSS class for wrapper */
  className?: string;
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  name,
  error,
  touched,
  required,
  children,
  hint,
  className,
}) => {
  const hasError = touched && error;

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
          {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className={cn('relative', hasError && 'has-error')}>
        {children}
      </div>

      {hasError && (
        <FormFieldError
          error={error}
          showIcon
          className="mt-1"
        />
      )}

      {hint && !hasError && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {hint}
        </p>
      )}
    </div>
  );
};

/**
 * Loading skeleton for form fields
 */
export const FormFieldSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 mb-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      ))}
    </>
  );
};

export default {
  FormFieldError,
  FormErrorSummary,
  FormFieldWrapper,
  FormFieldSkeleton,
};
