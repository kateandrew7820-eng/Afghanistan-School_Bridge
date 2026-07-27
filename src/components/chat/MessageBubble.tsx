import { cn } from '@/lib/utils';
import { Check, CheckCheck, Pin, AlertCircle, Clock } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';
import { AttachmentPreview } from './AttachmentPreview';
import { QuotedMessage } from './QuotedMessage';
import { MessageActions } from './MessageActions';
import { formatTimeFa } from '@/lib/chat/format';
import type { ChatMessage } from '@/hooks/useMessages';

interface Props {
  message: ChatMessage;
  isMine: boolean;
  senderName: string | null;
  senderRoleLabel?: string | null;
  showAvatar: boolean;
  showSenderName: boolean;
  totalOtherMembers: number;
  currentUserId: string;
  pinned: boolean;
  nameOf: (userId: string) => string;
  onReply: (m: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onJumpTo: (messageId: string) => void;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}

export function MessageBubble({
  message,
  isMine,
  senderName,
  senderRoleLabel,
  showAvatar,
  showSenderName,
  totalOtherMembers,
  currentUserId,
  pinned,
  nameOf,
  onReply,
  onReact,
  onTogglePin,
  onDelete,
  onJumpTo,
  onRetry,
  onDiscard,
}: Props) {
  const readByOthers = message.read_by.filter((uid) => uid !== message.sender_id).length;
  const seenByAll = totalOtherMembers > 0 && readByOthers >= totalOtherMembers;
  const isDeleted = !!message.deleted_at;
  const readerNames = message.read_by
    .filter((uid) => uid !== message.sender_id)
    .map((uid) => nameOf(uid));

  return (
    <div
      id={`msg-${message.id}`}
      className={cn('group flex gap-2 items-end scroll-mt-24', isMine ? 'flex-row-reverse' : 'flex-row')}
    >
      <div className="w-8 shrink-0">
        {!isMine && showAvatar && <ChatAvatar name={senderName} type="direct" size="sm" />}
      </div>

      <div className={cn('flex flex-col max-w-[80%] md:max-w-[65%]', isMine ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3 py-2 shadow-sm',
            isMine
              ? 'bg-primary text-primary-foreground rounded-bl-md'
              : 'bg-muted text-foreground rounded-br-md',
            message.pending && 'opacity-70',
            message.failed && 'ring-1 ring-destructive',
          )}
        >
          {showSenderName && !isMine && (
            <p className="text-[11px] font-semibold text-primary mb-0.5">
              {senderName || 'کاربر'}
              {senderRoleLabel && (
                <span className="text-muted-foreground font-normal ms-1">· {senderRoleLabel}</span>
              )}
            </p>
          )}

          {message.reply_to && !isDeleted && (
            <QuotedMessage
              senderName={nameOf(message.reply_to.sender_id)}
              body={message.reply_to.body}
              attachmentName={message.reply_to.attachment_name}
              onClick={() => onJumpTo(message.reply_to!.id)}
            />
          )}

          {!isDeleted && message.attachment_url && message.attachment_name && message.attachment_mime && (
            <div className={cn('mb-1', message.body ? '' : '-mx-1 -mt-1')}>
              <AttachmentPreview
                path={message.attachment_url}
                name={message.attachment_name}
                mime={message.attachment_mime}
                size={message.attachment_size}
              />
            </div>
          )}

          {(message.body || isDeleted) && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {isDeleted ? <span className="italic opacity-70">این پیام حذف شد</span> : message.body}
            </p>
          )}

          <div className={cn('flex items-center gap-1 mt-0.5', isMine ? 'justify-end' : 'justify-start')}>
            {pinned && (
              <Pin className={cn('h-3 w-3', isMine ? 'text-primary-foreground/75' : 'text-muted-foreground')} />
            )}
            <span
              className={cn('text-[10px]', isMine ? 'text-primary-foreground/75' : 'text-muted-foreground')}
              title={readerNames.length ? `خوانده شده توسط: ${readerNames.join('، ')}` : undefined}
            >
              {formatTimeFa(message.created_at)}
            </span>
            {isMine &&
              (message.pending ? (
                <Clock className="h-3 w-3 text-primary-foreground/70" />
              ) : message.failed ? (
                <AlertCircle className="h-3 w-3 text-destructive" />
              ) : seenByAll ? (
                <CheckCheck className="h-3 w-3 text-primary-foreground" />
              ) : readByOthers > 0 ? (
                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
              ) : (
                <Check className="h-3 w-3 text-primary-foreground/70" />
              ))}
          </div>
        </div>

        {message.failed && message.client_id && (
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="text-destructive">ارسال ناموفق بود</span>
            <button className="text-primary hover:underline" onClick={() => onRetry(message.client_id!)}>
              تلاش دوباره
            </button>
            <button
              className="text-muted-foreground hover:underline"
              onClick={() => onDiscard(message.client_id!)}
            >
              حذف
            </button>
          </div>
        )}

        {message.reactions.length > 0 && (
          <div className={cn('flex flex-wrap gap-1 mt-1', isMine ? 'justify-end' : 'justify-start')}>
            {message.reactions.map((r) => {
              const mine = r.user_ids.includes(currentUserId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => onReact(message.id, r.emoji)}
                  title={r.user_ids.map((u) => nameOf(u)).join('، ')}
                  className={cn(
                    'h-6 px-2 rounded-full border text-[11px] flex items-center gap-1',
                    mine
                      ? 'bg-primary/15 border-primary/40 text-foreground'
                      : 'bg-muted border-border text-muted-foreground',
                  )}
                >
                  <span>{r.emoji}</span>
                  <span>{r.user_ids.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!isDeleted && !message.pending && !message.failed && (
        <MessageActions
          isMine={isMine}
          pinned={pinned}
          canDelete={isMine}
          hasText={!!message.body}
          onReply={() => onReply(message)}
          onReact={(e) => onReact(message.id, e)}
          onTogglePin={() => onTogglePin(message.id)}
          onCopy={() => message.body && navigator.clipboard?.writeText(message.body)}
          onDelete={() => onDelete(message.id)}
        />
      )}
    </div>
  );
}
