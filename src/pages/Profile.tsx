import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  UserCircle2,
  Lock,
  Bell,
  LogOut,
  Settings,
  FileText,
  Users,
  BarChart3,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Eye,
  Edit3,
  ChevronLeft,
  Award,
  Loader2,
  Save,
  XCircle,
} from 'lucide-react';
import { getRoleLabelFA } from '@/lib/permissions';
import { supabase } from '@/integrations/supabase/client';

type Section = 'personal' | 'security' | 'notifications' | 'settings';

type NotificationSettings = {
  email: boolean;
  system: boolean;
  submissions: boolean;
};

const NOTIFICATION_STORAGE_KEY = 'schoolbridge_notification_settings';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: true,
  system: true,
  submissions: true,
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const [activeSection, setActiveSection] = useState<Section>('personal');

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null
  );

  /**
   * Load notification preferences.
   *
   * These are intentionally stored locally because this component does not
   * have enough information about the project's database schema to safely
   * invent a notifications table/columns.
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);

      if (!stored) return;

      const parsed = JSON.parse(stored);

      setNotificationSettings({
        email:
          typeof parsed.email === 'boolean'
            ? parsed.email
            : DEFAULT_NOTIFICATION_SETTINGS.email,
        system:
          typeof parsed.system === 'boolean'
            ? parsed.system
            : DEFAULT_NOTIFICATION_SETTINGS.system,
        submissions:
          typeof parsed.submissions === 'boolean'
            ? parsed.submissions
            : DEFAULT_NOTIFICATION_SETTINGS.submissions,
      });
    } catch {
      // Ignore malformed local storage and use defaults.
    }
  }, []);

  /**
   * Handle logout safely.
   */
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  /**
   * Change password through the authenticated Supabase session.
   */
  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (!newPassword || !confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'لطفاً هر دو بخش رمز عبور را تکمیل کنید.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'رمز عبور باید حداقل ۶ کاراکتر باشد.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'رمزهای عبور مطابقت ندارند.',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordMessage({
        type: 'success',
        text: 'رمز عبور با موفقیت تغییر کرد.',
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password update failed:', error);

      setPasswordMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'تغییر رمز عبور انجام نشد. دوباره تلاش کنید.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  /**
   * Save notification preferences locally.
   */
  const saveNotificationSettings = () => {
    setIsSavingNotifications(true);
    setNotificationMessage(null);

    try {
      localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(notificationSettings)
      );

      setNotificationMessage('تنظیمات اعلانات ذخیره شد.');

      window.setTimeout(() => {
        setNotificationMessage(null);
      }, 2500);
    } catch (error) {
      console.error('Notification settings save failed:', error);

      setNotificationMessage('ذخیره تنظیمات انجام نشد.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  /**
   * Only include actions that are actually known to exist.
   *
   * The original page displayed many navigation items without routes/actions,
   * which made them appear clickable while doing nothing.
   */
  const quickAccessItems = useMemo(
    () => [
      {
        label: 'صفحه اصلی',
        icon: Eye,
        action: () => navigate('/ministry'),
      },
      {
        label: 'ویرایش پروفایل',
        icon: Edit3,
        action: () => navigate('/setup-profile'),
      },
    ],
    [navigate]
  );

  const isEmailVerified = Boolean(user?.email_confirmed_at);

  return (
    <div
      className="mx-auto min-h-screen max-w-screen-2xl bg-background p-4 sm:p-6"
      dir="rtl"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
              aria-label="بازگشت"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold text-foreground">پروفایل من</h1>
              <p className="text-sm text-muted-foreground">
                مدیریت معلومات حساب کاربری و تنظیمات
              </p>
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

      <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-4">
        {/* Left Sidebar - Profile */}
        <div className="min-w-0 space-y-5 lg:col-span-1 lg:space-y-6">
          <Card className="overflow-hidden rounded-2xl border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-6">
              {/* Avatar */}
              <div className="mb-5 flex justify-center">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                    <UserCircle2 className="h-10 w-10 text-primary" />
                  </div>

                  {/* This represents account status, not online presence. */}
                  <div
                    className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-[3px] border-card ${
                      profile?.status === 'active'
                        ? 'bg-emerald-500'
                        : 'bg-muted-foreground'
                    }`}
                    title={
                      profile?.status === 'active'
                        ? 'حساب فعال'
                        : 'وضعیت حساب'
                    }
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="mb-6 space-y-2 text-center">
                <h2 className="break-words text-xl font-bold text-card-foreground">
                  {profile?.full_name || 'نام ثبت نشده'}
                </h2>

                <p className="text-sm font-medium text-primary">
                  {getRoleLabelFA(role)}
                </p>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {user?.email || 'ثبت نشده'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{profile?.phone_number || 'ثبت نشده'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{profile?.province || 'ثبت نشده'}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/setup-profile')}
                variant="outline"
                className="mt-5 w-full gap-2"
              >
                <Edit3 className="h-4 w-4" />
                ویرایش پروفایل
              </Button>
            </CardContent>
          </Card>

          {/* Section Menu */}
          <div className="space-y-2">
            {[
              {
                id: 'personal' as Section,
                label: 'اطلاعات شخصی',
                icon: UserCircle2,
              },
              {
                id: 'security' as Section,
                label: 'امنیت و حساب کاربری',
                icon: Lock,
              },
              {
                id: 'notifications' as Section,
                label: 'تنظیمات اعلانات',
                icon: Bell,
              },
              {
                id: 'settings' as Section,
                label: 'تنظیمات سیستم',
                icon: Settings,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full rounded-lg border px-4 py-3 text-right transition-all ${
                    isActive
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-transparent text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
            className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}

            {isLoggingOut ? 'در حال خروج...' : 'خروج از سیستم'}
          </Button>
        </div>

        {/* Main Content */}
        <div className="min-w-0 space-y-5 lg:col-span-2 lg:space-y-6">
          {/* Personal Info */}
          {activeSection === 'personal' && (
            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardHeader className="border-b border-border">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                  اطلاعات شخصی
                </h3>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem
                    label="نام کامل"
                    value={profile?.full_name}
                  />

                  <InfoItem
                    label="ایمیل"
                    value={user?.email}
                  />

                  <InfoItem
                    label="شماره تماس"
                    value={profile?.phone_number}
                  />

                  <InfoItem
                    label="نقش"
                    value={getRoleLabelFA(role)}
                  />

                  <InfoItem
                    label="ولایت"
                    value={profile?.province}
                  />

                  <InfoItem
                    label="ولسوالی"
                    value={profile?.district}
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <Button
                    onClick={() => navigate('/setup-profile')}
                    variant="outline"
                    className="gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    ویرایش معلومات
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardHeader className="border-b border-border">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <Lock className="h-5 w-5 text-primary" />
                  امنیت و حساب کاربری
                </h3>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                {/* Account Status */}
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm text-muted-foreground">
                    وضعیت حساب
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-400">
                      {profile?.status || 'فعال'}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  </div>
                </div>

                {/* Email Verification */}
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm text-muted-foreground">
                    تأیید. ایمیل
                  </span>

                  {isEmailVerified ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="text-sm font-medium">تأیید شده</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400">
                      <span className="text-sm font-medium">تأیید نشده</span>
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Change Password */}
                <div className="space-y-4 border-t border-border pt-6">
                  <div>
                    <h4 className="font-medium text-card-foreground">
                      تغییر رمز عبور
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      رمز عبور جدید خود را وارد کنید.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="رمز عبور جدید"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="تکرار رمز عبور جدید"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  {passwordMessage && (
                    <div
                      className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                        passwordMessage.type === 'success'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-destructive/30 bg-destructive/10 text-destructive'
                      }`}
                    >
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}

                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="w-full gap-2"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}

                    {isChangingPassword
                      ? 'در حال تغییر...'
                      : 'تغییر رمز عبور'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardHeader className="border-b border-border">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <Bell className="h-5 w-5 text-primary" />
                  تنظیمات اعلانات
                </h3>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <NotificationToggle
                  label="اعلانات ایمیلی"
                  checked={notificationSettings.email}
                  onChange={(checked) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      email: checked,
                    }))
                  }
                />

                <NotificationToggle
                  label="اعلانات سیستم"
                  checked={notificationSettings.system}
                  onChange={(checked) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      system: checked,
                    }))
                  }
                />

                <NotificationToggle
                  label="اعلانات ارسال‌ها"
                  checked={notificationSettings.submissions}
                  onChange={(checked) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      submissions: checked,
                    }))
                  }
                />

                {notificationMessage && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                    {notificationMessage}
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <Button
                    onClick={saveNotificationSettings}
                    disabled={isSavingNotifications}
                    className="gap-2"
                  >
                    {isSavingNotifications ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}

                    ذخیره تنظیمات
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Settings */}
          {activeSection === 'settings' && (
            <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
              <CardHeader className="border-b border-border">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <Settings className="h-5 w-5 text-primary" />
                  تنظیمات سیستم
                </h3>
              </CardHeader>

              <CardContent className="space-y-3 p-6">
                <SettingRow
                  label="زبان"
                  value="فارسی (افغانستان)"
                />

                <SettingRow
                  label="منطقه زمانی"
                  value="UTC+4:30"
                />

                <SettingRow
                  label="تم"
                  value="تیره (دارک)"
                />

                <div className="rounded-lg border border-border bg-muted/60 p-3 text-xs text-muted-foreground">
                  تنظیمات سیستم در نسخه فعلی فقط نمایش داده می‌شوند و هنوز
                  قابلیت تغییر از این صفحه را ندارند.
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Quick Access */}
        <div className="min-w-0 lg:col-span-1">
          <Card className="overflow-hidden rounded-2xl border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="border-b border-border">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <Zap className="h-4 w-4 text-primary" />
                دسترسی سریع
              </h3>
            </CardHeader>

            <CardContent className="space-y-2 p-4">
              {quickAccessItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full rounded-lg px-3 py-2 text-right text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
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

/* -------------------------------------------------------------------------- */
/* Reusable UI helpers                                                        */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </label>

      <p className="mt-1 break-words font-medium text-foreground">
        {value || 'ثبت نشده'}
      </p>
    </div>
  );
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
      <span className="text-sm text-muted-foreground">{label}</span>

      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function NotificationToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg bg-muted p-3 transition-colors hover:bg-muted/80">
      <span className="text-sm text-muted-foreground">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded"
      />
    </label>
  );
}
