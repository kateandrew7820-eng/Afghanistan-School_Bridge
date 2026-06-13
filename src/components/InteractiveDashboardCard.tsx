import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InteractiveDashboardCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  onExpand?: () => void;
  isClickable?: boolean;
  className?: string;
  highlight?: boolean; // Highlights important cards
}

/**
 * Interactive Dashboard Card Component
 * Supports expanding, filtering, and highlighting important information
 * Makes dashboard feel more interactive and responsive
 */
export function InteractiveDashboardCard({
  title,
  description,
  icon,
  badge,
  children,
  expandedContent,
  onExpand,
  isClickable = true,
  className,
  highlight = false,
}: InteractiveDashboardCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isClickable && 'hover:shadow-lg hover:border-primary cursor-pointer',
        highlight && 'border-primary/50 bg-primary/5',
        className
      )}
    >
      <div onClick={isClickable ? handleToggleExpand : undefined}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {icon && <div className="mt-1">{icon}</div>}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{title}</CardTitle>
                  {badge && (
                    <span className={cn(
                      'text-xs font-semibold px-2 py-1 rounded',
                      badge.variant === 'destructive' && 'bg-destructive/20 text-destructive',
                      badge.variant === 'secondary' && 'bg-secondary text-secondary-foreground',
                      badge.variant === 'outline' && 'border border-current',
                      !badge.variant && 'bg-primary/20 text-primary',
                    )}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {description && <CardDescription className="text-sm">{description}</CardDescription>}
              </div>
            </div>

            {isClickable && expandedContent && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExpand();
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn(
          'transition-all duration-200',
          !isClickable && 'pt-3'
        )}>
          {children}
        </CardContent>
      </div>

      {isExpanded && expandedContent && (
        <CardContent className="pt-0 border-t mt-3 animate-in slide-in-from-top-2">
          {expandedContent}
        </CardContent>
      )}
    </Card>
  );
}

export interface SmartStatusCardProps {
  label: string;
  value: string | number;
  status: 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  onChange?: () => void;
}

/**
 * Smart Status Card Component
 * Shows status with color-coding and auto-highlights when important
 */
export function SmartStatusCard({
  label,
  value,
  status,
  trend,
  onChange,
}: SmartStatusCardProps) {
  const statusColors = {
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    error: 'text-destructive bg-destructive/10 border-destructive/20',
    info: 'text-primary bg-primary/10 border-primary/20',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all duration-200',
        statusColors[status],
        'cursor-pointer hover:shadow-md'
      )}
      onClick={onChange}
    >
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {trend && (
        <p className="text-xs mt-2 font-semibold">
          {trend === 'up' && '↑ Increasing'}
          {trend === 'down' && '↓ Decreasing'}
          {trend === 'neutral' && '→ Stable'}
        </p>
      )}
    </div>
  );
}
