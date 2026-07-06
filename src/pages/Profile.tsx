import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  ArrowLeft, Building2, Mail, MapPin, Phone, ShieldCheck, UserCircle2,
  Lock, Bell, LogOut, Settings, FileText, Users, BarChart3, Download,
  CheckCircle2, AlertCircle, Clock, Zap, Eye, Edit3, ChevronLeft,
  GraduationCap, BookOpen, Award, Badge
} from 'lucide-react';
import { getRoleLabelFA } from '@/lib/permissions';
import { useState } from 'react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('personal');

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { id: 'personal', label: 'اطلاعات شخصی', icon: UserCircle2 },
    { id: 'security', label: 'امنیت و حساب کاربری', icon: Lock },
    { id: 'notifications', label: 'تنظیمات اعلانات', icon: Bell },
    { id: 'settings', label: 'تنظیمات سیستم', icon: Settings },
  ];

  const infoCards = [
    { label: 'تعداد مکاتب زیر نظر', value: '34', icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { label: 'ارسال‌های تأیید شده', value: '1200', icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
    { label: 'ارسال‌های در انتظار', value: '4800', icon: Clock, color: 'from-amber-500 to-orange-500' },
  ];

  const quickAccessItems = [
    { label: 'صفحه اصلی', icon: Eye, action: '/ministry' },
    { label: 'تحلیل و بررسی', icon: BarChart3 },
    { label: 'تمام مکاتب', icon: Building2 },
    { label: 'تمام ولایت‌ها', icon: MapPin },
    { label: 'ولایت‌ها و ولسوالی‌ها', icon: BookOpen },
    { label: 'مدیریت کاربران', icon: Users },
    { label: 'صدور گزارش‌ها', icon: FileText },
    { label: 'دانلود فایل‌ها', icon: Download },
    { label: 'اطلاعات فوری', icon: Zap },
    { label: 'فرصت‌ها', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">پروفایل من</h1>
              <p className="text-sm text-muted-foreground">مدیریت معلومات حساب کاربری و تنظیمات</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/')}
            className="gap-2"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
            بازگشت به داشبورد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Profile Card */}
        <div className="lg:col-span-1">
          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl sticky top-6">
            <CardContent className="p-6">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                    <UserCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-800" />
                </div>
              </div>

              {/* User Info */}
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-xl font-bold text-white">{profile?.full_name || 'نام ثبت نشده'}</h2>
                <p className="text-sm text-cyan-400 font-medium">{getRoleLabelFA(role)}</p>
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{profile?.phone_number || 'ثبت نشده'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile?.province || 'ثبت نشده'}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/setup-profile')}
                variant="outline"
                className="w-full mt-6 gap-2 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Edit3 className="h-4 w-4" />
                ویرایش پروفایل
              </Button>
            </CardContent>
          </Card>

          {/* Menu */}
          <div className="mt-6 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-right ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'text-muted-foreground hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full mt-6 gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            خروج از سیستم
          </Button>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {infoCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Card key={idx} className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Personal Info Section */}
          {activeSection === 'personal' && (
            <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
              <CardHeader className="border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5 text-cyan-400" />
                  اطلاعات شخصی
                </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">نام کامل</label>
                    <p className="mt-1 text-white font-medium">{profile?.full_name || 'ثبت نشده'}</p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">ایمیل</label>
                    <p className="mt-1 text-white font-medium">{user?.email || 'ثبت نشده'}</p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">شماره تماس</label>
                    <p className="mt-1 text-white font-medium">{profile?.phone_number || 'ثبت نشده'}</p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">نقش</label>
                    <p className="mt-1 text-white font-medium">{getRoleLabelFA(role)}</p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">ولایت</label>
                    <p className="mt-1 text-white font-medium">{profile?.province || 'ثبت نشده'}</p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">ولسوالی</label>
                    <p className="mt-1 text-white font-medium">{profile?.district || 'ثبت نشده'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
              <CardHeader className="border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-cyan-400" />
                  امنیت و حساب کاربری
                </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">وضعیت حساب</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-400">{profile?.status || 'فعال'}</span>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">تأیید ایمیل</span>
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                <Button className="w-full gap-2 bg-cyan-500 hover:bg-cyan-600">
                  <Lock className="h-4 w-4" />
                  تغییر رمز عبور
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
              <CardHeader className="border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-cyan-400" />
                  تنظیمات اعلانات
                </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                  <span className="text-sm text-muted-foreground">اعلانات ایمیلی</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                  <span className="text-sm text-muted-foreground">اعلانات سیستم</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                  <span className="text-sm text-muted-foreground">اعلانات ارسال‌ها</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </label>
              </CardContent>
            </Card>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
              <CardHeader className="border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  تنظیمات سیستم
                </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">زبان</span>
                    <span className="text-sm font-medium text-white">فارسی (افغانستان)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">منطقه زمانی</span>
                    <span className="text-sm font-medium text-white">UTC+4:30</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">تم</span>
                    <span className="text-sm font-medium text-white">تیره (دارک)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Quick Access */}
        <div className="lg:col-span-1">
          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 sticky top-6">
            <CardHeader className="border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                دسترسی سریع
              </h3>
            </CardHeader>
            <CardContent className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {quickAccessItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => item.action && navigate(item.action)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm text-muted-foreground hover:bg-slate-700/50 hover:text-cyan-400 transition-colors"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}