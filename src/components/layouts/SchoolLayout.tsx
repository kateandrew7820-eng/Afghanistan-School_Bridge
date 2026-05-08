import { ReactNode, useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NavigationBackButton from '@/components/NavigationBackButton';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileCompletionModal } from '@/components/ProfileCompletionModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, BarChart3, FileText, ClipboardList,
  Bell, FileDown, Calendar, LogOut, School, Menu, X, User
} from 'lucide-react';

interface SchoolLayoutProps { children: ReactNode; }

export default function SchoolLayout({ children }: SchoolLayoutProps) {
  const { t } = useTranslation();
  const { profile, signOut, isDemoMode, exitDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { isCompleted, loading } = useProfileCompletion();

  useEffect(() => {
    const setupCompleted = localStorage.getItem('setupProfileCompleted');
    if (!loading && !isCompleted && (location.pathname === '/school' || setupCompleted === 'true')) {
      setShowProfileModal(true);
    }
  }, [isCompleted, loading, location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleProfileModalClose = () => {
    setShowProfileModal(false);
    localStorage.removeItem('setupProfileCompleted');
  };

  const navItems = [
    { href: '/school', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { href: '/school/statistics', icon: BarChart3, label: t('school.submitStatistics') },
    { href: '/school/reports', icon: FileText, label: t('school.submitReports') },
    { href: '/school/forms', icon: ClipboardList, label: t('school.submitForms') },
    { href: '/school/announcements', icon: Bell, label: t('navigation.announcements') },
    { href: '/school/documents', icon: FileDown, label: t('navigation.documents') },
    { href: '/school/deadlines', icon: Calendar, label: t('navigation.deadlines') },
  ];

  const currentPageLabel = navItems.find(i => i.href === location.pathname)?.label || t('navigation.dashboard');

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <header className="fixed top-0 right-0 left-0 lg:right-60 h-12 bg-card border-b z-40 flex items-center justify-between px-3" role="banner">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          {location.pathname !== '/school' && <NavigationBackButton fallback="/school" />}
          <h2 className="font-heading font-semibold text-sm truncate">{currentPageLabel}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[120px]">
            {profile?.full_name}
          </span>
          <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-muted-foreground" aria-label="خروج از سیستم">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-60 bg-card border-l z-50 transition-transform duration-200",
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-12 flex items-center gap-2.5 px-3 border-b">
            <School className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-heading font-bold text-xs block truncate">
                {profile?.schools?.name || t('navigation.schoolName')}
              </span>
              <span className="text-[10px] text-muted-foreground">{t('roles.school')}</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" role="navigation" aria-label="منوی مکتب">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t">
            <div className="text-[10px] text-muted-foreground text-center">{t('app.title')}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:mr-60 pt-12 min-h-screen" role="main">
        {isDemoMode && (
          <div className="bg-warning/10 border-b border-warning/30 px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-warning font-medium">⚡ حالت نمایشی — تغییرات ذخیره نمی‌شود</span>
            <Button variant="ghost" size="sm" onClick={() => { exitDemoMode(); navigate('/'); }} className="text-warning hover:text-warning h-6 text-xs px-2">
              خروج
            </Button>
          </div>
        )}
        <div className="p-3 sm:p-4 lg:p-6"><ErrorBoundary>{children}</ErrorBoundary></div>
      </main>

      <ProfileCompletionModal isOpen={showProfileModal} onClose={handleProfileModalClose} />
    </div>
  );
}
