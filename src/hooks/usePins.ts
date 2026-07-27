import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PinnedItem {
  id: string;
  message_id: string;
  pinned_by: string;
  created_at: string;
  message: {
    id: string;
    sender_id: string;
    body: string | null;
    attachment_name: string | null;
    created_at: string;
  } | null;
}

export function usePins(conversationId: string | null) {
  const { user } = useAuth();
  const [pins, setPins] = useState<PinnedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!conversationId) {
      setPins([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('pinned_messages')
      .select('id, message_id, pinned_by, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    const rows = data ?? [];
    let msgMap = new Map<string, PinnedItem['message']>();
    if (rows.length > 0) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, sender_id, body, attachment_name, created_at')
        .in('id', rows.map((r) => r.message_id));
      msgMap = new Map((msgs ?? []).map((m) => [m.id, m]));
    }
    setPins(rows.map((r) => ({ ...r, message: msgMap.get(r.message_id) ?? null })));
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`pins:${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pinned_messages', filter: `conversation_id=eq.${conversationId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, load]);

  const isPinned = useCallback(
    (messageId: string) => pins.some((p) => p.message_id === messageId),
    [pins],
  );

  const togglePin = useCallback(
    async (messageId: string) => {
      if (!user || !conversationId) return;
      const existing = pins.find((p) => p.message_id === messageId);
      if (existing) {
        await supabase.from('pinned_messages').delete().eq('id', existing.id);
      } else {
        await supabase.from('pinned_messages').insert({
          conversation_id: conversationId,
          message_id: messageId,
          pinned_by: user.id,
        });
      }
      load();
    },
    [user, conversationId, pins, load],
  );

  return { pins, loading, isPinned, togglePin, reload: load };
}
