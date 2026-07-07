import { useEffect, useMemo, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { formatDaySeparator } from '@/lib/chat/format';
import type { ChatMessage } from '@/hooks/useMessages';
import type { ConversationSummary } from '@/hooks/useConversations';

interface Props {
  messages: ChatMessage[];
  conv: ConversationSummary;
  currentUserId: string;
  typingUserIds: Set<string>;
  onLoadOlder: () => void;
  hasMore: boolean;
  onVisible: () => void;
}

function sameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export function MessageThread({
  messages,
  conv,
  currentUserId,
  typingUserIds,
  onLoadOlder,
  hasMore,
  onVisible,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const memberNames = useMemo(() => {
    const m = new Map<string, string | null>();
    conv.members.forEach((mem) => m.set(mem.user_id, mem.full_name));
    return m;
  }, [conv.members]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    onVisible();
  }, [messages.length, onVisible]);

  const typingNames = Array.from(typingUserIds)
    .filter((uid) => uid !== currentUserId)
    .map((uid) => memberNames.get(uid) || 'کسی')
    .slice(0, 2);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-2 bg-background">
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadOlder}
            className="text-xs text-primary hover:underline py-1"
          >
            بارگیری پیام‌های قدیمی‌تر
          </button>
        </div>
      )}
      {messages.map((m, idx) => {
        const prev = messages[idx - 1];
        const showDay = !prev || !sameDay(prev.created_at, m.created_at);
        const isMine = m.sender_id === currentUserId;
        const prevSameSender =
          prev &&
          prev.sender_id === m.sender_id &&
          new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;
        const showAvatar = !prevSameSender;
        const showSenderName = conv.type === 'group' && !isMine && !prevSameSender;
        return (
          <div key={m.id} className="space-y-2">
            {showDay && (
              <div className="flex items-center justify-center py-2">
                <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {formatDaySeparator(m.created_at)}
                </span>
              </div>
            )}
            <MessageBubble
              message={m}
              isMine={isMine}
              senderName={memberNames.get(m.sender_id) || null}
              showAvatar={showAvatar}
              showSenderName={showSenderName}
              totalOtherMembers={Math.max(0, conv.members.length - 1)}
            />
          </div>
        );
      })}
      {typingNames.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 ps-10">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:300ms]" />
          </span>
          <span>{typingNames.join('، ')} در حال نوشتن…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
