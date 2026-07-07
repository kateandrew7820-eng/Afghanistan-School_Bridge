import { useCallback, useRef, useState, KeyboardEvent, DragEvent, ClipboardEvent } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  isAllowedMime,
  MAX_ATTACHMENT_SIZE,
  uploadChatAttachment,
  humanFileSize,
} from '@/lib/chat/attachments';

interface Props {
  conversationId: string;
  onSend: (input: {
    body?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
    attachment_mime?: string | null;
    attachment_size?: number | null;
  }) => Promise<void>;
  onTyping: () => void;
}

export function MessageComposer({ conversationId, onSend, onTyping }: Props) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast({ title: 'فایل بزرگ است', description: 'حداکثر ۲۰ مگابایت.', variant: 'destructive' });
        return false;
      }
      if (!isAllowedMime(file.type)) {
        toast({ title: 'نوع فایل مجاز نیست', variant: 'destructive' });
        return false;
      }
      return true;
    },
    [toast],
  );

  const doSend = useCallback(async () => {
    const body = text.trim();
    if (!body && !attachment) return;
    setSending(true);
    try {
      let attachmentPath: string | null = null;
      let attachmentName: string | null = null;
      let attachmentMime: string | null = null;
      let attachmentSize: number | null = null;
      if (attachment) {
        const { path } = await uploadChatAttachment(conversationId, attachment);
        attachmentPath = path;
        attachmentName = attachment.name;
        attachmentMime = attachment.type;
        attachmentSize = attachment.size;
      }
      await onSend({
        body: body || null,
        attachment_url: attachmentPath,
        attachment_name: attachmentName,
        attachment_mime: attachmentMime,
        attachment_size: attachmentSize,
      });
      setText('');
      setAttachment(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err: any) {
      toast({ title: 'ارسال ناموفق بود', description: err?.message ?? '', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [text, attachment, conversationId, onSend, toast]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && validateFile(f)) setAttachment(f);
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.kind === 'file');
    if (item) {
      const f = item.getAsFile();
      if (f && validateFile(f)) setAttachment(f);
    }
  };

  return (
    <div
      className={`border-t border-border bg-card p-3 ${dragging ? 'ring-2 ring-primary' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
          <Paperclip className="h-3.5 w-3.5" />
          <span className="truncate flex-1">{attachment.name}</span>
          <span className="text-muted-foreground">{humanFileSize(attachment.size)}</span>
          <button onClick={() => setAttachment(null)} aria-label="حذف پیوست">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          aria-label="پیوست فایل"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && validateFile(f)) setAttachment(f);
            e.target.value = '';
          }}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
            const el = e.target;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 140) + 'px';
          }}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          rows={1}
          placeholder="پیام خود را بنویسید…"
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-[140px]"
        />
        <Button
          onClick={doSend}
          disabled={sending || (!text.trim() && !attachment)}
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="ارسال"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
