import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ConversationSummary {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  avatar_url: string | null;
  last_message_at: string;
  created_by: string;
  members: {
    user_id: string;
    role: 'member' | 'admin';
    last_read_at: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  last_message: {
    id: string;
    body: string | null;
    sender_id: string;
    attachment_name: string | null;
    created_at: string;
  } | null;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Get my memberships
    const { data: myMemberships } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);
    const convIds = (myMemberships ?? []).map((m) => m.conversation_id);
    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }
    const readMap = new Map(
      (myMemberships ?? []).map((m) => [m.conversation_id, m.last_read_at]),
    );

    // 2. Fetch conversations
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('last_message_at', { ascending: false });

    // 3. Fetch all members of those conversations
    const { data: allMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id, role, last_read_at')
      .in('conversation_id', convIds);

    // 4. Fetch profiles for member user_ids
    const memberUserIds = Array.from(
      new Set((allMembers ?? []).map((m) => m.user_id)),
    );
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', memberUserIds);
    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p]),
    );

    // 5. Latest message per conversation (last 1 each)
    const { data: recentMsgs } = await supabase
      .from('messages')
      .select('id, conversation_id, body, sender_id, attachment_name, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
      .limit(convIds.length * 5);
    const lastMsgMap = new Map<string, ConversationSummary['last_message']>();
    for (const m of recentMsgs ?? []) {
      if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m);
    }

    // 6. Unread counts
    const unreadMap = new Map<string, number>();
    await Promise.all(
      convIds.map(async (cid) => {
        const lastRead = readMap.get(cid) ?? '1970-01-01';
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', cid)
          .neq('sender_id', user.id)
          .gt('created_at', lastRead);
        unreadMap.set(cid, count ?? 0);
      }),
    );

    const built: ConversationSummary[] = (convs ?? []).map((c) => {
      const members = (allMembers ?? [])
        .filter((m) => m.conversation_id === c.id)
        .map((m) => {
          const p = profileMap.get(m.user_id);
          return {
            user_id: m.user_id,
            role: m.role as 'member' | 'admin',
            last_read_at: m.last_read_at,
            full_name: p?.full_name ?? null,
            avatar_url: null,
          };
        });
      return {
        id: c.id,
        type: c.type as 'direct' | 'group',
        title: c.title,
        avatar_url: c.avatar_url,
        last_message_at: c.last_message_at,
        created_by: c.created_by,
        members,
        last_message: lastMsgMap.get(c.id) ?? null,
        unread_count: unreadMap.get(c.id) ?? 0,
      };
    });
    setConversations(built);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refresh on new messages / new memberships
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conversations:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  return { conversations, loading, reload: load, totalUnread };
}
