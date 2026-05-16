import { ReactNode, useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileCompletionModal } from '@/components/ProfileCompletionModal';
import RoleLayout, { NavGroup } from './RoleLayout';
import { ScopeChip } from '@/components/ScopeChip';
import {
  LayoutDashboard, BarChart3, FileText, ClipboardList,
  Bell, FileDown, Calendar, School,
} from 'lucide-react';

const CommandPalette = lazy(() => import('@/components/CommandPalette').then(m => ({ default: m.CommandPalette })));

interface SchoolLayoutProps { children: ReactNode; }

export default function SchoolLayout({ children }: SchoolLayoutProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const openCommand = () => window.dispatchEvent(new Event('open-command-palette'));
  const { isCompleted, loading } = useProfileCompletion();

  useEffect(() => {
    const setupCompleted = localStorage.getItem('setupProfileCompleted');
    if (!loading && !isCompleted && (location.pathname === '/school' || setupCompleted === 'true')) {
      setShowProfileModal(true);
    }
  }, [isCompleted, loading, location.pathname]);

  const groups: NavGroup[] = [
    {
      label: 'کار من',
      items: [
        { href: '/school', icon: LayoutDashboard, label: t('navigation.dashboard') },
        { href: '/school/statistics', icon: BarChart3, label: t('school.submitStatistics') },
        { href: '/school/reports', icon: FileText, label: t('school.submitReports') },
        { href: '/school/forms', icon: ClipboardList, label: t('school.submitForms') },
      ],
    },
    {
      label: 'منابع',
      items: [
        { href: '/school/announcements', icon: Bell, label: t('navigation.announcements') },
        { href: '/school/documents', icon: FileDown, label: t('navigation.documents') },
        { href: '/school/deadlines', icon: Calendar, label: t('navigation.deadlines') },
      ],
    },
  ];

  return (
    <>
      <RoleLayout
        homeHref="/school"
        navAriaLabel="منوی مکتب"
        brand={{
          icon: School,
          title: (profile as any)?.schools?.name || profile?.school_name || t('navigation.schoolName'),
          subtitle: t('roles.school'),
        }}
        scopeChip={<ScopeChip levels={[profile?.province, profile?.district]} />}
        groups={groups}
        onOpenCommand={() => setCmdOpen(true)}
      >
        {children}
      </RoleLayout>
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => { setShowProfileModal(false); localStorage.removeItem('setupProfileCompleted'); }}
      />
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
    </>
  );
}
