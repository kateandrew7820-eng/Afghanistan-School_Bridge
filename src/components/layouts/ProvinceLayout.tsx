import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NavigationBackButton from '@/components/NavigationBackButton';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, BarChart3, Bell, FileDown, Calendar,
  LogOut, Map, MapPin, Menu, X, TrendingUp, User
} from 'lucide-react';

interface ProvinceLayoutProps { children: ReactNode; }

export default function ProvinceLayout({ children }: ProvinceLayoutProps) {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/province', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { href: '/province/districts', icon: MapPin, label: t('province.districtOverview') },
    { href: '/province/analytics', icon: TrendingUp, label: t('province.analytics') },
    { href: '/province/submissions', icon: BarChart3, label: t('navigation.submissions') },
    { href: '/province/announcements', icon: Bell, label: t('navigation.announcements') },
    { href: '/province/documents', icon: FileDown, label: t('navigation.documents') },
    { href: '/province/deadlines', icon: Calendar, label: t('navigation.deadlines') },
  ];

  return (
    <div className="min-h-screen bg-background dark" dir="rtl">
      <header className="fixed top-0 right-0 left-0 lg:right-64 h-14 bg-card border-b z-40 flex items-center justify-between px-4" role="banner">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {location.pathname !== '/province' && (
            <NavigationBackButton fallback="/province" />
          )}
          <h2 className="font-heading font-semibold text-sm">
            {navItems.find(i => i.href === location.pathname)?.label || t('navigation.dashboard')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline text-muted-foreground">{profile?.full_name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground" aria-label="خروج از سیستم">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 bg-card border-l z-50 transform transition-transform duration-200 ease-in-out",
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="h-14 flex items-center gap-3 px-4 border-b">
            <Map className="h-6 w-6 text-primary" />
            <div className="truncate">
              <span className="font-heading font-bold text-sm block truncate">
                {profile?.province || t('navigation.provinceName')}
              </span>
              <span className="text-xs text-muted-foreground">{t('roles.province_admin')}</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto" role="navigation" aria-label="منوی ولایت">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground text-center">
              {t('app.title')}
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:mr-64 pt-14 min-h-screen" role="main">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
