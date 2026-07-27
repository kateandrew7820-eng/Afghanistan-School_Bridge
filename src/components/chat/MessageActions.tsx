import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CornerUpLeft, SmilePlus, Pin, PinOff, Copy, Trash2 } from 'lucide-react';

export const QUICK_EMOJIS = ['👍', '❤️', '✅', '🎉', '😊', '🙏'];

interface Props {
  isMine: boolean;
  pinned: boolean;
  canDelete: boolean;
  hasText: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onTogglePin: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function MessageActions({
  isMine,
  pinned,
  canDelete,
  hasText,
  onReply,
  onReact,
  onTogglePin,
  onCopy,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);

  const btn =
    'h-8 w-8 inline-flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground';

  return (
    <div
      className={cn(
        'flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 focus-within:opacity-100',
        open && 'opacity-100',
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className={btn} aria-label="واکنش">
            <SmilePlus className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" align={isMine ? 'end' : 'start'} dir="rtl">
          <div className="flex items-center gap-0.5">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  onReact(e);
                  setOpen(false);
                }}
                className="h-9 w-9 rounded-md text-lg hover:bg-muted"
                aria-label={`واکنش ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <button className={btn} onClick={onReply} aria-label="پاسخ">
        <CornerUpLeft className="h-4 w-4" />
      </button>
      <button className={btn} onClick={onTogglePin} aria-label={pinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}>
        {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      </button>
      {hasText && (
        <button className={btn} onClick={onCopy} aria-label="کاپی متن">
          <Copy className="h-4 w-4" />
        </button>
      )}
      {canDelete && (
        <button
          className={cn(btn, 'hover:text-destructive')}
          onClick={onDelete}
          aria-label="حذف پیام"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
