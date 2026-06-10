import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import RoleLayout, { NavGroup } from './RoleLayout';
import {
  LayoutDashboard, Inbox, Bell, FileDown, Calendar,
  School, Map, Users, TrendingUp, Download, Building2,
} from 'lucide-react';


interface Props { children: ReactNode; }

export default function MinistryLayout({ children }: Props) {
  const { t } = useTranslation();
  const openCommand = () => window.dispatchEvent(new Event('open-command-palette'));

  const groups: NavGroup[] = [
    {
      label: 'کار من',
      items: [
        { href: '/ministry', icon: LayoutDashboard, label: t('navigation.dashboard') },
        { href: '/ministry/inbox', icon: Inbox, label: 'صندوق تأیید' },
      ],
    },
    {
      label: 'بینش‌ها',
      items: [
        { href: '/ministry/analytics', icon: TrendingUp, label: t('province.analytics') },
        { href: '/ministry/provinces', icon: Map, label: t('ministry.allProvinces') },
        { href: '/ministry/schools', icon: School, label: t('ministry.allSchools') },
        { href: '/ministry/export', icon: Download, label: t('ministry.reportExport') },
      ],
    },
    {
      label: 'مدیریت',
      items: [
        { href: '/ministry/users', icon: Users, label: t('ministry.userManagement') },
        { href: '/ministry/announcements', icon: Bell, label: t('navigation.announcements') },
        { href: '/ministry/documents', icon: FileDown, label: t('navigation.documents') },
        { href: '/ministry/deadlines', icon: Calendar, label: t('navigation.deadlines') },
      ],
    },
  ];

  return (
    <>
      <RoleLayout
        homeHref="/ministry"
        navAriaLabel="منوی وزارت"
        brand={{
          icon: Building2,
          title: 'وزارت معارف',
          subtitle: t('roles.ministry_admin'),
        }}
        groups={groups}
        onOpenCommand={openCommand}
      >
        {children}
      </RoleLayout>
    </>
  );
}
