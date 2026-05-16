import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, BarChart3, FileText, ClipboardList, Bell, FileDown,
  Calendar, School, Map, MapPin, Users, Download, TrendingUp, HelpCircle, Search,
} from 'lucide-react';

interface Item {
  id: string; label: string; href: string; icon: any; tier: 'school' | 'district' | 'province' | 'ministry' | 'all';
}

const ITEMS: Item[] = [
  // School
  { id: 'sch-d', label: 'داشبورد مکتب', href: '/school', icon: LayoutDashboard, tier: 'school' },
  { id: 'sch-st', label: 'ارسال آمار', href: '/school/statistics', icon: BarChart3, tier: 'school' },
  { id: 'sch-rp', label: 'ارسال گزارش‌ها', href: '/school/reports', icon: FileText, tier: 'school' },
  { id: 'sch-fm', label: 'ارسال فورم‌ها', href: '/school/forms', icon: ClipboardList, tier: 'school' },
  { id: 'sch-an', label: 'اطلاعیه‌ها', href: '/school/announcements', icon: Bell, tier: 'school' },
  { id: 'sch-doc', label: 'اسناد', href: '/school/documents', icon: FileDown, tier: 'school' },
  { id: 'sch-dl', label: 'فرصت‌ها', href: '/school/deadlines', icon: Calendar, tier: 'school' },
  // District
  { id: 'd-d', label: 'داشبورد ولسوالی', href: '/district', icon: LayoutDashboard, tier: 'district' },
  { id: 'd-sub', label: 'ارسال‌های ولسوالی', href: '/district/submissions', icon: BarChart3, tier: 'district' },
  { id: 'd-vf', label: 'تأیید داده‌ها', href: '/district/verify', icon: ClipboardList, tier: 'district' },
  { id: 'd-sc', label: 'مکاتب ولسوالی', href: '/district/schools', icon: School, tier: 'district' },
  // Province
  { id: 'p-d', label: 'داشبورد ولایت', href: '/province', icon: LayoutDashboard, tier: 'province' },
  { id: 'p-ds', label: 'ولسوالی‌ها', href: '/province/districts', icon: MapPin, tier: 'province' },
  { id: 'p-sc', label: 'مکاتب ولایت', href: '/province/schools', icon: School, tier: 'province' },
  { id: 'p-an', label: 'تحلیل ولایت', href: '/province/analytics', icon: TrendingUp, tier: 'province' },
  { id: 'p-sub', label: 'ارسال‌های ولایت', href: '/province/submissions', icon: BarChart3, tier: 'province' },
  // Ministry
  { id: 'm-d', label: 'داشبورد وزارت', href: '/ministry', icon: LayoutDashboard, tier: 'ministry' },
  { id: 'm-an', label: 'تحلیل ملی', href: '/ministry/analytics', icon: TrendingUp, tier: 'ministry' },
  { id: 'm-pr', label: 'ولایات', href: '/ministry/provinces', icon: Map, tier: 'ministry' },
  { id: 'm-us', label: 'مدیریت کاربران', href: '/ministry/users', icon: Users, tier: 'ministry' },
  { id: 'm-sc', label: 'مدیریت مکاتب', href: '/ministry/schools', icon: School, tier: 'ministry' },
  { id: 'm-ex', label: 'خروجی‌گیری', href: '/ministry/export', icon: Download, tier: 'ministry' },
  // Common
  { id: 'help', label: 'راهنما', href: '/help', icon: HelpCircle, tier: 'all' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { roleTier } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    const onOpenEvent = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpenEvent);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpenEvent);
    };
  }, []);

  const visible = ITEMS.filter(i => i.tier === 'all' || i.tier === roleTier);
  const go = (href: string) => { setOpen(false); navigate(href); };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <Command className="rounded-xl border bg-card shadow-2xl overflow-hidden" dir="rtl" label="جستجو و دستورات">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input placeholder="جستجو، صفحات، اقدامات..." className="flex-1 bg-transparent outline-none text-sm py-2" />
            <kbd className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">Esc</kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="text-center text-sm text-muted-foreground py-6">نتیجه‌ای یافت نشد</Command.Empty>
            <Command.Group heading="رفتن به..." className="text-xs text-muted-foreground">
              {visible.map(it => (
                <Command.Item key={it.id} value={it.label} onSelect={() => go(it.href)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm aria-selected:bg-muted">
                  <it.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{it.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
          <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground flex justify-between">
            <span>برای جستجو تایپ کنید</span>
            <span>⌘K برای باز/بسته کردن</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
