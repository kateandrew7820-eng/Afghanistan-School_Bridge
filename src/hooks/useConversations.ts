import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cacheConversations, readCachedConversations } from '@/lib/chat/offlineStore';

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
    const cached = await readCachedConversations(user.id).catch((error: unknown) => {
      console.error('Could not read cached conversations:', error);
      return [];
    });
    if (cached.length > 0) {
      setConversations(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data: myMemberships, error: membershipError } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);
      if (membershipError) throw membershipError;
      const convIds = (myMemberships ?? []).map((m) => m.conversation_id);
      if (convIds.length === 0) {
        setConversations([]);
        await cacheConversations(user.id, []);
        return;
      }
      const readMap = new Map((myMemberships ?? []).map((m) => [m.conversation_id, m.last_read_at]));

      const { data: convs, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('last_message_at', { ascending: false });
      if (conversationError) throw conversationError;

      const { data: allMembers, error: membersError } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id, role, last_read_at')
        .in('conversation_id', convIds);
      if (membersError) throw membersError;

      const memberUserIds = Array.from(new Set((allMembers ?? []).map((member) => member.user_id)));
      const { data: profiles, error: profilesError } = await supabase.rpc('get_chat_member_profiles', {
        _user_ids: memberUserIds,
      });
      if (profilesError) throw profilesError;
      const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));

      const { data: recentMsgs, error: messagesError } = await supabase
        .from('messages')
        .select('id, conversation_id, body, sender_id, attachment_name, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(convIds.length * 5);
      if (messagesError) throw messagesError;
      const lastMsgMap = new Map<string, ConversationSummary['last_message']>();
      for (const message of recentMsgs ?? []) {
        if (!lastMsgMap.has(message.conversation_id)) lastMsgMap.set(message.conversation_id, message);
      }

      const unreadMap = new Map<string, number>();
      await Promise.all(convIds.map(async (conversationId) => {
        const lastRead = readMap.get(conversationId) ?? '1970-01-01';
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .gt('created_at', lastRead);
        if (error) throw error;
        unreadMap.set(conversationId, count ?? 0);
      }));

      const built: ConversationSummary[] = (convs ?? []).map((conversation) => ({
        id: conversation.id,
        type: conversation.type as 'direct' | 'group',
        title: conversation.title,
        avatar_url: conversation.avatar_url,
        last_message_at: conversation.last_message_at,
        created_by: conversation.created_by,
        members: (allMembers ?? [])
          .filter((member) => member.conversation_id === conversation.id)
          .map((member) => ({
            user_id: member.user_id,
            role: member.role as 'member' | 'admin',
            last_read_at: member.last_read_at,
            full_name: profileMap.get(member.user_id)?.full_name ?? null,
            avatar_url: null,
          })),
        last_message: lastMsgMap.get(conversation.id) ?? null,
        unread_count: unreadMap.get(conversation.id) ?? 0,
      }));
      setConversations(built);
      await cacheConversations(user.id, built);
    } catch (error) {
      console.error('Could not load conversations:', error);
      if (cached.length === 0) setConversations([]);
    } finally {
      setLoading(false);
    }
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
