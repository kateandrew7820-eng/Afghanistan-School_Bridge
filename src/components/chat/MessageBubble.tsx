import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';
import { AttachmentPreview } from './AttachmentPreview';
import { formatTimeFa } from '@/lib/chat/format';
import type { ChatMessage } from '@/hooks/useMessages';

interface Props {
  message: ChatMessage;
  isMine: boolean;
  senderName: string | null;
  showAvatar: boolean;
  showSenderName: boolean;
  totalOtherMembers: number;
  onRetry: () => void;
}

export function MessageBubble({
  message,
  isMine,
  senderName,
  showAvatar,
  showSenderName,
  totalOtherMembers,
  onRetry,
}: Props) {
  const readByOthers = message.read_by.filter((uid) => uid !== message.sender_id).length;
  const seenByAll = totalOtherMembers > 0 && readByOthers >= totalOtherMembers;

  return (
    <div
      className={cn(
        'flex gap-2 items-end',
        isMine ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div className="w-8 shrink-0">
        {!isMine && showAvatar && (
          <ChatAvatar name={senderName} type="direct" size="sm" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[75%] md:max-w-[65%] rounded-2xl px-3 py-2 shadow-sm',
          isMine
            ? 'bg-primary text-primary-foreground rounded-bl-md'
            : 'bg-muted text-foreground rounded-br-md',
        )}
      >
        {showSenderName && !isMine && (
          <p className="text-[11px] font-semibold text-primary mb-0.5">{senderName || 'کاربر'}</p>
        )}
        {message.attachment_url && message.attachment_name && message.attachment_mime && (
          <div className={cn('mb-1', message.body ? '' : '-mx-1 -mt-1')}>
            <AttachmentPreview
              path={message.attachment_url}
              name={message.attachment_name}
              mime={message.attachment_mime}
              size={message.attachment_size}
            />
          </div>
        )}
        {!message.attachment_url && message.attachment_name && (
          <p className="mb-1 rounded-md bg-background/40 px-2 py-1 text-xs">
            {message.attachment_name}
          </p>
        )}
        {message.body && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.deleted_at ? <span className="italic opacity-70">پیام حذف شد</span> : message.body}
          </p>
        )}
        <div
          className={cn(
            'flex items-center gap-1 mt-0.5',
            isMine ? 'justify-end' : 'justify-start',
          )}
        >
          {message.local_state && (
            <span className={cn(
              'text-[10px]',
              isMine ? 'text-primary-foreground/75' : 'text-muted-foreground',
            )}>
              {message.local_state === 'pending'
                ? 'در انتظار ارسال'
                : message.local_state === 'failed'
                  ? 'ارسال ناموفق'
                  : 'ارسال شد'}
            </span>
          )}
          {message.local_state === 'failed' && (
            <button type="button" onClick={onRetry} className="text-[10px] underline">
              تلاش دوباره
            </button>
          )}
          <span
            className={cn(
              'text-[10px]',
              isMine ? 'text-primary-foreground/75' : 'text-muted-foreground',
            )}
          >
            {formatTimeFa(message.created_at)}
          </span>
          {isMine && (
            seenByAll ? (
              <CheckCheck className="h-3 w-3 text-primary-foreground" />
            ) : readByOthers > 0 ? (
              <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
            ) : (
              <Check className="h-3 w-3 text-primary-foreground/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
