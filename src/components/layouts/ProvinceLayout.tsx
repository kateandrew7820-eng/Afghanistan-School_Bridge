import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  BarChart3, 
  Bell,
  FileDown,
  FileUp,
  Calendar,
  LogOut,
  Map,
  MapPin,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';

interface ProvinceLayoutProps {
  children: ReactNode;
}

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
    { href: '/province/اعلانات', icon: Bell, label: t('navigation.اعلانات') },
    { href: '/province/documents', icon: FileDown, label: t('navigation.documents') },
    { href: '/province/deadlines', icon: Calendar, label: t('navigation.deadlines') },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Map className="h-6 w-6 text-primary" />
          <span className="font-heading font-semibold text-sm">{t('province.dashboard')}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transform transition-transform duration-200 ease-in-out",
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center gap-2 px-4 border-b">
            <Map className="h-6 w-6 text-primary" />
            <span className="font-heading font-semibold truncate">Province Admin</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="mb-3 text-sm">
              <p className="font-medium">{profile?.full_name || 'Province Admin'}</p>
              <p className="text-muted-foreground text-xs">{profile?.province || 'Province'}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('auth.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
