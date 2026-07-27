import { cn } from '@/lib/utils';
import { CornerUpLeft, Paperclip } from 'lucide-react';

interface Props {
  senderName: string | null;
  body: string | null;
  attachmentName: string | null;
  onClick?: () => void;
  variant?: 'bubble' | 'composer';
  className?: string;
}

export function QuotedMessage({
  senderName,
  body,
  attachmentName,
  onClick,
  variant = 'bubble',
  className,
}: Props) {
  const text = body?.trim() || attachmentName || 'پیام';
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'w-full text-right flex items-start gap-2 rounded-lg border-e-2 px-2 py-1.5 mb-1',
        variant === 'bubble'
          ? 'border-e-current/50 bg-foreground/5'
          : 'border-e-primary bg-muted',
        className,
      )}
    >
      {variant === 'composer' && <CornerUpLeft className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />}
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold opacity-80 truncate">
          {senderName || 'کاربر'}
        </span>
        <span className="block text-[11px] opacity-80 truncate">
          {!body && attachmentName && <Paperclip className="inline h-3 w-3 me-1" />}
          {text}
        </span>
      </span>
    </Comp>
  );
}
