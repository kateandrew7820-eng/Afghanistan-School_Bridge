import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileCompletionModal } from '@/components/ProfileCompletionModal';
import RoleLayout, { NavGroup } from './RoleLayout';
import { ScopeChip } from '@/components/ScopeChip';
import {
  LayoutDashboard, Send, MessageSquare,
  Bell, FileDown, Calendar, School,
} from 'lucide-react';



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
        { href: '/school/submit', icon: Send, label: 'ارسال اطلاعات' },
        { href: '/chat', icon: MessageSquare, label: 'گفتگو' },
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
        onOpenCommand={openCommand}
      >
        {children}
      </RoleLayout>
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => { setShowProfileModal(false); localStorage.removeItem('setupProfileCompleted'); }}
      />
    </>
  );
}
