import { ReactNode } from 'react';
import { useTranslation } from '@/contexts/LocalizationContext';
import RoleLayout, { NavGroup } from './RoleLayout';
import {
  LayoutDashboard, BarChart3, Bell, FileUp, Calendar, School, Shield,
} from 'lucide-react';


interface Props { children: ReactNode; }

export default function AdminLayout({ children }: Props) {
  const { t } = useTranslation();
  const openCommand = () => window.dispatchEvent(new Event('open-command-palette'));

  const groups: NavGroup[] = [
    {
      label: 'کار من',
      items: [
        { href: '/admin', icon: LayoutDashboard, label: t('navigation.dashboard') },
        { href: '/admin/submissions', icon: BarChart3, label: t('navigation.submissions') },
      ],
    },
    {
      label: 'مدیریت',
      items: [
        { href: '/admin/schools', icon: School, label: t('navigation.manageSchools') },
        { href: '/admin/announcements', icon: Bell, label: t('navigation.announcements') },
        { href: '/admin/documents', icon: FileUp, label: t('navigation.documents') },
        { href: '/admin/deadlines', icon: Calendar, label: t('navigation.deadlines') },
      ],
    },
  ];

  return (
    <>
      <RoleLayout
        homeHref="/admin"
        navAriaLabel="منوی مدیر"
        brand={{ icon: Shield, title: 'مدیر سیستم', subtitle: t('roles.admin') }}
        groups={groups}
        onOpenCommand={openCommand}
      >
        {children}
      </RoleLayout>
    </>
  );
}
