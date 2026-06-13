import { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Side defaults to 'left' so the drawer slides in from the start of an RTL layout. */
  side?: 'left' | 'right' | 'top' | 'bottom';
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Generic right/left side panel for showing record details, history, and actions.
 * Built on top of the Sheet primitive and RTL-safe.
 */
export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  side = 'left',
  children,
  footer,
  className,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} dir="rtl" className={cn('w-full sm:max-w-lg flex flex-col gap-4', className)}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">{children}</div>
        {footer && <SheetFooter className="border-t pt-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
