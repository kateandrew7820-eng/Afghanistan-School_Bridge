import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/ThemeToggle';
import { School, ArrowLeft, ArrowUpLeft, Map, Play, Clock, Building2, Users, BookOpen, MapPin, BarChart3 } from 'lucide-react';
import schoolCourtyard from '@/assets/school-courtyard.jpg';

export default function Index() {
  const { t } = useTranslation();
  const { user, profile, role } = useAuth();
  const resolvedRole = profile?.role || role;
  const homeRoute = resolvedRole === 'district_coordinator' || resolvedRole === 'district_admin' ? '/district'
    : resolvedRole === 'province_coordinator' || resolvedRole === 'province_admin' ? '/province'
    : resolvedRole === 'ministry_admin' ? '/ministry' : '/school';
  const stats = [
    { icon: Building2, label: t('afghanistan.stats.totalSchools'), value: '۱۸٬۰۰۰+' },
    { icon: Users, label: t('afghanistan.stats.totalStudents'), value: '۱۱٫۷ میلیون+' },
    { icon: BookOpen, label: t('afghanistan.stats.totalTeachers'), value: '۲۲۰٬۰۰۰+' },
    { icon: MapPin, label: t('afghanistan.stats.totalProvinces'), value: '۳۴' },
    { icon: BarChart3, label: t('afghanistan.stats.totalDistricts'), value: '۴۲۱' },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Helmet>
        <title>پل آموزش افغانستان — پورتال داده‌های مکاتب</title>
        <meta name="description" content="پورتال دیجیتال داده‌های مکاتب افغانستان؛ یکپارچه‌سازی آمار، گزارش‌ها و فورم‌ها از مکتب تا وزارت معارف." />
        <link rel="canonical" href="https://schoolbridge-afg.lovable.app/" />
        <meta property="og:title" content="پل آموزش افغانستان — پورتال داده‌های مکاتب" />
        <meta property="og:description" content="پورتال دیجیتال داده‌های مکاتب افغانستان؛ یکپارچه‌سازی آمار، گزارش‌ها و فورم‌ها از مکتب تا وزارت معارف." />
        <meta property="og:url" content="https://schoolbridge-afg.lovable.app/" />
      </Helmet>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <School className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-bold sm:text-lg">پل آموزش افغانستان</p>
              <p className="hidden text-xs text-muted-foreground sm:block">پورتال داده‌های مکاتب</p>
            </div>
          </Link>
          <nav aria-label="منوی اصلی" className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/roadmap">نقشه راه</Link></Button>
            <ThemeToggle />
            {user ? <Button asChild size="sm"><Link to={homeRoute}>دشبورد من</Link></Button> : <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">ورود</Link></Button>
              <Button asChild size="sm"><Link to="/signup">ثبت‌نام</Link></Button>
            </>}
          </nav>
        </div>
      </header>
      <main>
        <section className="relative isolate overflow-hidden">
          <img src={schoolCourtyard} alt="تصویر بازآفرینی‌شده از شاگردان در صحن یک مکتب افغانستان" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_55%]" />
          <div className="hero-scrim absolute inset-0 -z-10" />
          <div className="mx-auto flex min-h-[470px] max-w-7xl items-end px-5 py-10 sm:min-h-[490px] sm:items-center sm:px-8 sm:py-14">
            <div className="w-full space-y-5 text-hero-foreground sm:mr-auto sm:max-w-xl">
              <p className="flex items-center gap-2 text-sm font-medium"><span className="h-px w-7 bg-hero-foreground/60" />از مکتب تا وزارت معارف</p>
              <h1 className="text-3xl font-bold leading-snug sm:text-4xl lg:text-5xl">پل آموزش افغانستان</h1>
              <p className="max-w-lg text-base leading-loose text-hero-foreground/90 sm:text-lg">برای آینده‌ای روشن‌تر؛ مکاتب، معلمان و مدیران را با اطلاعات دقیق و شفاف به هم پیوند می‌دهیم.</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="px-5"><Link to={user ? homeRoute : '/login'}>{user ? 'دشبورد من' : 'ورود به پورتال'}<ArrowLeft /></Link></Button>
                <Button asChild variant="ghost" size="lg" className="border border-hero-foreground/50 px-5 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"><Link to="/demo"><Play />حالت نمایشی</Link></Button>
              </div>
            </div>
          </div>
        </section>
        <section className="border-b bg-card" aria-label="آمار عمومی معارف افغانستان">
          <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
            <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
              {stats.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 border-s border-border ps-4 first:border-s-0 first:ps-0">
                <Icon className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
                <div><p className="text-xl font-bold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              </div>)}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">آمار عمومی؛ نمایانگر داده‌های زنده پورتال نیست.</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-14">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-primary">یک پیوند، یک آینده</p>
            <h2>هر مکتب، بخشی از آینده</h2>
            <p className="max-w-lg text-sm text-muted-foreground">اطلاعات آموزشی از مکتب و ولسوالی تا ولایت و وزارت معارف؛ با هدف تصمیم‌گیری بهتر و پشتیبانی از آموزش در سراسر افغانستان.</p>
            <Button asChild variant="outline"><Link to="/roadmap"><Map />مشاهده نقشه راه<ArrowUpLeft /></Link></Button>
          </div>
          <div className="border-t border-border pt-6 lg:border-s lg:border-t-0 lg:ps-10 lg:pt-0">
            <p className="mb-3 text-xs font-semibold text-accent">حالت نمایشی</p>
            <h2 className="mb-3">از نگاه نقش خود ببینید</h2>
            <p className="mb-5 text-sm text-muted-foreground">مکتب، ولسوالی، ولایت یا وزارت معارف</p>
            <Button asChild><Link to="/demo"><Play />شروع نمایش<ArrowLeft /></Link></Button>
          </div>
        </section>
        {user && profile && <section className="mx-auto max-w-7xl space-y-4 px-5 pb-10 sm:px-8">
          {profile.status === 'pending' && <Alert className="border-warning/30 bg-warning/10"><Clock className="h-4 w-4 text-warning" /><AlertDescription><strong>وضعیت حساب:</strong> {t('profileCompletion.awaitingApproval')}</AlertDescription></Alert>}
          <dl className="grid gap-4 border-t py-5 text-sm sm:grid-cols-3">
            <div><dt className="text-muted-foreground">نام شما</dt><dd className="font-medium">{profile.full_name || 'ثبت نشده'}</dd></div>
            <div><dt className="text-muted-foreground">نقش شما</dt><dd className="font-medium">{typeof role === 'string' ? t(`roles.${role}`) : 'نامشخص'}</dd></div>
            <div><dt className="text-muted-foreground">مکتب</dt><dd className="font-medium">{profile.school_name || 'ثبت نشده'}</dd></div>
          </dl>
        </section>}
      </main>
      <footer className="border-t px-5 py-5"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><p>پل آموزش افغانستان · پورتال داده‌های مکاتب</p><Link to="/help" className="hover:text-primary">راهنمای پورتال</Link></div></footer>
    </div>
  );
}
