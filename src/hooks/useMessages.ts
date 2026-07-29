import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReplyTarget {
  id: string;
  sender_id: string;
  body: string | null;
  attachment_name: string | null;
}

export interface MessageReaction {
  emoji: string;
  user_ids: string[];
}

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
  reactions: MessageReaction[];
  reply_to?: ReplyTarget | null;
  /** local-only: optimistic message not yet confirmed by the server */
  pending?: boolean;
  /** local-only: send failed, can be retried */
  failed?: boolean;
  /** local-only: stable key for optimistic rows */
  client_id?: string;
}

export interface SendInput {
  body?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  attachment_size?: number | null;
  reply_to_id?: string | null;
}

const PAGE_SIZE = 50;
const EMPTY_ROW = {
  attachment_url: null,
  attachment_name: null,
  attachment_mime: null,
  attachment_size: null,
};

function toReplyTarget(m: { id: string; sender_id: string; body: string | null; attachment_name: string | null }): ReplyTarget {
  return { id: m.id, sender_id: m.sender_id, body: m.body, attachment_name: m.attachment_name };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const oldestRef = useRef<string | null>(null);

  /** Attach read receipts, reactions and reply previews to a raw batch of rows. */
  const hydrate = useCallback(
    async (rows: any[]): Promise<ChatMessage[]> => {
      if (rows.length === 0) return [];
      const ids = rows.map((m) => m.id);
      const replyIds = Array.from(
        new Set(rows.map((m) => m.reply_to_id).filter(Boolean) as string[]),
      );

      const [readsRes, reactionsRes, repliesRes] = await Promise.all([
        supabase.from('message_reads').select('message_id, user_id').in('message_id', ids),
        supabase.from('message_reactions').select('message_id, user_id, emoji').in('message_id', ids),
        replyIds.length
          ? supabase.from('messages').select('id, sender_id, body, attachment_name').in('id', replyIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const readMap = new Map<string, string[]>();
      for (const r of readsRes.data ?? []) {
        readMap.set(r.message_id, [...(readMap.get(r.message_id) ?? []), r.user_id]);
      }
      const reactionMap = new Map<string, MessageReaction[]>();
      for (const r of reactionsRes.data ?? []) {
        const list = reactionMap.get(r.message_id) ?? [];
        const found = list.find((x) => x.emoji === r.emoji);
        if (found) found.user_ids.push(r.user_id);
        else list.push({ emoji: r.emoji, user_ids: [r.user_id] });
        reactionMap.set(r.message_id, list);
      }
      const replyMap = new Map<string, ReplyTarget>();
      for (const r of repliesRes.data ?? []) replyMap.set(r.id, toReplyTarget(r as any));

      return rows.map((m) => ({
        ...m,
        read_by: readMap.get(m.id) ?? [],
        reactions: reactionMap.get(m.id) ?? [],
        reply_to: m.reply_to_id ? replyMap.get(m.reply_to_id) ?? null : null,
      }));
    },
    [],
  );

  const loadInitial = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (error) {
      setLoadError('بارگیری پیام‌ها ناموفق بود');
      setLoading(false);
      return;
    }
    const list = (data ?? []).slice().reverse();
    setMessages(await hydrate(list));
    oldestRef.current = list[0]?.created_at ?? null;
    setHasMore((data ?? []).length === PAGE_SIZE);
    setLoading(false);
  }, [conversationId, hydrate]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || !oldestRef.current || !hasMore) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .lt('created_at', oldestRef.current)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    const list = (data ?? []).slice().reverse();
    const hydrated = await hydrate(list);
    setMessages((prev) => [...hydrated, ...prev]);
    if (list.length > 0) oldestRef.current = list[0].created_at;
    if ((data ?? []).length < PAGE_SIZE) setHasMore(false);
  }, [conversationId, hasMore, hydrate]);

  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setLoadError(null);
    oldestRef.current = null;
    if (conversationId) loadInitial();
  }, [conversationId, loadInitial]);

  // Realtime: messages, read receipts, reactions
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const m = payload.new as any;
          const [hydrated] = await hydrate([m]);
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            // reconcile the optimistic row by its client_id
            const optimisticIdx = m.client_id
              ? prev.findIndex((x) => x.client_id === m.client_id)
              : -1;
            if (optimisticIdx >= 0) {
              const next = prev.slice();
              next[optimisticIdx] = hydrated;
              return next;
            }
            return [...prev, hydrated];
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as any;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { message_id: string; user_id: string; emoji: string };
          const added = payload.eventType === 'INSERT';
          setMessages((prev) =>
            prev.map((x) => {
              if (x.id !== row.message_id) return x;
              const list = x.reactions.map((r) => ({ ...r, user_ids: [...r.user_ids] }));
              const found = list.find((r) => r.emoji === row.emoji);
              if (added) {
                if (found) {
                  if (!found.user_ids.includes(row.user_id)) found.user_ids.push(row.user_id);
                } else {
                  list.push({ emoji: row.emoji, user_ids: [row.user_id] });
                }
              } else if (found) {
                found.user_ids = found.user_ids.filter((u) => u !== row.user_id);
              }
              return { ...x, reactions: list.filter((r) => r.user_ids.length > 0) };
            }),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, hydrate]);

  const persist = useCallback(
    async (input: SendInput, clientId: string) => {
      if (!user || !conversationId) return;
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        client_id: clientId,
        body: input.body ?? null,
        attachment_url: input.attachment_url ?? null,
        attachment_name: input.attachment_name ?? null,
        attachment_mime: input.attachment_mime ?? null,
        attachment_size: input.attachment_size ?? null,
        reply_to_id: input.reply_to_id ?? null,
      });
      // 23505: the row already landed (duplicate retry) — treat as success
      if (error && (error as { code?: string }).code !== '23505') {
        setMessages((prev) =>
          prev.map((m) => (m.client_id === clientId ? { ...m, pending: false, failed: true } : m)),
        );
        throw error;
      }
    },
    [user, conversationId],
  );


  const sendMessage = useCallback(
    async (input: SendInput & { reply_to?: ReplyTarget | null }) => {
      if (!user || !conversationId) return;
      const clientId = crypto.randomUUID();
      const optimistic: ChatMessage = {
        id: clientId,
        client_id: clientId,
        conversation_id: conversationId,
        sender_id: user.id,
        body: input.body ?? null,
        ...EMPTY_ROW,
        attachment_url: input.attachment_url ?? null,
        attachment_name: input.attachment_name ?? null,
        attachment_mime: input.attachment_mime ?? null,
        attachment_size: input.attachment_size ?? null,
        reply_to_id: input.reply_to_id ?? null,
        reply_to: input.reply_to ?? null,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        read_by: [],
        reactions: [],
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      await persist(input, clientId);
    },
    [user, conversationId, persist],
  );

  const retryMessage = useCallback(
    async (clientId: string) => {
      const target = messages.find((m) => m.client_id === clientId);
      if (!target) return;
      setMessages((prev) =>
        prev.map((m) => (m.client_id === clientId ? { ...m, pending: true, failed: false } : m)),
      );
      await persist(
        {
          body: target.body,
          attachment_url: target.attachment_url,
          attachment_name: target.attachment_name,
          attachment_mime: target.attachment_mime,
          attachment_size: target.attachment_size,
          reply_to_id: target.reply_to_id,
        },
        clientId,
      );
    },
    [messages, persist],
  );

  const discardMessage = useCallback((clientId: string) => {
    setMessages((prev) => {
      const target = prev.find((m) => m.client_id === clientId);
      // the upload already landed in storage but the message never will — clean it up
      if (target?.attachment_url) void removeChatAttachment(target.attachment_url);
      return prev.filter((m) => m.client_id !== clientId);
    });
  }, []);

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString(), body: null })
        .eq('id', messageId);
      if (error) throw error;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted_at: new Date().toISOString(), body: null } : m)),
      );
    },
    [],
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user || !conversationId) return;
      const msg = messages.find((m) => m.id === messageId);
      const mine = msg?.reactions.find((r) => r.emoji === emoji)?.user_ids.includes(user.id);
      if (mine) {
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
      } else {
        await supabase.from('message_reactions').insert({
          message_id: messageId,
          conversation_id: conversationId,
          user_id: user.id,
          emoji,
        });
      }
    },
    [user, conversationId, messages],
  );

  const markRead = useCallback(async () => {
    if (!user || !conversationId || messages.length === 0) return;
    const unread = messages.filter(
      (m) => !m.pending && m.sender_id !== user.id && !m.read_by.includes(user.id),
    );
    if (unread.length > 0) {
      await supabase
        .from('message_reads')
        .upsert(unread.map((m) => ({ message_id: m.id, user_id: user.id })), {
          onConflict: 'message_id,user_id',
          ignoreDuplicates: true,
        });
    }
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  }, [user, conversationId, messages]);

  return {
    messages,
    loading,
    loadError,
    hasMore,
    loadOlder,
    reload: loadInitial,
    sendMessage,
    retryMessage,
    discardMessage,
    deleteMessage,
    toggleReaction,
    markRead,
  };
}
