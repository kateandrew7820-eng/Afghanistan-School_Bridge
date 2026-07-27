import { Info, Phone, Video, ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAvatar } from './ChatAvatar';
import type { ConversationSummary } from '@/hooks/useConversations';
import type { PinnedItem } from '@/hooks/usePins';

interface Props {
  conv: ConversationSummary;
  currentUserId: string;
  onlineUserIds: Set<string>;
  onToggleDetails: () => void;
  onBack: () => void;
  pins: PinnedItem[];
  onJumpToPin: (messageId: string) => void;
}

export function ChatHeader({
  conv,
  currentUserId,
  onlineUserIds,
  onToggleDetails,
  onBack,
  pins,
  onJumpToPin,
}: Props) {
  const name =
    conv.type === 'group'
      ? conv.title || 'گفتگوی گروهی'
      : conv.members.find((m) => m.user_id !== currentUserId)?.full_name || 'گفتگو';

  const otherOnline =
    conv.type === 'direct'
      ? conv.members.some((m) => m.user_id !== currentUserId && onlineUserIds.has(m.user_id))
      : false;

  const subtitle =
    conv.type === 'group' ? `${conv.members.length} عضو` : otherOnline ? 'آنلاین' : 'آفلاین';

  const topPin = pins[0];

  return (
    <div className="shrink-0 border-b border-border bg-card">
      <div className="h-14 flex items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={onBack}
            aria-label="بازگشت به فهرست گفتگوها"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <ChatAvatar name={name} type={conv.type} online={otherOnline} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hidden md:inline-flex"
            aria-label="تماس ویدیویی"
            disabled
          >
            <Video className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hidden md:inline-flex"
            aria-label="تماس صوتی"
            disabled
          >
            <Phone className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleDetails} aria-label="جزئیات">
            <Info className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {topPin?.message && (
        <button
          onClick={() => onJumpToPin(topPin.message_id)}
          className="w-full text-right flex items-center gap-2 px-4 py-2 border-t border-border bg-muted/40 hover:bg-muted"
        >
          <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[11px] text-muted-foreground shrink-0">پیام سنجاق‌شده:</span>
          <span className="text-xs truncate flex-1">
            {topPin.message.body?.trim() || topPin.message.attachment_name || 'پیام'}
          </span>
          {pins.length > 1 && (
            <span className="text-[10px] text-muted-foreground shrink-0">+{pins.length - 1}</span>
          )}
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      )}
    </div>
  );
}
