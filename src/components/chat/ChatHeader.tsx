import { Info, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAvatar } from './ChatAvatar';
import type { ConversationSummary } from '@/hooks/useConversations';

interface Props {
  conv: ConversationSummary;
  currentUserId: string;
  onlineUserIds: Set<string>;
  onToggleDetails: () => void;
}

export function ChatHeader({ conv, currentUserId, onlineUserIds, onToggleDetails }: Props) {
  const name =
    conv.type === 'group'
      ? conv.title || 'گفتگوی گروهی'
      : conv.members.find((m) => m.user_id !== currentUserId)?.full_name || 'گفتگو';
  const subtitle =
    conv.type === 'group'
      ? `${conv.members.length} عضو`
      : conv.members.find((m) => m.user_id !== currentUserId && onlineUserIds.has(m.user_id))
        ? 'آنلاین'
        : 'آفلاین';

  const otherOnline =
    conv.type === 'direct'
      ? conv.members.some((m) => m.user_id !== currentUserId && onlineUserIds.has(m.user_id))
      : false;

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <ChatAvatar name={name} type={conv.type} online={otherOnline} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="تماس ویدیویی" disabled>
          <Video className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="تماس صوتی" disabled>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleDetails} aria-label="جزئیات">
          <Info className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
