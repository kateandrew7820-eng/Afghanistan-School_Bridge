import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SharedFile {
  message_id: string;
  path: string;
  name: string;
  mime: string;
  size: number | null;
  sender_id: string;
  created_at: string;
}

export function useConversationFiles(conversationId: string | null, enabled = true) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!conversationId || !enabled) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('id, attachment_url, attachment_name, attachment_mime, attachment_size, sender_id, created_at')
      .eq('conversation_id', conversationId)
      .not('attachment_url', 'is', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);
    setFiles(
      (data ?? []).map((m) => ({
        message_id: m.id,
        path: m.attachment_url as string,
        name: m.attachment_name ?? 'فایل',
        mime: m.attachment_mime ?? 'application/octet-stream',
        size: m.attachment_size,
        sender_id: m.sender_id,
        created_at: m.created_at,
      })),
    );
    setLoading(false);
  }, [conversationId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { files, loading, reload: load };
}
