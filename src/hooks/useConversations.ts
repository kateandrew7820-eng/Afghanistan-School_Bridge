import { useCallback, useEffect, useRef, useState } from 'react';
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
    platform_role: string | null;
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

function sortByRecency(list: ConversationSummary[]): ConversationSummary[] {
  return list
    .slice()
    .sort((a, b) => (a.last_message_at < b.last_message_at ? 1 : -1));
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  /** conversation ids the user belongs to — used to filter realtime traffic */
  const memberOfRef = useRef<Set<string>>(new Set());
  /** the conversation currently open, so its unread count stays at zero */
  const activeRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setConversations([]);
      memberOfRef.current = new Set();
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
    memberOfRef.current = new Set(convIds);
    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // 2. Conversations, members, unread counts in parallel
    const [convsRes, membersRes, unreadRes] = await Promise.all([
      supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('last_message_at', { ascending: false }),
      supabase
        .from('conversation_members')
        .select('conversation_id, user_id, role, last_read_at')
        .in('conversation_id', convIds),
      supabase.rpc('chat_unread_counts'),
    ]);
    const convs = convsRes.data ?? [];
    const allMembers = membersRes.data ?? [];
    const unreadMap = new Map<string, number>(
      (unreadRes.data ?? []).map((r) => [r.conversation_id, r.unread_count]),
    );

    // 3. Profiles for member user_ids
    const memberUserIds = Array.from(new Set(allMembers.map((m) => m.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, role')
      .in('user_id', memberUserIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    // 4. Latest message per conversation
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

    const built: ConversationSummary[] = convs.map((c) => {
      const members = allMembers
        .filter((m) => m.conversation_id === c.id)
        .map((m) => {
          const p = profileMap.get(m.user_id);
          return {
            user_id: m.user_id,
            role: m.role as 'member' | 'admin',
            last_read_at: m.last_read_at,
            full_name: p?.full_name ?? null,
            avatar_url: null,
            platform_role: (p as { role?: string } | undefined)?.role ?? null,
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
    setConversations(sortByRecency(built));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /** Called by the chat view so the open conversation never shows unread. */
  const setActiveConversation = useCallback((id: string | null) => {
    activeRef.current = id;
    if (!id) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );
  }, []);

  const markConversationRead = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );
  }, []);

  // Realtime: patch local state instead of refetching everything
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conversations:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as {
            id: string;
            conversation_id: string;
            body: string | null;
            sender_id: string;
            attachment_name: string | null;
            created_at: string;
          };
          // ignore traffic from conversations the user is not a member of
          if (!memberOfRef.current.has(m.conversation_id)) return;
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === m.conversation_id);
            if (idx < 0) return prev;
            const target = prev[idx];
            const isMine = m.sender_id === user.id;
            const isActive = activeRef.current === m.conversation_id;
            const next = prev.slice();
            next[idx] = {
              ...target,
              last_message_at: m.created_at,
              last_message: {
                id: m.id,
                body: m.body,
                sender_id: m.sender_id,
                attachment_name: m.attachment_name,
                created_at: m.created_at,
              },
              unread_count:
                isMine || isActive ? target.unread_count : target.unread_count + 1,
            };
            return sortByRecency(next);
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          const c = payload.new as {
            id: string;
            title: string | null;
            avatar_url: string | null;
            last_message_at: string;
          };
          if (!memberOfRef.current.has(c.id)) return;
          setConversations((prev) =>
            sortByRecency(
              prev.map((x) =>
                x.id === c.id
                  ? {
                      ...x,
                      title: c.title,
                      avatar_url: c.avatar_url,
                      last_message_at: c.last_message_at,
                    }
                  : x,
              ),
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        // joining or leaving a conversation changes the list itself
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  return {
    conversations,
    loading,
    reload: load,
    totalUnread,
    setActiveConversation,
    markConversationRead,
  };
}
