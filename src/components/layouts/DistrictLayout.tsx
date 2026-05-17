import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import RoleLayout, { NavGroup } from './RoleLayout';
import { ScopeChip } from '@/components/ScopeChip';
import {
  LayoutDashboard, BarChart3, Bell, FileDown, Calendar,
  School, CheckSquare, MapPin,
} from 'lucide-react';


interface Props { children: ReactNode; }

export default function DistrictLayout({ children }: Props) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const openCommand = () => window.dispatchEvent(new Event('open-command-palette'));

  const groups: NavGroup[] = [
    {
      label: 'کار من',
      items: [
        { href: '/district', icon: LayoutDashboard, label: t('navigation.dashboard') },
        { href: '/district/verify', icon: CheckSquare, label: t('district.verifyData') },
        { href: '/district/submissions', icon: BarChart3, label: t('district.schoolSubmissions') },
      ],
    },
    {
      label: 'داده‌ها',
      items: [
        { href: '/district/schools', icon: School, label: t('district.schoolsManagement') },
      ],
    },
    {
      label: 'منابع',
      items: [
        { href: '/district/announcements', icon: Bell, label: t('navigation.announcements') },
        { href: '/district/documents', icon: FileDown, label: t('navigation.documents') },
        { href: '/district/deadlines', icon: Calendar, label: t('navigation.deadlines') },
      ],
    },
  ];

  return (
    <>
      <RoleLayout
        homeHref="/district"
        navAriaLabel="منوی ولسوالی"
        brand={{
          icon: MapPin,
          title: profile?.district || t('navigation.districtName'),
          subtitle: t('roles.district_admin'),
        }}
        scopeChip={<ScopeChip levels={[profile?.province, profile?.district]} />}
        groups={groups}
        onOpenCommand={openCommand}
      >
        {children}
      </RoleLayout>
    </>
  );
}
