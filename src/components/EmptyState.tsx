import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <Card>
      <CardContent className="py-12 text-center flex flex-col items-center gap-2">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-sm">{title}</p>
        {description && <p className="text-xs text-muted-foreground max-w-sm">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </CardContent>
    </Card>
  );
}
