import { useMemo, useState } from 'react';
import { X, Users, Paperclip, Pin, Pencil, Check, UserPlus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatAvatar } from './ChatAvatar';
import { AddMembersDialog } from './AddMembersDialog';
import { cn } from '@/lib/utils';
import { getRoleLabelFA } from '@/lib/permissions';
import { humanFileSize, getAttachmentUrl } from '@/lib/chat/attachments';
import { relativeTimeFa } from '@/lib/chat/format';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConversationFiles } from '@/hooks/useConversationFiles';
import type { ConversationSummary } from '@/hooks/useConversations';
import type { PinnedItem } from '@/hooks/usePins';

interface Props {
  conv: ConversationSummary;
  currentUserId: string;
  onlineUserIds: Set<string>;
  pins: PinnedItem[];
  onJumpToMessage: (id: string) => void;
  onUnpin: (messageId: string) => void;
  onChanged: () => void;
  onClose: () => void;
}

type Tab = 'members' | 'files' | 'pinned';

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'members', label: 'اعضا', icon: Users },
  { key: 'files', label: 'فایل‌ها', icon: Paperclip },
  { key: 'pinned', label: 'سنجاق‌شده', icon: Pin },
];

export function DetailsPanel({
  conv,
  currentUserId,
  onlineUserIds,
  pins,
  onJumpToMessage,
  onUnpin,
  onChanged,
  onClose,
}: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('members');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(conv.title ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const { files, loading: filesLoading } = useConversationFiles(conv.id, tab === 'files');

  const isGroup = conv.type === 'group';
  const isAdmin = useMemo(
    () => conv.members.some((m) => m.user_id === currentUserId && m.role === 'admin'),
    [conv.members, currentUserId],
  );

  const name = isGroup
    ? conv.title || 'گفتگوی گروهی'
    : conv.members.find((m) => m.user_id !== currentUserId)?.full_name || 'گفتگو';

  const saveTitle = async () => {
    const next = titleDraft.trim();
    if (!next) return;
    const { error } = await supabase.from('conversations').update({ title: next }).eq('id', conv.id);
    if (error) {
      toast({ title: 'تغییر نام ناموفق بود', description: error.message, variant: 'destructive' });
      return;
    }
    setEditingTitle(false);
    onChanged();
  };

  const removeMember = async (userId: string) => {
    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conv.id)
      .eq('user_id', userId);
    if (error) {
      toast({ title: 'حذف عضو ناموفق بود', description: error.message, variant: 'destructive' });
      return;
    }
    onChanged();
  };

  const openFile = async (path: string) => {
    try {
      const url = await getAttachmentUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast({ title: 'باز کردن فایل ناموفق بود', variant: 'destructive' });
    }
  };

  return (
    <div className="w-[300px] h-full flex flex-col bg-card border-e border-border">
      <div className="h-14 shrink-0 flex items-center justify-between px-3 border-b border-border">
        <span className="text-sm font-semibold">جزئیات گفتگو</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="بستن">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 flex flex-col items-center gap-2 border-b border-border">
        <ChatAvatar name={name} type={conv.type} size="lg" />
        {isGroup && editingTitle ? (
          <div className="flex items-center gap-1 w-full">
            <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} className="h-8 text-sm" />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={saveTitle} aria-label="ذخیره نام">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-center">{name}</p>
            {isGroup && isAdmin && (
              <button
                onClick={() => {
                  setTitleDraft(conv.title ?? '');
                  setEditingTitle(true);
                }}
                aria-label="تغییر نام گروه"
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          {isGroup ? `${conv.members.length} عضو` : 'گفتگوی مستقیم'}
        </p>
      </div>

      <div className="flex items-center border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {tab === 'members' && (
          <div className="space-y-1">
            {isGroup && isAdmin && (
              <Button variant="outline" className="w-full gap-2 h-9 mb-2" onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4" />
                افزودن عضو
              </Button>
            )}
            {conv.members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted">
                <ChatAvatar
                  name={m.full_name}
                  type="direct"
                  size="sm"
                  online={onlineUserIds.has(m.user_id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">
                    {m.full_name || 'کاربر'}
                    {m.user_id === currentUserId && ' (شما)'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {getRoleLabelFA((m.platform_role as any) ?? null)}
                    {m.role === 'admin' && ' • مدیر گروه'}
                  </p>
                </div>
                {isGroup && isAdmin && m.user_id !== currentUserId && (
                  <button
                    onClick={() => removeMember(m.user_id)}
                    aria-label="حذف عضو"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'files' && (
          <div className="space-y-1">
            {filesLoading ? (
              <p className="text-center text-xs text-muted-foreground py-8">در حال بارگیری…</p>
            ) : files.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">فایلی به اشتراک گذاشته نشده</p>
            ) : (
              files.map((f) => (
                <button
                  key={f.message_id}
                  onClick={() => openFile(f.path)}
                  className="w-full text-right flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {f.size ? humanFileSize(f.size) : ''} • {relativeTimeFa(f.created_at)}
                    </p>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'pinned' && (
          <div className="space-y-1">
            {pins.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">پیام سنجاق‌شده‌ای نیست</p>
            ) : (
              pins.map((p) => (
                <div key={p.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-muted">
                  <button onClick={() => onJumpToMessage(p.message_id)} className="flex-1 min-w-0 text-right">
                    <p className="text-xs line-clamp-2">
                      {p.message?.body?.trim() || p.message?.attachment_name || 'پیام'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {relativeTimeFa(p.created_at)}
                    </p>
                  </button>
                  <button
                    onClick={() => onUnpin(p.message_id)}
                    aria-label="برداشتن سنجاق"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <AddMembersDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        conversationId={conv.id}
        existingUserIds={conv.members.map((m) => m.user_id)}
        onAdded={onChanged}
      />
    </div>
  );
}
