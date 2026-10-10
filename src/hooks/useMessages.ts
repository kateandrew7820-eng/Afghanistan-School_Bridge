import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  cacheChatMessages,
  listQueuedChatMessages,
  readCachedChatMessages,
  queueChatMessage,
  queuedMessageToChatMessage,
  retryQueuedChatMessage,
  syncQueuedChatMessages,
} from '@/lib/chat/offlineStore';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  reply_to_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  read_by: string[];
  local_state?: 'pending' | 'failed' | 'synced';
}

const PAGE_SIZE = 50;

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const oldestRef = useRef<string | null>(null);

  const attachReads = useCallback(async (msgs: Omit<ChatMessage, 'read_by'>[]): Promise<ChatMessage[]> => {
    if (msgs.length === 0) return [];
    const { data: reads } = await supabase
      .from('message_reads')
      .select('message_id, user_id')
      .in('message_id', msgs.map((m) => m.id));
    const map = new Map<string, string[]>();
    for (const r of reads ?? []) {
      const arr = map.get(r.message_id) ?? [];
      arr.push(r.user_id);
      map.set(r.message_id, arr);
    }
    return msgs.map((m) => ({ ...m, read_by: map.get(m.id) ?? [] }));
  }, []);

  const loadInitial = useCallback(async () => {
    if (!conversationId || !user) return;
    try {
      const cached = await readCachedChatMessages(user.id, conversationId);
      if (cached.length > 0) setMessages(cached);
    } catch (error) {
      console.error('Could not read cached chat history:', error);
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      const list = (data ?? []).slice().reverse();
      const withReads = await attachReads(list);
      const queued = await listQueuedChatMessages(user.id);
      const pending = queued
        .filter((entry) => entry.conversationId === conversationId && entry.status !== 'synced')
        .map(queuedMessageToChatMessage);
      const merged = [...withReads, ...pending]
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      setMessages(merged);
      await cacheChatMessages(user.id, conversationId, merged);
      oldestRef.current = list[0]?.created_at ?? null;
      setHasMore((data ?? []).length === PAGE_SIZE);
    } catch (error) {
      console.error('Could not load chat history:', error);
      const queued = await listQueuedChatMessages(user.id).catch(() => []);
      setMessages((previous) => {
        const cachedById = new Map(previous.map((message) => [message.id, message]));
        queued
          .filter((entry) => entry.conversationId === conversationId && entry.status !== 'synced')
          .forEach((entry) => cachedById.set(entry.id, queuedMessageToChatMessage(entry)));
        return [...cachedById.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
    } finally {
      setLoading(false);
    }
  }, [conversationId, attachReads, user]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || !oldestRef.current || !hasMore || !user) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .lt('created_at', oldestRef.current)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (error) {
      console.error('Could not load older chat messages:', error);
      return;
    }
    const list = (data ?? []).slice().reverse();
    const withReads = await attachReads(list);
    setMessages((prev) => [...withReads, ...prev]);
    await cacheChatMessages(user.id, conversationId, withReads);
    if (list.length > 0) oldestRef.current = list[0].created_at;
    if ((data ?? []).length < PAGE_SIZE) setHasMore(false);
  }, [conversationId, hasMore, attachReads, user]);

  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    oldestRef.current = null;
    if (conversationId) void loadInitial();
  }, [conversationId, loadInitial]);

  useEffect(() => {
    if (!user || !conversationId) return;
    const refreshQueued = async () => {
      const queued = await listQueuedChatMessages(user.id);
      const localMessages = queued
        .filter((entry) => entry.conversationId === conversationId)
        .map(queuedMessageToChatMessage);
      setMessages((previous) => {
        const merged = new Map(previous.map((message) => [message.id, message]));
        localMessages.forEach((message) => merged.set(message.id, message));
        return [...merged.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
    };
    const sync = () => {
      if (!navigator.onLine) return;
      void syncQueuedChatMessages(user.id).then(refreshQueued).catch((error: unknown) => {
        console.error('Could not sync queued chat messages:', error);
      });
    };
    window.addEventListener('schoolbridge-chat-queue-change', refreshQueued);
    window.addEventListener('online', sync);
    window.addEventListener('focus', sync);
    const interval = window.setInterval(sync, 20_000);
    void refreshQueued();
    sync();
    return () => {
      window.removeEventListener('schoolbridge-chat-queue-change', refreshQueued);
      window.removeEventListener('online', sync);
      window.removeEventListener('focus', sync);
      window.clearInterval(interval);
    };
  }, [conversationId, user]);

  // Realtime new messages + read receipts
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conv:${conversationId}`, { config: { private: true } })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Omit<ChatMessage, 'read_by'>;
          setMessages((prev) => {
            const next = prev.some((message) => message.id === m.id)
              ? prev.map((message) => message.id === m.id ? { ...m, read_by: message.read_by, local_state: undefined } : message)
              : [...prev, { ...m, read_by: [] }];
            if (user) void cacheChatMessages(user.id, conversationId, next);
            return next;
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Omit<ChatMessage, 'read_by'>;
          setMessages((prev) => {
            const next = prev.map((message) => message.id === m.id ? { ...message, ...m } : message);
            if (user) void cacheChatMessages(user.id, conversationId, next);
            return next;
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reads' },
        (payload) => {
          const r = payload.new as { message_id: string; user_id: string };
          setMessages((prev) =>
            prev.map((x) =>
              x.id === r.message_id && !x.read_by.includes(r.user_id)
                ? { ...x, read_by: [...x.read_by, r.user_id] }
                : x,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const sendMessage = useCallback(
    async (input: {
      body?: string | null;
      attachment_url?: string | null;
      attachment_name?: string | null;
      attachment_mime?: string | null;
      attachment_size?: number | null;
      file?: File | null;
    }) => {
      if (!user || !conversationId) return;
      const queued = await queueChatMessage({
        id: crypto.randomUUID(),
        userId: user.id,
        conversationId,
        body: input.body ?? null,
        attachmentName: input.file?.name ?? input.attachment_name ?? null,
        attachmentMime: input.file?.type ?? input.attachment_mime ?? null,
        attachmentSize: input.file?.size ?? input.attachment_size ?? null,
        file: input.file ?? undefined,
        createdAt: new Date().toISOString(),
      });
      const optimistic = queuedMessageToChatMessage(queued);
      setMessages((previous) => [...previous, optimistic]);
      await cacheChatMessages(user.id, conversationId, [...messages, optimistic]);
      if (navigator.onLine) await syncQueuedChatMessages(user.id);
    },
    [user, conversationId, messages],
  );

  const markRead = useCallback(async () => {
    if (!user || !conversationId || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read_by.includes(user.id));
    if (unread.length === 0) {
      // still bump last_read_at
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
      return;
    }
    await supabase
      .from('message_reads')
      .upsert(unread.map((m) => ({ message_id: m.id, user_id: user.id })), {
        onConflict: 'message_id,user_id',
        ignoreDuplicates: true,
      });
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  }, [user, conversationId, messages]);

  const retryMessage = useCallback(async (messageId: string) => {
    if (!user) return;
    await retryQueuedChatMessage(messageId);
    await syncQueuedChatMessages(user.id);
  }, [user]);

  return { messages, loading, hasMore, loadOlder, sendMessage, markRead, retryMessage };
}
