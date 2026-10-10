import { useState } from 'react';
import { MoreVertical, ShieldBan, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  contactUserId: string;
  conversationId: string;
  onBlocked: () => void;
  display?: 'menu' | 'buttons';
}

export function ChatContactActions({
  contactUserId,
  conversationId,
  onBlocked,
  display = 'menu',
}: Props) {
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const block = async () => {
    if (!window.confirm('این کاربر دیگر نمی‌تواند به شما پیام دهد یا وضعیت آنلاین شما را ببیند.')) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('block_chat_user', { _blocked_user_id: contactUserId });
      if (error) throw error;
      onBlocked();
    } catch (error) {
      console.error('Could not block chat contact:', error);
      toast({ title: 'مسدودسازی انجام نشد', description: 'لطفاً دوباره تلاش کنید.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const report = async () => {
    if (!reason.trim()) {
      toast({ title: 'لطفاً دلیل گزارش را بنویسید', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc('report_chat_user', {
        _reported_user_id: contactUserId,
        _conversation_id: conversationId,
        _reason: reason.trim(),
      });
      if (error) throw error;
      setReportOpen(false);
      setReason('');
      toast({ title: 'گزارش برای بررسی مدیر ارسال شد.' });
    } catch (error: unknown) {
      console.error('Could not submit chat report:', error);
      toast({
        title: 'گزارش ارسال نشد',
        description: error instanceof Error ? error.message : 'لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const actions = (
    <>
      <Button
        type="button"
        variant={display === 'buttons' ? 'outline' : 'ghost'}
        size={display === 'buttons' ? 'sm' : 'default'}
        className={display === 'buttons' ? 'w-full justify-start gap-2' : 'text-destructive'}
        disabled={busy}
        onClick={() => void block()}
      >
        <ShieldBan className="h-4 w-4" />
        مسدودسازی
      </Button>
      <Button
        type="button"
        variant={display === 'buttons' ? 'outline' : 'ghost'}
        size={display === 'buttons' ? 'sm' : 'default'}
        className={display === 'buttons' ? 'w-full justify-start gap-2' : ''}
        onClick={() => setReportOpen(true)}
      >
        <Flag className="h-4 w-4" />
        گزارش کاربر
      </Button>
    </>
  );

  return (
    <>
      {display === 'menu' ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="اقدامات تماس">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" dir="rtl">
            <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void block(); }}>
              <ShieldBan className="me-2 h-4 w-4 text-destructive" /> مسدودسازی
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setReportOpen(true)}>
              <Flag className="me-2 h-4 w-4" /> گزارش کاربر
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="space-y-2">{actions}</div>
      )}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>گزارش تماس</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="دلیل گزارش را بنویسید"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>لغو</Button>
            <Button disabled={!reason.trim() || busy} onClick={() => void report()}>
              ارسال گزارش
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
