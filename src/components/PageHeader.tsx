import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  backButton?: boolean;
  backTo?: string;
  actions?: PageHeaderAction[];
  className?: string;
  children?: ReactNode;
}

/**
 * Page Header Component
 * Displays page title, description, back button, and actions
 * Creates professional app-like experience
 */
export default function PageHeader({
  title,
  description,
  icon,
  backButton = true,
  backTo,
  actions,
  className,
  children
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('space-y-4 mb-8', className)}>
      {/* Header Top - Back Button & Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Back Button */}
          {backButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mt-1 -ml-2"
              title="بازگشت"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}

          {/* Title Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {icon && <div className="text-primary">{icon}</div>}
              <h1 className="text-3xl font-bold">{title}</h1>
            </div>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {actions.map((action) => (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant={action.variant || 'default'}
                disabled={action.disabled}
              >
                {action.label}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Content */}
      {children}
    </div>
  );
}
