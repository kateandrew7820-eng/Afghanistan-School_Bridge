import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, MessageSquareWarning, Eye, type LucideIcon } from 'lucide-react';

export type SubmissionStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for badge background+text. Uses semantic tokens. */
  className: string;
  /** Tailwind class for solid dot indicator. */
  dot: string;
}

export const STATUS_META: Record<SubmissionStatus, StatusMeta> = {
  pending: {
    label: 'در انتظار', icon: Clock,
    className: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  under_review: {
    label: 'در حال بررسی', icon: Eye,
    className: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
  },
  approved: {
    label: 'تأیید شده', icon: CheckCircle2,
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  rejected: {
    label: 'رد شده', icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive',
  },
  changes_requested: {
    label: 'نیاز به اصلاح', icon: MessageSquareWarning,
    className: 'bg-primary/10 text-primary border-primary/20',
    dot: 'bg-primary',
  },
};

export const TYPE_LABELS: Record<string, string> = {
  statistics: 'آمار',
  report: 'گزارش',
  form: 'فورم',
};

/** Normalize legacy/unknown statuses to the canonical set. */
export function normalizeStatus(s?: string | null): SubmissionStatus {
  switch (s) {
    case 'approved':
    case 'تأیید شده':
      return 'approved';
    case 'rejected':
    case 'رد شده':
      return 'rejected';
    case 'reviewed':
    case 'under_review':
    case 'بررسی‌شده':
      return 'under_review';
    case 'changes_requested':
      return 'changes_requested';
    default:
      return 'pending';
  }
}

interface StatusBadgeProps {
  status: string | SubmissionStatus | null | undefined;
  size?: 'sm' | 'md';
  withIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = 'sm', withIcon = true, className }: StatusBadgeProps) {
  const key = normalizeStatus(status);
  const meta = STATUS_META[key];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        meta.className,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      {withIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      <span>{meta.label}</span>
    </span>
  );
}

/** Backwards compatibility for `STATUS_CONFIG` consumers. */
export const STATUS_CONFIG = Object.fromEntries(
  Object.entries(STATUS_META).map(([k, v]) => [k, { label: v.label, className: v.className }])
) as Record<SubmissionStatus, { label: string; className: string }>;
