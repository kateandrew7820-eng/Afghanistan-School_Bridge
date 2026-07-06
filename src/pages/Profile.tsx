import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Mail, MapPin, Phone, ShieldCheck, UserCircle2 } from 'lucide-react';
import { getRoleLabelFA } from '@/lib/permissions';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">پروفایل کاربر</p>
          <h1 className="text-3xl font-bold tracking-tight">اطلاعات کامل حساب شما</h1>
          <p className="text-muted-foreground mt-1">نمایش داده‌های شخصی، سازمانی و دسترسی‌های حساب شما</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          بازگشت به داشبورد
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{profile?.full_name || 'نام ثبت نشده'}</CardTitle>
                <p className="text-sm text-muted-foreground">{getRoleLabelFA(role)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  ایمیل
                </div>
                <p className="mt-2 font-medium">{user?.email || 'ثبت نشده'}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  شماره تماس
                </div>
                <p className="mt-2 font-medium">{profile?.phone_number || 'ثبت نشده'}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                موقعیت جغرافیایی
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">ولایت</p>
                  <p className="font-medium">{profile?.province || 'ثبت نشده'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">ولسوالی</p>
                  <p className="font-medium">{profile?.district || 'ثبت نشده'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">جزئیات سازمانی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/70 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                مکتب
              </div>
              <p className="mt-2 font-medium">{profile?.school_name || 'ثبت نشده'}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                وضعیت حساب
              </div>
              <p className="mt-2 font-medium">{profile?.status || 'در انتظار تکمیل'}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                نقش فعلی
              </div>
              <p className="mt-2 font-medium">{profile?.role || role || 'ثبت نشده'}</p>
            </div>
            <Button className="w-full" onClick={() => navigate('/setup-profile')}>
              ویرایش پروفایل
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
