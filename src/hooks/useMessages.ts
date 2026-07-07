import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
    if (!conversationId) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    const list = (data ?? []).slice().reverse();
    const withReads = await attachReads(list as any);
    setMessages(withReads);
    oldestRef.current = list[0]?.created_at ?? null;
    setHasMore((data ?? []).length === PAGE_SIZE);
    setLoading(false);
  }, [conversationId, attachReads]);

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
    const withReads = await attachReads(list as any);
    setMessages((prev) => [...withReads, ...prev]);
    if (list.length > 0) oldestRef.current = list[0].created_at;
    if ((data ?? []).length < PAGE_SIZE) setHasMore(false);
  }, [conversationId, hasMore, attachReads]);

  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    oldestRef.current = null;
    if (conversationId) loadInitial();
  }, [conversationId, loadInitial]);

  // Realtime new messages + read receipts
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Omit<ChatMessage, 'read_by'>;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, { ...m, read_by: [] }]));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Omit<ChatMessage, 'read_by'>;
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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (input: {
      body?: string | null;
      attachment_url?: string | null;
      attachment_name?: string | null;
      attachment_mime?: string | null;
      attachment_size?: number | null;
    }) => {
      if (!user || !conversationId) return;
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: input.body ?? null,
        attachment_url: input.attachment_url ?? null,
        attachment_name: input.attachment_name ?? null,
        attachment_mime: input.attachment_mime ?? null,
        attachment_size: input.attachment_size ?? null,
      });
      if (error) throw error;
    },
    [user, conversationId],
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

  return { messages, loading, hasMore, loadOlder, sendMessage, markRead };
}
