import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import NavigationBackButton from '@/components/NavigationBackButton';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { LogOut, Menu, X, User, Search, Bell, Command as CmdIcon, LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

interface RoleLayoutProps {
  children: ReactNode;
  brand: { icon: LucideIcon; title: string; subtitle: string };
  groups: NavGroup[];
  scopeChip?: ReactNode;
  homeHref: string;
  navAriaLabel: string;
  onOpenCommand?: () => void;
}

/**
 * Unified shell for all 5 roles. Grouped sidebar, breadcrumb-aware top bar,
 * scope chip, command palette trigger. RTL-first, mobile-aware.
 */
export default function RoleLayout({
  children, brand, groups, scopeChip, homeHref, navAriaLabel, onOpenCommand,
}: RoleLayoutProps) {
  const { profile, signOut, isDemoMode, exitDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  // Keyboard shortcut ⌘K / Ctrl+K opens command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenCommand?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenCommand]);

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const currentItem = allItems.find((i) =>
    i.href === location.pathname || matchPath({ path: i.href, end: false }, location.pathname)
  );
  const Brand = brand.icon;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top bar */}
      <header
        className="fixed top-0 right-0 left-0 lg:right-64 h-14 bg-card/95 backdrop-blur border-b border-border z-40 flex items-center justify-between px-3 sm:px-4"
        role="banner"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost" size="icon"
            className="lg:hidden h-9 w-9 shrink-0"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'بستن منو' : 'باز کردن منو'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {location.pathname !== homeHref && (
            <NavigationBackButton fallback={homeHref} />
          )}

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-heading font-semibold text-sm sm:text-base truncate">
              {currentItem?.label ?? 'داشبورد'}
            </h1>
            {scopeChip && <div className="hidden md:flex">{scopeChip}</div>}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onOpenCommand && (
            <Button
              variant="outline" size="sm"
              onClick={onOpenCommand}
              className="hidden md:flex h-8 gap-2 text-xs text-muted-foreground"
              aria-label="جستجو سریع"
            >
              <Search className="h-3.5 w-3.5" />
              <span>جستجو…</span>
              <kbd className="ms-2 hidden lg:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-mono">
                <CmdIcon className="h-2.5 w-2.5" />K
              </kbd>
            </Button>
          )}
          <ThemeToggle className="h-9 w-9 text-muted-foreground" />
          <Button
            variant="ghost" size="icon"
            className="h-9 w-9 text-muted-foreground"
            aria-label="اعلان‌ها"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/40 max-w-[180px]">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{profile?.full_name}</span>
          </div>
          <Button
            variant="ghost" size="icon" onClick={signOut}
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            aria-label="خروج از سیستم"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-64 bg-card border-l border-border z-50',
          'transform transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="h-14 flex items-center gap-3 px-4 border-b border-border">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Brand className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm leading-tight truncate">{brand.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{brand.subtitle}</p>
            </div>
          </div>

          {/* Grouped nav */}
          <nav
            className="flex-1 px-2 py-3 space-y-5 overflow-y-auto"
            role="navigation"
            aria-label={navAriaLabel}
          >
            {groups.map((group) => (
              <div key={group.label}>
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = location.pathname === item.href
                      || (item.href !== homeHref && location.pathname.startsWith(item.href + '/'));
                    return (
                      <Link
                        key={item.href} to={item.href}
                        className={cn(
                          'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          active
                            ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className={cn('h-4 w-4 shrink-0', active ? '' : 'text-muted-foreground group-hover:text-foreground')} />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.badge != null && item.badge > 0 && (
                          <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                            active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                          )}>
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">پل آموزش افغانستان</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:mr-64 pt-14 min-h-screen" role="main">
        {isDemoMode && (
          <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between text-xs">
            <span className="text-warning font-medium">⚡ حالت نمایشی — تغییرات ذخیره نمی‌شود</span>
            <Button variant="ghost" size="sm" onClick={() => { exitDemoMode(); navigate('/'); }} className="text-warning hover:text-warning h-6 text-xs px-2">
              خروج
            </Button>
          </div>
        )}
        <div className="p-4 sm:p-5 lg:p-7 max-w-[1400px] mx-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
