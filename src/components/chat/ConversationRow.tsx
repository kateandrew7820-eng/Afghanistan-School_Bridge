import { cn } from '@/lib/utils';
import { ChatAvatar } from './ChatAvatar';
import { relativeTimeFa } from '@/lib/chat/format';
import { Paperclip } from 'lucide-react';
import type { ConversationSummary } from '@/hooks/useConversations';

interface Props {
  conv: ConversationSummary;
  active: boolean;
  currentUserId: string;
  onClick: () => void;
  online?: boolean;
}

function displayName(conv: ConversationSummary, currentUserId: string): string {
  if (conv.type === 'group') return conv.title || 'گفتگوی گروهی';
  const other = conv.members.find((m) => m.user_id !== currentUserId);
  return other?.full_name || 'گفتگو';
}

export function ConversationRow({ conv, active, currentUserId, onClick, online }: Props) {
  const name = displayName(conv, currentUserId);
  const last = conv.last_message;
  const preview = last
    ? last.body?.trim() ||
      (last.attachment_name ? `📎 ${last.attachment_name}` : 'پیام')
    : 'هنوز پیامی نیست';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-right flex items-start gap-3 px-3 py-3 rounded-xl transition-colors',
        active
          ? 'bg-primary/10 border border-primary/30'
          : 'hover:bg-muted border border-transparent',
        conv.unread_count > 0 && !active && 'bg-primary/5',
      )}
    >
      <ChatAvatar name={name} type={conv.type} online={online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-sm truncate', conv.unread_count > 0 ? 'font-semibold' : 'font-medium')}>
            {name}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {relativeTimeFa(conv.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn('text-xs truncate', conv.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground')}>
            {last?.attachment_name && !last?.body && <Paperclip className="inline h-3 w-3 me-1" />}
            {preview}
          </p>
          {conv.unread_count > 0 && (
            <span className="text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
