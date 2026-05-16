import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

interface ScopeChipProps {
  /** Hierarchy levels right-to-left in RTL (e.g. ['کابل', 'بگرام']). */
  levels: Array<string | null | undefined>;
  className?: string;
}

/**
 * Compact scope indicator for multi-tier users (Province → District → School).
 * Hides empty levels.
 */
export function ScopeChip({ levels, className }: ScopeChipProps) {
  const visible = levels.filter(Boolean) as string[];
  if (visible.length === 0) return null;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60 border border-border/60 text-[11px] text-muted-foreground',
        className,
      )}
      aria-label="محدوده فعلی"
    >
      {visible.map((lvl, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronLeft className="h-3 w-3 opacity-50" aria-hidden />}
          <span className={cn(i === visible.length - 1 && 'text-foreground font-medium')}>{lvl}</span>
        </span>
      ))}
    </div>
  );
}
