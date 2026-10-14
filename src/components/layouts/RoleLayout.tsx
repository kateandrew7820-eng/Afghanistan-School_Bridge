import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import NavigationBackButton from '@/components/NavigationBackButton';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/verificationHierarchy';
import { LogOut, Menu, X, User, Search, Command as CmdIcon, LucideIcon, LayoutDashboard } from 'lucide-react';

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
  const [confirmSignOut, setConfirmSignOut] = useState(false);

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
  const currentItem = [...allItems].sort((a, b) => b.href.length - a.href.length).find((i) =>
    i.href === location.pathname || matchPath({ path: i.href, end: false }, location.pathname)
  );
  const Brand = brand.icon;
  const dockItems = useMemo(() => {
    const home = allItems.find((item) => item.href === homeHref) ?? { href: homeHref, icon: LayoutDashboard, label: 'دشبورد' };
    const primary = allItems.find((item) => /\/(submit|inbox)$/.test(item.href));
    const insights = allItems.find((item) => /\/(academic-insights|analytics)$/.test(item.href))
      ?? allItems.find((item) => /\/(schools|districts)$/.test(item.href));
    const chat = allItems.find((item) => item.href === '/chat');
    return [home, primary, insights, chat].filter((item): item is NavItem => item !== undefined);
  }, [allItems, homeHref]);

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top bar */}
      <header
        className="fixed top-0 right-0 left-0 lg:right-64 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-3 sm:px-6"
        role="banner"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost" size="icon"
            className="lg:hidden h-10 w-10 shrink-0"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={open}
            aria-controls="role-sidebar"
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
            <>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenCommand}
                className="flex md:hidden h-9 w-9 text-muted-foreground"
                aria-label="جستجو سریع"
              >
                <Search className="h-4 w-4" />
              </Button>
            </>
          )}
          <NotificationBell className="h-9 w-9 text-muted-foreground" align="end" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmSignOut(true)}
            className="h-10 w-10 text-muted-foreground"
            aria-label="خروج از سیستم"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/30"
          onClick={() => setOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        id="role-sidebar"
        className={cn(
          'fixed top-0 right-0 h-full w-64 bg-sidebar-background border-l border-sidebar-border z-50',
          'lg:visible lg:translate-x-0',
          open ? 'visible translate-x-0' : 'invisible translate-x-full lg:visible lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Brand className="h-5 w-5 text-primary" />
            </div>
            <Button variant="ghost" size="icon-sm" className="lg:hidden shrink-0" aria-label="بستن منو" onClick={() => setOpen(false)}><X /></Button>
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm leading-tight truncate">{brand.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{brand.subtitle}</p>
            </div>
          </div>
          <div className="px-3 py-3 border-b border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-10 px-3 text-sm text-foreground"
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
            >
              <User className="h-4 w-4 shrink-0" />
              {profile?.full_name && (
                <span className="text-xs text-muted-foreground truncate">
                  {profile.full_name}{profile.role ? ` (${getRoleLabel(profile.role)})` : ''}
                </span>
              )}
            </Button>
          </div>
          {/* Grouped nav */}
          <nav
            className="flex-1 px-3 py-4 space-y-6 overflow-y-auto"
            role="navigation"
            aria-label={navAriaLabel}
          >
            {groups.map((group) => (
              <div key={group.label}>
                <div className="px-3 mb-2 text-xs font-medium text-muted-foreground">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = location.pathname === item.href
                      || (item.href !== homeHref && location.pathname.startsWith(item.href + '/'));
                    return (
                      <Link
                        key={item.href} to={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group flex min-h-11 items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          active
                            ? 'bg-primary/10 text-primary font-semibold border-s-2 border-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className={cn('h-4 w-4 shrink-0', active ? '' : 'text-muted-foreground group-hover:text-foreground')} />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.badge != null && item.badge > 0 && (
                          <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                            'bg-primary/10 text-primary'
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
            <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
              <span className="text-sm text-muted-foreground">حالت تاریک</span>
              <ThemeToggle className="h-9 w-9 text-muted-foreground" />
            </div>
            <p className="pt-2 pb-1 text-[10px] text-muted-foreground text-center">
              پل آموزش افغانستان
            </p>
          </nav>
        </div>
      </aside>

      <Dialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <DialogContent dir="rtl" className="max-w-md gap-6 rounded-xl p-6">
          <DialogHeader className="space-y-3 pt-1 text-right sm:text-right">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </span>
              <DialogTitle className="text-xl leading-snug">از حساب خارج می‌شوید؟</DialogTitle>
            </div>
            <DialogDescription>
              نشست شما پایان می‌یابد و به صفحه ورود برمی‌گردید.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmSignOut(false)}>انصراف</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmSignOut(false);
                void signOut();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut className="ms-2 h-4 w-4" aria-hidden="true" />
              خروج از حساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main */}
      <main className="role-content lg:mr-64 pt-16 min-h-screen" role="main">
        {isDemoMode && (
          <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between text-xs">
            <span className="text-warning font-medium">⚡ حالت نمایشی — تغییرات ذخیره نمی‌شود</span>
            <Button variant="ghost" size="sm" onClick={() => { exitDemoMode(); navigate('/'); }} className="text-warning hover:text-warning h-6 text-xs px-2">
              خروج
            </Button>
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
      <nav aria-label="دسترسی سریع" className="mobile-dock fixed bottom-0 inset-x-0 z-30 flex items-stretch justify-around gap-1 border-t border-border bg-card px-2 pt-2 lg:hidden">
        {dockItems.map((item) => {
          const active = location.pathname === item.href || (item.href !== homeHref && location.pathname.startsWith(item.href + '/'));
          return <Button key={item.href} asChild variant="ghost" className={cn('h-14 min-w-0 flex-1 flex-col gap-1 px-1 text-[11px]', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
            <Link to={item.href} aria-current={active ? 'page' : undefined}><item.icon className="h-5 w-5" /><span className="max-w-full truncate">{item.href === homeHref ? 'دشبورد' : item.label}</span>{item.badge != null && item.badge > 0 && <span className="sr-only">{item.badge} خوانده نشده</span>}</Link>
          </Button>;
        })}
        <Button variant="ghost" className="h-14 min-w-0 flex-1 flex-col gap-1 px-1 text-[11px] text-muted-foreground" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="role-sidebar"><Menu className="h-5 w-5" /><span>بیشتر</span></Button>
      </nav>
    </div>
  );
}
