import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigation component
 * Shows current page location in hierarchy
 */
export default function Breadcrumb({ items = [], className }: BreadcrumbProps) {
  const location = useLocation();

  // Generate breadcrumbs from path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;

    const segments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'خانه', href: '/' }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Format segment name
      const formatSegment = (seg: string): string => {
        const labelMap: Record<string, string> = {
          'school': 'مکتب',
          'district': 'منطقه',
          'province': 'ولایت',
          'ministry': 'وزارت',
          'dashboard': 'صفحه اصلی',
          'statistics': 'آمار',
          'reports': 'گزارش‌ها',
          'forms': 'فرم‌ها',
          'اعلانات': 'اعلان‌ها',
          'documents': 'اسناد',
          'deadlines': 'مهلت‌ها',
          'submissions': 'ارسال‌ها',
          'manage-schools': 'مدیریت مکاتب',
          'pending-verification': 'در انتظار تایید',
          'setup-profile': 'تکمیل پروفایل',
        };
        return labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
      };

      breadcrumbs.push({
        label: formatSegment(segment),
        href: isLast ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className={cn('flex items-center gap-1 text-sm mb-4', className)} aria-label="breadcrumb">
      {breadcrumbs.map((item, index) => (
        <div key={item.label} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {item.href ? (
            <Link
              to={item.href}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              {index === 0 ? <Home className="h-4 w-4" /> : item.label}
            </Link>
          ) : (
            <span className={cn(
              index === 0 ? 'flex items-center' : '',
              'text-foreground font-medium'
            )}>
              {index === 0 ? <Home className="h-4 w-4" /> : item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
