import { ReactNode, lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Sparkline = lazy(() => import('./Sparkline').then(m => ({ default: m.Sparkline })));

interface KpiCardProps {
  label: string;
  value: number | string | undefined;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  trend?: { value: number; label?: string };
  hint?: string;
  loading?: boolean;
  to?: string;
  action?: ReactNode;
  sparkline?: number[];
}

const TONES: Record<NonNullable<KpiCardProps['tone']>, { iconBg: string; iconFg: string }> = {
  default: { iconBg: 'bg-primary/10', iconFg: 'text-primary' },
  success: { iconBg: 'bg-success/10', iconFg: 'text-success' },
  warning: { iconBg: 'bg-warning/10', iconFg: 'text-warning' },
  danger:  { iconBg: 'bg-destructive/10', iconFg: 'text-destructive' },
  info:    { iconBg: 'bg-accent/10', iconFg: 'text-accent' },
};

export function KpiCard({
  label, value, icon: Icon, tone = 'default', trend, hint, loading, to, action, sparkline,
}: KpiCardProps) {
  const t = TONES[tone];
  const TrendIcon = !trend ? null : trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus;
  const trendTone = !trend ? '' : trend.value > 0 ? 'text-success' : trend.value < 0 ? 'text-destructive' : 'text-muted-foreground';
  const sparkColor = tone === 'success' ? 'hsl(var(--success))'
    : tone === 'warning' ? 'hsl(var(--warning))'
    : tone === 'danger' ? 'hsl(var(--destructive))'
    : 'hsl(var(--primary))';

  const inner = (
    <Card className={cn(
      'p-4 border-border bg-card transition-all',
      to && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
        </div>
        {Icon && (
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', t.iconBg)}>
            <Icon className={cn('h-4 w-4', t.iconFg)} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold tracking-tight leading-none">
            {value ?? '—'}
          </p>
        )}
        {trend && TrendIcon && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendTone)}>
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {sparkline && sparkline.length > 1 && !loading && (
        <div className="mt-2">
          <Suspense fallback={<div className="h-8" />}>
            <Sparkline data={sparkline} color={sparkColor} />
          </Suspense>
        </div>
      )}
      {(hint || action) && (
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
          {action}
        </div>
      )}
    </Card>
  );

  return to ? <Link to={to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">{inner}</Link> : inner;
}
