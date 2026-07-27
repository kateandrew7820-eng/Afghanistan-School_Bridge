import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageThreadSkeleton } from './ChatSkeletons';
import { formatDaySeparator } from '@/lib/chat/format';
import { getRoleLabelFA } from '@/lib/permissions';
import { MessageSquarePlus, ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/hooks/useMessages';
import type { ConversationSummary } from '@/hooks/useConversations';

interface Props {
  messages: ChatMessage[];
  conv: ConversationSummary;
  currentUserId: string;
  typingUserIds: Set<string>;
  loading: boolean;
  loadError: string | null;
  onRetryLoad: () => void;
  onLoadOlder: () => void;
  hasMore: boolean;
  onVisible: () => void;
  isPinned: (id: string) => boolean;
  onReply: (m: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
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
  loading,
  loadError,
  onRetryLoad,
  onLoadOlder,
  hasMore,
  onVisible,
  isPinned,
  onReply,
  onReact,
  onTogglePin,
  onDelete,
  onRetry,
  onDiscard,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newBelow, setNewBelow] = useState(false);
  const prevCount = useRef(0);

  const memberNames = useMemo(() => {
    const m = new Map<string, string | null>();
    conv.members.forEach((mem) => m.set(mem.user_id, mem.full_name));
    return m;
  }, [conv.members]);

  const memberRoles = useMemo(() => {
    const m = new Map<string, string | null>();
    conv.members.forEach((mem) => m.set(mem.user_id, mem.platform_role));
    return m;
  }, [conv.members]);

  const nameOf = useCallback(
    (uid: string) => (uid === currentUserId ? 'شما' : memberNames.get(uid) || 'کاربر'),
    [memberNames, currentUserId],
  );

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setNewBelow(false);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setAtBottom(near);
    if (near) setNewBelow(false);
  }, []);

  useLayoutEffect(() => {
    if (messages.length === 0) return;
    const grew = messages.length > prevCount.current;
    prevCount.current = messages.length;
    if (!grew) return;
    const last = messages[messages.length - 1];
    if (atBottom || last.sender_id === currentUserId) scrollToBottom(prevCount.current > 1);
    else setNewBelow(true);
  }, [messages, atBottom, currentUserId, scrollToBottom]);

  useEffect(() => {
    if (atBottom) onVisible();
  }, [messages.length, atBottom, onVisible]);

  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-primary', 'rounded-2xl');
    setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'rounded-2xl'), 1400);
  }, []);

  const typingNames = Array.from(typingUserIds)
    .filter((uid) => uid !== currentUserId)
    .map((uid) => memberNames.get(uid) || 'کسی')
    .slice(0, 2);

  if (loading && messages.length === 0) return <MessageThreadSkeleton />;

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button variant="outline" size="sm" onClick={onRetryLoad} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تلاش دوباره
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-2 bg-background"
      >
        {hasMore && (
          <div className="flex justify-center">
            <button onClick={onLoadOlder} className="text-xs text-primary hover:underline py-1">
              بارگیری پیام‌های قدیمی‌تر
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-16">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquarePlus className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">هنوز پیامی نیست</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              اولین پیام را بنویسید و گفتگو را آغاز کنید.
            </p>
          </div>
        )}

        {messages.map((m, idx) => {
          const prev = messages[idx - 1];
          const showDay = !prev || !sameDay(prev.created_at, m.created_at);
          const isMine = m.sender_id === currentUserId;
          const prevSameSender =
            prev &&
            prev.sender_id === m.sender_id &&
            !showDay &&
            new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;
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
                senderRoleLabel={getRoleLabelFA((memberRoles.get(m.sender_id) as any) ?? null)}
                showAvatar={!prevSameSender}
                showSenderName={conv.type === 'group' && !isMine && !prevSameSender}
                totalOtherMembers={Math.max(0, conv.members.length - 1)}
                currentUserId={currentUserId}
                pinned={isPinned(m.id)}
                nameOf={nameOf}
                onReply={onReply}
                onReact={onReact}
                onTogglePin={onTogglePin}
                onDelete={onDelete}
                onJumpTo={jumpTo}
                onRetry={onRetry}
                onDiscard={onDiscard}
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

      {(newBelow || !atBottom) && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 start-4 h-10 px-3 rounded-full bg-primary text-primary-foreground shadow-lg text-xs flex items-center gap-1.5"
        >
          <ArrowDown className="h-4 w-4" />
          {newBelow ? 'پیام‌های جدید' : 'آخرین پیام‌ها'}
        </button>
      )}
    </div>
  );
}
