import { useEffect, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAvatar } from './ChatAvatar';
import { ChatContactActions } from './ChatContactActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ConversationSummary } from '@/hooks/useConversations';

interface Props {
  conv: ConversationSummary;
  currentUserId: string;
  onlineUserIds: Set<string>;
  onClose: () => void;
  onBlocked: () => void;
}

const ROLE_FA: Record<string, string> = {
  admin: 'مدیر',
  member: 'عضو',
};

export function DetailsPanel({ conv, currentUserId, onlineUserIds, onClose, onBlocked }: Props) {
  const { toast } = useToast();
  const [contactDetails, setContactDetails] = useState<{
    email: string;
    phone_number: string | null;
    mutual: boolean;
  } | null>(null);
  const [isContact, setIsContact] = useState(false);
  const [adding, setAdding] = useState(false);
  const isGroup = conv.type === 'group';
  const name = isGroup
    ? conv.title || 'گفتگوی گروهی'
    : conv.members.find((m) => m.user_id !== currentUserId)?.full_name || 'گفتگو';
  const otherUserId = !isGroup
    ? conv.members.find((member) => member.user_id !== currentUserId)?.user_id
    : undefined;

  useEffect(() => {
    let active = true;
    setContactDetails(null);
    setIsContact(false);
    if (!otherUserId) return;
    void (async () => {
      try {
        const [contactsResult, detailsResult] = await Promise.all([
          supabase.rpc('list_chat_contacts'),
          supabase.rpc('get_chat_contact_details', { _contact_user_id: otherUserId }),
        ]);
        if (contactsResult.error) throw contactsResult.error;
        if (detailsResult.error) throw detailsResult.error;
        if (!active) return;
        setIsContact((contactsResult.data ?? []).some((contact) => contact.user_id === otherUserId));
        setContactDetails(detailsResult.data?.[0] ?? null);
      } catch (error) {
        console.error('Could not load private contact details:', error);
      }
    })();
    return () => { active = false; };
  }, [otherUserId]);

  const addContact = async () => {
    if (!otherUserId) return;
    setAdding(true);
    try {
      const { error } = await supabase.rpc('add_chat_contact', { _contact_user_id: otherUserId });
      if (error) throw error;
      setIsContact(true);
      const { data, error: detailsError } = await supabase.rpc('get_chat_contact_details', {
        _contact_user_id: otherUserId,
      });
      if (detailsError) throw detailsError;
      setContactDetails(data?.[0] ?? null);
    } catch (error) {
      console.error('Could not add chat contact:', error);
      toast({ title: 'افزودن تماس انجام نشد', description: 'لطفاً اتصال را بررسی و دوباره تلاش کنید.', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

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
            {otherUserId && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {isContact ? (
                  <div className="space-y-1 text-xs">
                    {contactDetails?.email && <p dir="ltr" className="text-muted-foreground">{contactDetails.email}</p>}
                    {contactDetails?.phone_number && (
                      <p className="text-muted-foreground" dir="ltr">{contactDetails.phone_number}</p>
                    )}
                    {!contactDetails?.mutual && (
                      <p className="text-muted-foreground">شمارهٔ تماس تا افزودن متقابل پنهان است.</p>
                    )}
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full gap-2" disabled={adding} onClick={() => void addContact()}>
                    <UserPlus className="h-4 w-4" />
                    {adding ? 'در حال افزودن…' : 'افزودن به تماس‌ها'}
                  </Button>
                )}
                <ChatContactActions
                  display="buttons"
                  contactUserId={otherUserId}
                  conversationId={conv.id}
                  onBlocked={onBlocked}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
