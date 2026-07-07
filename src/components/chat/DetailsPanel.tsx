import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAvatar } from './ChatAvatar';
import type { ConversationSummary } from '@/hooks/useConversations';

interface Props {
  conv: ConversationSummary;
  currentUserId: string;
  onlineUserIds: Set<string>;
  onClose: () => void;
}

const ROLE_FA: Record<string, string> = {
  admin: 'مدیر',
  member: 'عضو',
};

export function DetailsPanel({ conv, currentUserId, onlineUserIds, onClose }: Props) {
  const isGroup = conv.type === 'group';
  const name = isGroup
    ? conv.title || 'گفتگوی گروهی'
    : conv.members.find((m) => m.user_id !== currentUserId)?.full_name || 'گفتگو';

  return (
    <aside className="w-full lg:w-[300px] h-full bg-card border-e border-border flex flex-col shrink-0">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <h2 className="text-sm font-semibold">جزئیات گفتگو</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="بستن">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-2 py-6 border-b border-border">
          <ChatAvatar name={name} type={conv.type} size="lg" />
          <p className="text-sm font-semibold text-center">{name}</p>
          <p className="text-[11px] text-muted-foreground">
            {isGroup ? `گروه • ${conv.members.length} عضو` : 'گفتگوی مستقیم'}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            اعضا ({conv.members.length})
          </p>
          <div className="space-y-1">
            {conv.members.map((m) => {
              const online = onlineUserIds.has(m.user_id);
              return (
                <div key={m.user_id} className="flex items-center gap-3 py-2 px-1">
                  <ChatAvatar name={m.full_name} type="direct" size="sm" online={online} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {m.full_name || 'کاربر'}
                      {m.user_id === currentUserId && (
                        <span className="text-[10px] text-muted-foreground ms-1">(شما)</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{ROLE_FA[m.role] ?? m.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
