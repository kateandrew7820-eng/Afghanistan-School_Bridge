import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConversationRow } from './ConversationRow';
import type { ConversationSummary } from '@/hooks/useConversations';

interface Props {
  conversations: ConversationSummary[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  loading: boolean;
}

type Filter = 'all' | 'unread' | 'group' | 'direct';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'unread', label: 'خوانده نشده' },
  { key: 'group', label: 'گروه‌ها' },
  { key: 'direct', label: 'مستقیم' },
];

export function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onNewConversation,
  loading,
}: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === 'unread' && c.unread_count === 0) return false;
      if (filter === 'group' && c.type !== 'group') return false;
      if (filter === 'direct' && c.type !== 'direct') return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const title = c.type === 'group'
          ? (c.title || '')
          : (c.members.find((m) => m.user_id !== currentUserId)?.full_name || '');
        if (!title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [conversations, filter, search, currentUserId]);

  return (
    <div className="flex flex-col h-full bg-card border-s border-border">
      <div className="p-3 space-y-3 border-b border-border">
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در گفتگوها…"
            className="ps-3 pe-9 h-9"
          />
        </div>
        <Button onClick={onNewConversation} className="w-full gap-2 h-10">
          <Plus className="h-4 w-4" />
          گفتگوی جدید
        </Button>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors',
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">در حال بارگیری…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {search ? 'نتیجه‌ای یافت نشد' : 'هنوز گفتگویی ندارید'}
          </div>
        ) : (
          filtered.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              active={c.id === activeId}
              currentUserId={currentUserId}
              onClick={() => onSelect(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
