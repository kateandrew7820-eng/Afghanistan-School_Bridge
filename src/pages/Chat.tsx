import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useMessages, type ChatMessage } from '@/hooks/useMessages';
import { useChatPresence } from '@/hooks/useChatPresence';
import { usePins } from '@/hooks/usePins';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageThread } from '@/components/chat/MessageThread';
import { MessageComposer, type ComposerReply } from '@/components/chat/MessageComposer';
import { DetailsPanel } from '@/components/chat/DetailsPanel';
import { NewConversationModal } from '@/components/chat/NewConversationModal';
import { cn } from '@/lib/utils';

export default function Chat() {
  const { user } = useAuth();
  const { conversations, loading, reload, setActiveConversation, markConversationRead } =
    useConversations();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('c');
  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const [newOpen, setNewOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [replyTo, setReplyTo] = useState<ComposerReply | null>(null);
  const jumpToMessage = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-primary', 'rounded-2xl');
    setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'rounded-2xl'), 1400);
  }, []);

  const {
    messages,
    loading: messagesLoading,
    loadError,
    hasMore,
    loadOlder,
    reload: reloadMessages,
    sendMessage,
    retryMessage,
    discardMessage,
    deleteMessage,
    toggleReaction,
    markRead,
  } = useMessages(activeId);
  const { onlineUserIds, typingUserIds, broadcastTyping } = useChatPresence(activeId);
  const { pins, isPinned, togglePin } = usePins(activeId);

  const setActive = (id: string | null) => {
    setReplyTo(null);
    if (id) setSearchParams({ c: id });
    else setSearchParams({});
  };

  useEffect(() => {
    if (!activeId && conversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setActive(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, activeId]);

  const nameOf = useCallback(
    (userId: string) =>
      activeConv?.members.find((m) => m.user_id === userId)?.full_name || 'کاربر',
    [activeConv],
  );

  const handleReply = useCallback(
    (m: ChatMessage) => {
      setReplyTo({
        id: m.id,
        senderName: nameOf(m.sender_id),
        body: m.body,
        attachmentName: m.attachment_name,
      });
    },
    [nameOf],
  );

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-background" dir="rtl">
      <Helmet>
        <title>گفتگو | پل آموزش افغانستان</title>
      </Helmet>
      <div className="flex flex-1 min-h-0">
        {/* Conversation list (right in RTL) */}
        <div
          className={cn('w-full md:w-[340px] shrink-0 order-last', activeId && 'hidden md:block')}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            currentUserId={user.id}
            onSelect={(id) => setActive(id)}
            onNewConversation={() => setNewOpen(true)}
            loading={loading}
          />
        </div>

        {/* Active chat (center) */}
        <div className={cn('flex-1 flex flex-col min-w-0', !activeId && 'hidden md:flex')}>
          {activeConv ? (
            <>
              <ChatHeader
                conv={activeConv}
                currentUserId={user.id}
                onlineUserIds={onlineUserIds}
                onToggleDetails={() => setDetailsOpen((v) => !v)}
                onBack={() => setActive(null)}
                pins={pins}
                onJumpToPin={jumpToMessage}
              />
              <MessageThread
                messages={messages}
                conv={activeConv}
                currentUserId={user.id}
                typingUserIds={typingUserIds}
                loading={messagesLoading}
                loadError={loadError}
                onRetryLoad={reloadMessages}
                onLoadOlder={loadOlder}
                hasMore={hasMore}
                onVisible={markRead}
                isPinned={isPinned}
                onReply={handleReply}
                onReact={toggleReaction}
                onTogglePin={togglePin}
                onDelete={deleteMessage}
                onRetry={retryMessage}
                onDiscard={discardMessage}
              />
              <MessageComposer
                conversationId={activeConv.id}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onSend={async (input) => {
                  await sendMessage(input);
                  reload();
                }}
                onTyping={broadcastTyping}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-1">گفتگو را انتخاب کنید</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                از فهرست کناری یک گفتگو انتخاب کنید یا گفتگوی جدیدی آغاز کنید.
              </p>
            </div>
          )}
        </div>

        {/* Details (left in RTL) */}
        {activeConv && detailsOpen && (
          <div className="hidden lg:block">
            <DetailsPanel
              conv={activeConv}
              currentUserId={user.id}
              onlineUserIds={onlineUserIds}
              pins={pins}
              onJumpToMessage={jumpToMessage}
              onUnpin={togglePin}
              onChanged={reload}
              onClose={() => setDetailsOpen(false)}
            />
          </div>
        )}
      </div>

      <NewConversationModal
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => {
          setActive(id);
          reload();
        }}
      />
    </div>
  );
}
