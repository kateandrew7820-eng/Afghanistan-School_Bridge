export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export const STATUS_CONFIG: Record<SubmissionStatus, { label: string; className: string }> = {
  approved: { label: 'تأیید شده', className: 'bg-accent/10 text-accent border-accent/20' },
  pending:  { label: 'در انتظار', className: 'bg-warning/10 text-warning border-warning/20' },
  rejected: { label: 'رد شده',    className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export const TYPE_LABELS: Record<string, string> = {
  statistics: 'آمار',
  report: 'گزارش',
  form: 'فورم',
};
