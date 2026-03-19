import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  ClipboardList,
  Bell,
  FileDown,
  Calendar,
  LogOut,
  School,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface SchoolLayoutProps {
  children: ReactNode;
}

export default function SchoolLayout({ children }: SchoolLayoutProps) {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/school', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { href: '/school/statistics', icon: BarChart3, label: t('school.submitStatistics') },
    { href: '/school/reports', icon: FileText, label: t('school.submitReports') },
    { href: '/school/forms', icon: ClipboardList, label: t('school.submitForms') },
    { href: '/school/announcements', icon: Bell, label: t('navigation.announcements') },
    { href: '/school/documents', icon: FileDown, label: t('navigation.documents') },
    { href: '/school/deadlines', icon: Calendar, label: t('navigation.deadlines') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <School className="h-6 w-6 text-primary" />
          <span className="font-semibold text-sm truncate max-w-[150px]">
            {profile?.schools?.name || t('navigation.schoolName')}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transform transition-transform duration-200 ease-in-out",
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2 px-4 border-b">
            <School className="h-6 w-6 text-primary" />
            <span className="font-heading font-semibold truncate">{profile?.schools?.name || t('navigation.schoolName')}</span>
          </div>

          {/* Navigation */}
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

          {/* User Info & Logout */}
          <div className="p-4 border-t">
            <div className="mb-3 text-sm">
              <p className="font-medium truncate">{profile?.full_name || 'School User'}</p>
              <p className="text-muted-foreground text-xs truncate">{profile?.schools?.code}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('auth.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
