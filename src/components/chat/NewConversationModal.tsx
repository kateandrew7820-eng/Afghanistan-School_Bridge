import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChatAvatar } from './ChatAvatar';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (conversationId: string) => void;
}

interface UserRow {
  user_id: string;
  full_name: string | null;
  role: string | null;
}

export function NewConversationModal({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupTitle, setGroupTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('user_id, full_name, role')
      .eq('status', 'verified')
      .neq('user_id', user.id)
      .order('full_name', { ascending: true })
      .limit(200)
      .then(({ data }) => {
        setUsers((data ?? []) as UserRow[]);
        setLoading(false);
      });
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelected(new Set());
      setGroupTitle('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.full_name || '').toLowerCase().includes(q));
  }, [users, search]);

  const toggle = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const isGroup = selected.size > 1;

  const create = async () => {
    if (!user || selected.size === 0) return;
    setCreating(true);
    try {
      // For direct: check for existing 1-1 conversation
      if (!isGroup) {
        const otherId = Array.from(selected)[0];
        const { data: mine } = await supabase
          .from('conversation_members')
          .select('conversation_id, conversations!inner(type)')
          .eq('user_id', user.id);
        const directIds = (mine ?? [])
          .filter((r: any) => r.conversations?.type === 'direct')
          .map((r) => r.conversation_id);
        if (directIds.length > 0) {
          const { data: others } = await supabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', otherId)
            .in('conversation_id', directIds);
          const existing = others?.[0]?.conversation_id;
          if (existing) {
            onCreated(existing);
            onOpenChange(false);
            return;
          }
        }
      }

      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({
          type: isGroup ? 'group' : 'direct',
          title: isGroup ? (groupTitle.trim() || null) : null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error || !conv) throw error;

      const members = [
        { conversation_id: conv.id, user_id: user.id, role: 'admin' as const },
        ...Array.from(selected).map((uid) => ({
          conversation_id: conv.id,
          user_id: uid,
          role: 'member' as const,
        })),
      ];
      const { error: mErr } = await supabase.from('conversation_members').insert(members);
      if (mErr) throw mErr;

      onCreated(conv.id);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'ایجاد گفتگو ناموفق بود', description: err?.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>گفتگوی جدید</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی کاربران…"
              className="ps-3 pe-9"
            />
          </div>
          {isGroup && (
            <Input
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="نام گروه (اختیاری)"
            />
          )}
          <div className="max-h-72 overflow-y-auto space-y-1 border border-border rounded-lg p-1">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-6">در حال بارگیری…</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">کاربری یافت نشد</p>
            ) : (
              filtered.map((u) => {
                const on = selected.has(u.user_id);
                return (
                  <button
                    key={u.user_id}
                    onClick={() => toggle(u.user_id)}
                    className={cn(
                      'w-full text-right flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      on ? 'bg-primary/10' : 'hover:bg-muted',
                    )}
                  >
                    <ChatAvatar name={u.full_name} type="direct" size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{u.full_name || 'کاربر'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.role || ''}</p>
                    </div>
                    {on && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>لغو</Button>
          <Button disabled={selected.size === 0 || creating} onClick={create}>
            {creating ? 'در حال ایجاد…' : selected.size > 1 ? `ایجاد گروه (${selected.size})` : 'شروع گفتگو'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
