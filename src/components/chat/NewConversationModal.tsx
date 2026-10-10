import { untypedRpc } from '@/lib/untypedRpc';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Check, UserPlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChatAvatar } from './ChatAvatar';
import type { ConversationSummary } from '@/hooks/useConversations';
import {
  cacheChatContacts,
  readCachedChatContacts,
  type ChatContact,
} from '@/lib/chat/offlineStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
  conversations: ConversationSummary[];
}

interface SearchResult {
  user_id: string;
  full_name: string | null;
  role: string | null;
}

interface SelectedContact extends SearchResult {
  email: string;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function contactLookupErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error &&
      typeof error.code === 'string'
    ? error.code
    : undefined;
  if (code === 'PGRST202' || code === '42883') {
    return 'جستجوی ایمیل هنوز در پایگاه داده فعال نشده است. لطفاً مهاجرت پایگاه داده را اجرا کنید.';
  }
  if (code === 'P0001') {
    return 'تعداد جستجوها زیاد است؛ یک دقیقه دیگر دوباره تلاش کنید.';
  }
  return navigator.onLine
    ? 'جستجوی تماس انجام نشد. لطفاً دوباره تلاش کنید.'
    : 'جستجوی ایمیل در حالت آفلاین در دسترس نیست؛ از تماس‌های ذخیره‌شده استفاده کنید.';
}

export function NewConversationModal({ open, onOpenChange, onCreated, conversations }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selected, setSelected] = useState<SelectedContact[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  const refreshContacts = useCallback(async () => {
    if (!user) return;
    try {
      const cached = await readCachedChatContacts(user.id);
      setContacts(cached);
      const { data, error } = await untypedRpc('list_chat_contacts');
      if (error) throw error;
      const updated = data ?? [];
      setContacts(updated);
      await cacheChatContacts(user.id, updated);
    } catch (error) {
      console.error('Could not refresh chat contacts:', error);
      setSearchError('فهرست تماس‌های ذخیره‌شده به‌روز نشد؛ تماس‌های آفلاین همچنان نمایش داده می‌شوند.');
    }
  }, [user]);

  useEffect(() => {
    if (open) void refreshContacts();
  }, [open, refreshContacts]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setResult(null);
      setSelected([]);
      setGroupTitle('');
      setSearched(false);
      setSearchError('');
    }
  }, [open]);

  const lookup = async (event: FormEvent) => {
    event.preventDefault();
    const query = email.trim();
    setResult(null);
    setSearched(false);
    setSearchError('');
    if (!isEmail(query)) {
      setSearched(true);
      setSearchError('یک نشانی ایمیل کامل وارد کنید.');
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await untypedRpc('find_chat_user_by_email', { _email: query });
      if (error) throw error;
      setResult(data?.[0] ?? null);
      setSearched(true);
    } catch (error) {
      console.error('Chat contact lookup failed:', error);
      setSearchError(contactLookupErrorMessage(error));
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const addResult = (person: SearchResult, contactEmail: string) => {
    if (selected.some((item) => item.user_id === person.user_id)) return;
    setSelected((items) => [...items, { ...person, email: contactEmail }]);
    setResult(null);
    setEmail('');
    setSearched(false);
  };

  const create = async () => {
    if (!user || selected.length === 0) return;
    setCreating(true);
    try {
      if (selected.length === 1) {
        const { data, error } = await untypedRpc('create_direct_chat_by_email', { _email: selected[0].email });
        if (error) throw error;
        onCreated(data);
        onOpenChange(false);
        return;
      }

      for (const person of selected) {
        const { error } = await untypedRpc('add_chat_contact_by_email', { _email: person.email });
        if (error) throw error;
      }

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({ type: 'group', title: groupTitle.trim() || null, created_by: user.id })
        .select('id')
        .single();
      if (error) throw error;
      const { error: memberError } = await supabase.from('conversation_members').insert([
        { conversation_id: conversation.id, user_id: user.id, role: 'admin' },
        ...selected.map((person) => ({
          conversation_id: conversation.id,
          user_id: person.user_id,
          role: 'member' as const,
        })),
      ]);
      if (memberError) throw memberError;
      onCreated(conversation.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Could not create chat:', error);
      toast({ title: 'ایجاد گفتگو ناموفق بود', description: 'لطفاً اتصال و ایمیل اعضا را بررسی کنید.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const visibleContacts = contacts.filter((contact) => {
    const query = email.trim().toLocaleLowerCase();
    return !query || (
      contact.email.toLocaleLowerCase().includes(query) ||
      (contact.full_name ?? '').toLocaleLowerCase().includes(query)
    );
  }).slice(0, 50);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>گفتگوی جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={lookup} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setResult(null);
                setSearched(false);
                setSearchError('');
              }}
              placeholder="ایمیل کامل کاربر"
              autoComplete="email"
              dir="ltr"
            />
            <Button type="submit" variant="outline" disabled={searching || !email.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>
        {searchError && <p role="status" className="text-xs text-destructive">{searchError}</p>}
        {searching && <p className="text-center text-sm text-muted-foreground py-3">در حال جستجو…</p>}
        {searched && !searching && !result && !searchError && (
          <p role="status" className="text-center text-sm text-muted-foreground py-3">کاربری با این ایمیل یافت نشد.</p>
        )}
        {result && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <ChatAvatar name={result.full_name} type="direct" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{result.full_name || 'کاربر'}</p>
              <p className="truncate text-xs text-muted-foreground" dir="ltr">{email.trim()}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => addResult(result, email.trim())}>
              <UserPlus className="me-1 h-4 w-4" /> افزودن
            </Button>
          </div>
        )}
        {visibleContacts.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-lg border p-1">
            <p className="px-2 py-1 text-xs text-muted-foreground">تماس‌های ذخیره‌شده</p>
            {visibleContacts.map((contact) => (
              <button
                key={contact.user_id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-right hover:bg-muted"
                onClick={() => {
                  const existing = conversations.find((conversation) =>
                    conversation.type === 'direct' &&
                    conversation.members.some((member) => member.user_id === contact.user_id),
                  );
                  if (!navigator.onLine && existing) {
                    onCreated(existing.id);
                    onOpenChange(false);
                  } else if (!navigator.onLine) {
                    toast({ title: 'گفتگوی موجود نیست', description: 'برای آغاز گفتگوی جدید به اینترنت وصل شوید.' });
                  } else {
                    addResult(contact, contact.email);
                  }
                }}
              >
                <ChatAvatar name={contact.full_name} type="direct" size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {contact.full_name || contact.email}
                </span>
                <span className="text-xs text-muted-foreground" dir="ltr">{contact.email}</span>
              </button>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <div className="space-y-2">
            <div className="space-y-1">
              {selected.map((person) => {
                const address = person.email;
                return (
                  <div key={person.user_id} className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm">{person.full_name || address || 'کاربر'}</span>
                    {address && <span className="text-xs text-muted-foreground" dir="ltr">{address}</span>}
                    <button type="button" onClick={() => setSelected((items) => items.filter((item) => item.user_id !== person.user_id))} aria-label="حذف">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            {selected.length > 1 && (
              <Input value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} placeholder="نام گروه (اختیاری)" />
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>لغو</Button>
          {selected.length > 0 && (
            <Button disabled={creating || !navigator.onLine} onClick={() => void create()}>
              {creating ? 'در حال ایجاد…' : selected.length > 1 ? `ایجاد گروه (${selected.length})` : 'شروع گفتگو'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
