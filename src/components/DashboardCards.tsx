import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'warning';
  className?: string;
}

const colorMap = {
  primary: 'from-primary/10 to-primary/5 border-primary/30',
  secondary: 'from-secondary/10 to-secondary/5 border-secondary/30',
  accent: 'from-accent/10 to-accent/5 border-accent/30',
  destructive: 'from-destructive/10 to-destructive/5 border-destructive/30',
  success: 'from-green-500/10 to-green-500/5 border-green-500/30',
  warning: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30',
};

const iconColorMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  destructive: 'text-destructive',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
};

/**
 * Modern stat card for dashboard displays
 * Shows key metrics with visual hierarchy
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'primary',
  className,
}: StatCardProps) {
  return (
    <Card variant="stat" className={cn(`bg-gradient-to-br ${colorMap[color]}`, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              {title}
            </CardTitle>
          </div>
          <Icon className={cn('h-6 w-6', iconColorMap[color])} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-4xl font-bold tracking-tight">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend !== undefined && (
            <div className={cn('text-xs font-semibold', trend > 0 ? 'text-green-600' : 'text-red-600')}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
  href?: string;
}

const actionColorMap = {
  primary: 'from-primary/10 via-primary/5 to-transparent border-primary/40 hover:border-primary/60',
  secondary: 'from-secondary/10 via-secondary/5 to-transparent border-secondary/40 hover:border-secondary/60',
  accent: 'from-accent/10 via-accent/5 to-transparent border-accent/40 hover:border-accent/60',
};

const actionIconColorMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
};

/**
 * Modern action card for dashboard quick actions
 * Shows clickable actions with icons and descriptions
 */
export function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  color = 'primary',
  className,
  href,
}: ActionCardProps) {
  const Component = href ? 'a' : 'div';

  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        'group',
        href && 'no-underline',
        className,
      )}
    >
      <Card
        variant="action"
        className={cn(
          `bg-gradient-to-br ${actionColorMap[color]}`,
          'relative overflow-hidden',
        )}
      >
        {/* Gradient background effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-white to-transparent transition-opacity duration-300" />

        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold group-hover:translate-x-1 transition-transform duration-300">
                {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                {description}
              </p>
            </div>
            <Icon className={cn('h-8 w-8 group-hover:scale-110 transition-transform duration-300', actionIconColorMap[color])} />
          </div>
        </CardHeader>
      </Card>
    </Component>
  );
}

export interface InfoCardProps {
  title: string;
  value: string;
  rightElement?: React.ReactNode;
  status?: 'pending' | 'approved' | 'rejected' | 'neutral';
  className?: string;
}

const statusColorMap = {
  pending: 'border-l-4 border-l-yellow-500 bg-yellow-500/5',
  approved: 'border-l-4 border-l-green-500 bg-green-500/5',
  rejected: 'border-l-4 border-l-red-500 bg-red-500/5',
  neutral: 'border-l-4 border-l-blue-500 bg-blue-500/5',
};

/**
 * Info card for detailed data display
 * Shows information with status indicators
 */
export function InfoCard({
  title,
  value,
  rightElement,
  status = 'neutral',
  className,
}: InfoCardProps) {
  return (
    <Card variant="default" className={cn(statusColorMap[status], className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {title}
          </CardTitle>
          {rightElement}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
