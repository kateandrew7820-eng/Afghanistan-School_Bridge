import { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface SmartFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
  hint?: string;
  required?: boolean;
  validation?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SmartFormField({
  label,
  error,
  touched,
  hint,
  required,
  validation,
  onBlur,
  onChange,
  className,
  value,
  ...props
}: SmartFormFieldProps) {
  const hasError = touched && error;
  const isValid = touched && !error && value;

  return (
    <div className="space-y-2">
      <Label className={cn(required && 'after:content-["*"] after:ml-1 after:text-destructive')}>
        {label}
      </Label>

      <div className="relative">
        <Input
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={cn(
            'transition-all duration-200',
            hasError && 'border-destructive focus-visible:ring-destructive',
            isValid && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
          {...props}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? `error-${label}` : undefined}
        />

        <div className="absolute left-3 top-3 flex items-center gap-1 rtl:left-auto rtl:right-3">
          {hasError && (
            <AlertCircle className="h-5 w-5 text-destructive animate-in fade-in-50" />
          )}
          {isValid && (
            <CheckCircle2 className="h-5 w-5 text-green-600 animate-in fade-in-50" />
          )}
        </div>
      </div>

      {hasError && (
        <p
          id={`error-${label}`}
          className="text-sm text-destructive animate-in slide-in-from-top-2"
          role="alert"
        >
          {error}
        </p>
      )}

      {!hasError && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

interface SmartTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  touched?: boolean;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
}

export function SmartTextarea({
  label,
  error,
  touched,
  hint,
  required,
  maxLength,
  rows = 4,
  onBlur,
  onChange,
  className,
  value,
  ...props
}: SmartTextareaProps) {
  const hasError = touched && error;
  const isValid = touched && !error && value;
  const charCount = typeof value === 'string' ? value.length : 0;
  const remainingChars = maxLength ? maxLength - charCount : null;

  return (
    <div className="space-y-2">
      <Label className={cn(required && 'after:content-["*"] after:ml-1 after:text-destructive')}>
        {label}
      </Label>

      <div className="relative">
        <textarea
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            hasError && 'border-destructive focus-visible:ring-destructive',
            isValid && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? `error-${label}` : undefined}
          {...props}
        />

        <div className="absolute left-3 top-3 flex items-center gap-1 rtl:left-auto rtl:right-3">
          {hasError && (
            <AlertCircle className="h-5 w-5 text-destructive animate-in fade-in-50" />
          )}
          {isValid && (
            <CheckCircle2 className="h-5 w-5 text-green-600 animate-in fade-in-50" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {hasError && (
            <p
              id={`error-${label}`}
              className="text-sm text-destructive animate-in slide-in-from-top-2"
              role="alert"
            >
              {error}
            </p>
          )}
          {!hasError && hint && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>

        {maxLength && (
          <p className={cn(
            'text-xs font-medium',
            remainingChars && remainingChars < 50 && 'text-amber-600',
            remainingChars && remainingChars <= 0 && 'text-destructive'
          )}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
