import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  completed?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface SmartGuidanceProps {
  title: string;
  description?: string;
  steps: NextStep[];
  onStepClick?: (stepId: string) => void;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * Smart Guidance Component
 * Shows contextual guidance, tips, and next steps based on user role
 * Helps users navigate the platform intuitively
 */
export function SmartGuidance({
  title,
  description,
  steps,
  onStepClick,
  dismissible = true,
  onDismiss,
}: SmartGuidanceProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const sortedSteps = [...steps].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']);
  });

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <CardTitle className="text-base text-blue-900">{title}</CardTitle>
            {description && (
              <CardDescription className="text-blue-700 mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {sortedSteps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors',
              step.completed ? 'bg-white/50' : 'bg-white hover:bg-blue-50/50 cursor-pointer',
              'border border-blue-100'
            )}
            onClick={() => !step.completed && onStepClick?.(step.id)}
          >
            {step.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-200 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={cn(
                  'font-medium text-sm',
                  step.completed && 'line-through text-muted-foreground'
                )}>
                  {step.title}
                </p>
                {step.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs">High</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>

              {step.action && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 h-auto p-0 text-blue-600 hover:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    step.action?.onClick?.();
                  }}
                  asChild={!!step.action.href}
                >
                  {step.action.href ? (
                    <a href={step.action.href}>
                      {step.action.label} <ArrowRight className="ml-1 h-3 w-3" />
                    </a>
                  ) : (
                    <>
                      {step.action.label} <ArrowRight className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Smart Tip Component
 * Shows quick tips and contextual help
 */
export interface SmartTipProps {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SmartTip({
  title,
  message,
  type = 'info',
  dismissible = true,
  onDismiss,
  action,
}: SmartTipProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const typeStyles = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border flex items-start gap-3',
      typeStyles[type]
    )}>
      <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-sm opacity-90">{message}</p>
        {action && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0"
            onClick={action.onClick}
          >
            {action.label} →
          </Button>
        )}
      </div>
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
