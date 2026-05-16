import { ReactNode, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import RoleLayout, { NavGroup } from './RoleLayout';
import { ScopeChip } from '@/components/ScopeChip';
import {
  LayoutDashboard, BarChart3, Bell, FileDown, Calendar,
  MapPin, TrendingUp, Building2,
} from 'lucide-react';

const CommandPalette = lazy(() => import('@/components/CommandPalette').then(m => ({ default: m.CommandPalette })));

interface Props { children: ReactNode; }

export default function ProvinceLayout({ children }: Props) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const openCommand = () => window.dispatchEvent(new Event('open-command-palette'));

  const groups: NavGroup[] = [
    {
      label: 'کار من',
      items: [
        { href: '/province', icon: LayoutDashboard, label: t('navigation.dashboard') },
        { href: '/province/submissions', icon: BarChart3, label: t('navigation.submissions') },
      ],
    },
    {
      label: 'داده‌ها',
      items: [
        { href: '/province/districts', icon: MapPin, label: t('province.districtOverview') },
        { href: '/province/schools', icon: Building2, label: 'مکاتب ولایت' },
        { href: '/province/analytics', icon: TrendingUp, label: t('province.analytics') },
      ],
    },
    {
      label: 'منابع',
      items: [
        { href: '/province/announcements', icon: Bell, label: t('navigation.announcements') },
        { href: '/province/documents', icon: FileDown, label: t('navigation.documents') },
        { href: '/province/deadlines', icon: Calendar, label: t('navigation.deadlines') },
      ],
    },
  ];

  return (
    <>
      <RoleLayout
        homeHref="/province"
        navAriaLabel="منوی ولایت"
        brand={{
          icon: MapPin,
          title: profile?.province || t('navigation.provinceName'),
          subtitle: t('roles.province_admin'),
        }}
        scopeChip={<ScopeChip levels={[profile?.province]} />}
        groups={groups}
        onOpenCommand={openCommand}
      >
        {children}
      </RoleLayout>
      <Suspense fallback={null}><CommandPalette /></Suspense>
    </>
  );
}
