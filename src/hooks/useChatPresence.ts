import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceState {
  onlineUserIds: Set<string>;
  typingUserIds: Set<string>;
}

export function useChatPresence(conversationId: string | null) {
  const { user } = useAuth();
  const [state, setState] = useState<PresenceState>({
    onlineUserIds: new Set(),
    typingUserIds: new Set(),
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastBroadcastRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !conversationId) return;

    const channel = supabase.channel(`presence:${conversationId}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const s = channel.presenceState();
        setState((prev) => ({ ...prev, onlineUserIds: new Set(Object.keys(s)) }));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const uid = payload?.userId as string;
        if (!uid || uid === user.id) return;
        setState((prev) => {
          const next = new Set(prev.typingUserIds);
          next.add(uid);
          return { ...prev, typingUserIds: next };
        });
        const old = typingTimeouts.current.get(uid);
        if (old) clearTimeout(old);
        const t = setTimeout(() => {
          setState((prev) => {
            const next = new Set(prev.typingUserIds);
            next.delete(uid);
            return { ...prev, typingUserIds: next };
          });
          typingTimeouts.current.delete(uid);
        }, 3500);
        typingTimeouts.current.set(uid, t);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      typingTimeouts.current.forEach((t) => clearTimeout(t));
      typingTimeouts.current.clear();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, conversationId]);

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    const now = Date.now();
    if (now - lastBroadcastRef.current < 2000) return;
    lastBroadcastRef.current = now;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id },
    });
  }, [user]);

  return { onlineUserIds: state.onlineUserIds, typingUserIds: state.typingUserIds, broadcastTyping };
}
