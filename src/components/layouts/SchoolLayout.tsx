import { ReactNode, useState, useEffect } from 'react';
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

  // Show profile completion modal if not completed yet
  // Also show immediately after user completes SetupProfile (newly signed up)
  useEffect(() => {
    const setupCompleted = localStorage.getItem('setupProfileCompleted');
    
    // Show modal if:
    // 1. User just completed setup profile (new signup), OR
    // 2. User is on dashboard and hasn't completed profile yet
    if (!loading && !isCompleted && (location.pathname === '/school' || setupCompleted === 'true')) {
      setShowProfileModal(true);
    }
  }, [isCompleted, loading, location.pathname]);

  const handleProfileModalClose = () => {
    setShowProfileModal(false);
    // Clear the setup completed flag
    localStorage.removeItem('setupProfileCompleted');
    
    // If user is in production and needs verification, redirect them
    if (import.meta.env.MODE === 'production' && profile?.status === 'pending_verification') {
      // Optionally redirect to pending verification page
      // navigate('/pending-verification');
    }
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Status Bar */}
      <header className="fixed top-0 right-0 left-0 lg:right-64 h-14 bg-card border-b z-40 flex items-center justify-between px-4" role="banner">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {location.pathname !== '/school' && (
            <NavigationBackButton fallback="/school" />
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

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setMobileMenuOpen(false)} role="presentation" />
      )}

      {/* Sidebar - Right side for RTL */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 bg-card border-l z-50 transform transition-transform duration-200 ease-in-out",
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="h-14 flex items-center gap-3 px-4 border-b">
            <School className="h-6 w-6 text-primary" />
            <div className="truncate">
              <span className="font-heading font-bold text-sm block truncate">
                {profile?.schools?.name || t('navigation.schoolName')}
              </span>
              <span className="text-xs text-muted-foreground">{t('roles.school')}</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto" role="navigation" aria-label="منوی مکتب">
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

      {/* Main Content */}
      <main className="lg:mr-64 pt-14 min-h-screen" role="main">
        {isDemoMode && (
          <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between text-sm">
            <span className="text-warning font-medium">⚡ حالت نمایشی فعال — تغییرات ذخیره نمی‌شود</span>
            <Button variant="ghost" size="sm" onClick={() => { exitDemoMode(); navigate('/'); }} className="text-warning hover:text-warning">
              خروج
            </Button>
          </div>
        )}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal 
        isOpen={showProfileModal} 
        onClose={handleProfileModalClose} 
      />
    </div>
  );
}
