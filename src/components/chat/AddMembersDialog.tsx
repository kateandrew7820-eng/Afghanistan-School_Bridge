import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatAvatar } from './ChatAvatar';
import { getRoleLabelFA } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conversationId: string;
  existingUserIds: string[];
  onAdded: () => void;
}

interface UserRow {
  user_id: string;
  full_name: string | null;
  role: string | null;
}

export function AddMembersDialog({ open, onOpenChange, conversationId, existingUserIds, onAdded }: Props) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch('');
    setLoading(true);
    supabase
      .from('profiles')
      .select('user_id, full_name, role')
      .limit(200)
      .then(({ data }) => {
        setUsers((data ?? []) as UserRow[]);
        setLoading(false);
      });
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => !existingUserIds.includes(u.user_id))
      .filter((u) => !q || (u.full_name || '').toLowerCase().includes(q));
  }, [users, search, existingUserIds]);

  const save = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    const { error } = await supabase.from('conversation_members').insert(
      Array.from(selected).map((uid) => ({
        conversation_id: conversationId,
        user_id: uid,
        role: 'member' as const,
      })),
    );
    setSaving(false);
    if (error) {
      toast({ title: 'افزودن عضو ناموفق بود', description: error.message, variant: 'destructive' });
      return;
    }
    onAdded();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>افزودن عضو</DialogTitle>
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
                    onClick={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        next.has(u.user_id) ? next.delete(u.user_id) : next.add(u.user_id);
                        return next;
                      })
                    }
                    className={cn(
                      'w-full text-right flex items-center gap-3 px-3 py-2 rounded-lg',
                      on ? 'bg-primary/10' : 'hover:bg-muted',
                    )}
                  >
                    <ChatAvatar name={u.full_name} type="direct" size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{u.full_name || 'کاربر'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {getRoleLabelFA((u.role as any) ?? null)}
                      </p>
                    </div>
                    {on && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            لغو
          </Button>
          <Button disabled={selected.size === 0 || saving} onClick={save}>
            {saving ? 'در حال افزودن…' : `افزودن (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
