import { cn } from '@/lib/utils';
import { Users, User } from 'lucide-react';
import { initialsFrom } from '@/lib/chat/format';

interface Props {
  name: string | null | undefined;
  type: 'direct' | 'group';
  online?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export function ChatAvatar({ name, type, online, size = 'md', className }: Props) {
  const sizeCls = sizes[size];
  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold',
          sizeCls,
          type === 'group'
            ? 'bg-accent/15 text-accent-foreground'
            : 'bg-primary/15 text-primary',
        )}
      >
        {type === 'group' ? (
          <Users className={cn(size === 'lg' ? 'h-7 w-7' : 'h-4 w-4')} />
        ) : name ? (
          <span>{initialsFrom(name)}</span>
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
      )}
    </div>
  );
}
