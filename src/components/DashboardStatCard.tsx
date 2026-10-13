import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStatCardProps {
  title: string;
  value?: number;
  icon?: React.ReactNode;
  loading: boolean;
  format?: boolean;
  suffix?: string;
  subtitle?: string;
}

export const DashboardStatCard = React.forwardRef<HTMLDivElement, DashboardStatCardProps>(
  ({ title, value, icon, loading, format: doFormat, suffix = '', subtitle }, ref) => {
    const display = doFormat ? (value ?? 0).toLocaleString('fa-AF') : (value ?? 0);

    return (
      <Card ref={ref} variant="stat" className="min-h-[140px] p-4">
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
          <CardTitle className="text-xs leading-relaxed text-muted-foreground font-medium">{title}</CardTitle>
          {icon && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-16 rounded" />
          ) : (
            <div className="text-3xl font-bold leading-snug tabular-nums">{display}{suffix}</div>
          )}
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </CardContent>
      </Card>
    );
  }
);
DashboardStatCard.displayName = 'DashboardStatCard';
