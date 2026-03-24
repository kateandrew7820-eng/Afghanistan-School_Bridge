import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Building2, ArrowLeft, Send, Bell, Users, TrendingUp, Globe, CheckCircle, Zap, Award, Shield, Play, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';

export default function Index() {
  const { t } = useTranslation();
  const { user, roleTier, loading } = useAuth();

  const getDashboardRoute = (): string => {
    switch (roleTier) {
      case 'school': return '/school';
      case 'district': return '/district';
      case 'province': return '/province';
      case 'ministry': return '/ministry';
      default: return '/login';
    }
  };

  if (user && !loading && roleTier) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const features = [
    { icon: Send, title: "ارسال دیجیتل", desc: "آمار، گزارش و فورم‌ها را دیجیتل ارسال کنید", color: "primary" },
    { icon: TrendingUp, title: "نظارت بر پیشرفت", desc: "عملکرد و روند تغییرات را پیگیری کنید", color: "secondary" },
    { icon: Shield, title: "تأیید امن", desc: "جریان تأیید چند سطحی با امنیت کامل", color: "accent" },
    { icon: Bell, title: "اطلاع‌رسانی فوری", desc: "از مهلت‌ها و تغییرات فوراً آگاه شوید", color: "primary" },
  ] as const;

  const steps = [
    { num: 1, title: "ثبت‌نام", desc: "حساب خود را بسازید" },
    { num: 2, title: "ارسال", desc: "آمار و گزارش بارگذاری کنید" },
    { num: 3, title: "بررسی", desc: "بررسی چند سطحی" },
    { num: 4, title: "تأیید", desc: "دسترسی کامل" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary">
              <School className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-base">{t('app.title')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/demo">
              <Button variant="ghost" size="sm" className="text-xs h-8 px-3">
                <Play className="h-3.5 w-3.5 ml-1" />
                نمایشی
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="text-xs h-8 px-4">{t('auth.signIn')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex justify-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <School className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20">
              <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-secondary-foreground" />
            </div>
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight">
              {t('app.title')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              مکاتب، معلمان و شاگردان را در یک سیستم هوشمند به هم وصل کنید
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[160px] h-11">
                <Play className="h-4 w-4 ml-2" />
                حالت نمایشی
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto min-w-[160px] h-11">
                <LogIn className="h-4 w-4 ml-2" />
                {t('auth.signIn')}
              </Button>
            </Link>
            <Link to="/login?tab=signup" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto min-w-[160px] h-11">
                <UserPlus className="h-4 w-4 ml-2" />
                {t('auth.createAccount')}
              </Button>
            </Link>
          </div>

          {/* Trust numbers */}
          <div className="flex justify-center gap-8 pt-4 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">۳۴</div>
              <div className="text-xs text-muted-foreground">ولایت</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">۱۸,۰۰۰+</div>
              <div className="text-xs text-muted-foreground">مکتب</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">۵۰۰,۰۰۰+</div>
              <div className="text-xs text-muted-foreground">شاگرد</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-8">امکانات سیستم</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="border-border hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2 space-y-2">
                  <div className="p-2 rounded-lg w-fit bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-sm sm:text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-8">چگونه کار می‌کند؟</h2>
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4 max-w-3xl mx-auto">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-3">
                {s.num}
              </div>
              <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-8">چرا پل آموزش؟</h2>
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
          {[
            { icon: CheckCircle, title: "امن و محفوظ", desc: "معلومات با بالاترین سطح امنیت محافظت می‌شود" },
            { icon: Zap, title: "سریع و آسان", desc: "ارسال فوری معلومات با عملکرد بهینه" },
            { icon: Users, title: "همکاری ساده", desc: "جریان کاری چند سطحی برای تأییدات شفاف" },
            { icon: Award, title: "تأیید شده", desc: "مطابق معیارهای نظام آموزشی افغانستان" },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg h-fit bg-primary/10 shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('app.title')} — اتصال آموزش در سراسر افغانستان
        </div>
      </footer>
    </div>
  );
}
