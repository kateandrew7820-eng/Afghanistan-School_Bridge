import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Building2, ArrowLeft, Send, FileText, Bell, Calendar, Users, TrendingUp, Globe, CheckCircle, Zap, Award, Shield, Play, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { getRoleTier } from '@/lib/supabase';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background" dir="rtl">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('app.title')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/demo">
              <Button variant="ghost" size="sm">
                <Play className="h-4 w-4 ml-1" />
                حالت نمایشی
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                {t('auth.signIn')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="animate-fade-in space-y-8">
            {/* Hero icons */}
            <div className="flex justify-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur border border-primary/20 animate-slide-up">
                <School className="h-10 w-10 text-primary" />
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 backdrop-blur border border-secondary/20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Building2 className="h-10 w-10 text-secondary" />
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur border border-accent/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Globe className="h-10 w-10 text-accent" />
              </div>
            </div>

            {/* Main heading */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                مکاتب، معلمان و شاگردان را در یک سیستم هوشمند به هم وصل کنید
              </p>
              <p className="text-base text-muted-foreground/80 max-w-xl mx-auto">
                مدیریت دیجیتل معلومات مکاتب، ارسال گزارش‌ها و نظارت بر نظام آموزشی افغانستان
              </p>
            </div>

            {/* 3 Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              <Link to="/demo">
                <Button size="lg" variant="outline" className="border-2 border-primary/30 hover:bg-primary/5 group min-w-[180px]">
                  <Play className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform" />
                  حالت نمایشی
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:shadow-primary/40 group min-w-[180px]">
                  <LogIn className="h-5 w-5 ml-2" />
                  {t('auth.signIn')}
                </Button>
              </Link>
              <Link to="/login?tab=signup">
                <Button size="lg" variant="secondary" className="group min-w-[180px]">
                  <UserPlus className="h-5 w-5 ml-2" />
                  {t('auth.createAccount')}
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-8 flex justify-center gap-8 text-center">
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">۳۴</div>
                <div className="text-sm text-muted-foreground">ولایت</div>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">۱۸,۰۰۰+</div>
                <div className="text-sm text-muted-foreground">مکتب</div>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">۵۰۰,۰۰۰+</div>
                <div className="text-sm text-muted-foreground">شاگرد</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">امکانات سیستم</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">هر آنچه برای مدیریت مؤثر معلومات مکاتب نیاز دارید</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Send, title: "ارسال دیجیتل", description: "آمار، گزارش و فورم‌ها را به صورت دیجیتل ارسال کنید", variant: "primary" as const },
            { icon: TrendingUp, title: "نظارت بر پیشرفت", description: "عملکرد و روند تغییرات را پیگیری کنید", variant: "secondary" as const },
            { icon: Shield, title: "تأیید امن", description: "جریان تأیید چند سطحی با امنیت کامل", variant: "accent" as const },
            { icon: Bell, title: "اطلاع‌رسانی فوری", description: "از مهلت‌ها و تغییرات فوراً آگاه شوید", variant: "primary" as const }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="group hover:shadow-xl transition-all duration-300 border-white/10 bg-gradient-to-br hover:from-primary/5 hover:to-transparent animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardHeader>
                  <div className={`p-3 rounded-lg w-fit mb-4 bg-gradient-to-br ${
                    feature.variant === 'primary' ? 'from-primary/20 to-primary/10' :
                    feature.variant === 'secondary' ? 'from-secondary/20 to-secondary/10' :
                    'from-accent/20 to-accent/10'
                  } group-hover:shadow-lg transition-shadow`}>
                    <Icon className={`h-6 w-6 ${
                      feature.variant === 'primary' ? 'text-primary' :
                      feature.variant === 'secondary' ? 'text-secondary' :
                      'text-accent'
                    }`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-3xl border border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">چگونه کار می‌کند؟</h2>
          <p className="text-lg text-muted-foreground">جریان ساده از ثبت‌نام تا تأیید</p>
        </div>

        <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
          {[
            { num: 1, title: "ثبت‌نام", desc: "حساب خود را با معلومات مکتب بسازید" },
            { num: 2, title: "ارسال معلومات", desc: "آمار و گزارش‌ها را بارگذاری کنید" },
            { num: 3, title: "بررسی", desc: "جریان بررسی چند سطحی" },
            { num: 4, title: "تأیید", desc: "تأیید شوید و به امکانات دسترسی پیدا کنید" }
          ].map((step, idx) => (
            <div key={idx} className="relative text-center animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                  {step.num}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">چرا پل آموزش؟</h2>
          <p className="text-lg text-muted-foreground">مورد اعتماد مدیران آموزشی در سراسر افغانستان</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {[
            { icon: CheckCircle, title: "امن و محفوظ", description: "معلومات شما با بالاترین سطح امنیت محافظت می‌شود" },
            { icon: Zap, title: "سریع و آسان", description: "عملکرد بهینه برای ارسال فوری معلومات" },
            { icon: Users, title: "همکاری ساده", description: "جریان کاری چند سطحی برای تأییدات شفاف" },
            { icon: Award, title: "تأیید شده", description: "مطابق معیارهای نظام آموزشی افغانستان" }
          ].map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/5 to-secondary/5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex gap-4">
                  <div className="p-3 rounded-lg h-fit bg-gradient-to-br from-primary/20 to-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-16 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {t('app.title')} — اتصال آموزش در سراسر افغانستان</p>
          </div>
        </div>
      </footer>
    </div>
  );
}