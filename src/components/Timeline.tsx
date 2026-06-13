import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, MessageSquareWarning, Eye, FileText, type LucideIcon } from 'lucide-react';
import { format } from 'date-fns';

export type TimelineTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp?: string | Date | null;
  actor?: string;
  tone?: TimelineTone;
  icon?: LucideIcon;
}

const TONE_CLASSES: Record<TimelineTone, { dot: string; ring: string; text: string }> = {
  default: { dot: 'bg-primary', ring: 'ring-primary/20', text: 'text-foreground' },
  success: { dot: 'bg-success', ring: 'ring-success/20', text: 'text-success' },
  warning: { dot: 'bg-warning', ring: 'ring-warning/20', text: 'text-warning' },
  danger:  { dot: 'bg-destructive', ring: 'ring-destructive/20', text: 'text-destructive' },
  info:    { dot: 'bg-accent', ring: 'ring-accent/20', text: 'text-accent' },
  muted:   { dot: 'bg-muted-foreground', ring: 'ring-muted', text: 'text-muted-foreground' },
};

export const TIMELINE_ICONS = { CheckCircle2, Clock, XCircle, MessageSquareWarning, Eye, FileText };

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
  emptyMessage?: string;
}

/**
 * Vertical timeline for submission history / audit trails.
 * RTL-aware: rail sits on the right, content flows to the left.
 */
export function Timeline({ events, className, emptyMessage = 'هیچ رویدادی ثبت نشده است' }: TimelineProps) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyMessage}</p>;
  }

  return (
    <ol className={cn('relative space-y-5 pe-6', className)}>
      {/* Rail */}
      <span className="absolute top-1 bottom-1 right-[11px] w-px bg-border" aria-hidden />
      {events.map((e, i) => {
        const tone = TONE_CLASSES[e.tone ?? 'default'];
        const Icon = e.icon;
        return (
          <li key={e.id} className="relative">
            <span
              className={cn(
                'absolute right-0 top-1 h-[22px] w-[22px] rounded-full ring-4 ring-background flex items-center justify-center',
                tone.dot,
              )}
              aria-hidden
            >
              {Icon ? <Icon className="h-3 w-3 text-background" /> : <span className="h-1.5 w-1.5 rounded-full bg-background" />}
            </span>
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className={cn('text-sm font-medium', tone.text)}>{e.title}</p>
                {e.timestamp && (
                  <time className="text-[11px] text-muted-foreground">
                    {format(new Date(e.timestamp), 'yyyy/MM/dd HH:mm')}
                  </time>
                )}
              </div>
              {e.actor && <p className="text-xs text-muted-foreground">{e.actor}</p>}
              {e.description && <p className="text-xs text-muted-foreground leading-relaxed">{e.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
