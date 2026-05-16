import { cn } from '@/lib/utils';
import { Check, type LucideIcon } from 'lucide-react';

export interface StepperStep {
  key: string;
  label: string;
  icon?: LucideIcon;
}

interface StepperProps {
  steps: StepperStep[];
  /** Index of the current (in-progress) step; previous steps are done. -1 for none done. */
  currentIndex: number;
  /** Mark the workflow as failed at this index (replaces the check with an X). */
  failedIndex?: number;
  className?: string;
}

/**
 * Horizontal stepper for workflow status visualization (RTL-aware via flex-row-reverse parent).
 * Renders compact on mobile, full on desktop.
 */
export function Stepper({ steps, currentIndex, failedIndex, className }: StepperProps) {
  return (
    <ol className={cn('flex items-center w-full', className)} dir="rtl">
      {steps.map((step, i) => {
        const isDone = failedIndex == null ? i < currentIndex : i < failedIndex;
        const isCurrent = i === currentIndex && failedIndex == null;
        const isFailed = failedIndex != null && i === failedIndex;
        const Icon = step.icon;

        return (
          <li key={step.key} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                  isDone && 'bg-success border-success text-success-foreground',
                  isCurrent && 'bg-primary border-primary text-primary-foreground animate-pulse',
                  isFailed && 'bg-destructive border-destructive text-destructive-foreground',
                  !isDone && !isCurrent && !isFailed && 'bg-card border-border text-muted-foreground',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? <Check className="h-4 w-4" /> : Icon ? <Icon className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] sm:text-xs font-medium text-center truncate max-w-[70px] sm:max-w-none',
                isCurrent ? 'text-foreground' : 'text-muted-foreground',
              )}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 transition-colors -mt-5',
                  isDone ? 'bg-success' : 'bg-border',
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
