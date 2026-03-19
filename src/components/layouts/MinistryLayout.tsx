import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  BarChart3, 
  Bell,
  FileUp,
  Calendar,
  LogOut,
  Building2,
  School,
  Map,
  MapPin,
  Users,
  TrendingUp,
  Download,
  Menu,
  X
} from 'lucide-react';

interface MinistryLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/ministry', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/ministry/analytics', icon: TrendingUp, label: 'National Analytics' },
  { href: '/ministry/provinces', icon: Map, label: 'Provinces' },
  { href: '/ministry/submissions', icon: BarChart3, label: 'All Submissions' },
  { href: '/ministry/announcements', icon: Bell, label: 'Announcements' },
  { href: '/ministry/documents', icon: FileUp, label: 'Documents' },
  { href: '/ministry/deadlines', icon: Calendar, label: 'Deadlines' },
  { href: '/ministry/users', icon: Users, label: 'Manage Users' },
  { href: '/ministry/schools', icon: School, label: 'Manage Schools' },
  { href: '/ministry/export', icon: Download, label: 'Export Reports' },
];

export default function MinistryLayout({ children }: MinistryLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background dark">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-heading font-semibold text-sm">Ministry Admin</span>
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
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-heading font-semibold truncate">Ministry Portal</span>
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
              <p className="font-medium">{profile?.full_name || 'Ministry Admin'}</p>
              <p className="text-muted-foreground text-xs">National Administration</p>
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
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
