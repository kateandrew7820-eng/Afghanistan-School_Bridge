import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  Building2,
  Users,
  BookOpen,
  MapPin,
  BarChart3,
  Heart,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, role } = useAuth();

  const dashboardRoutes: Record<string, string> = {
    teacher: '/school',
    student: '/school',
    principal: '/school',
    district_admin: '/district',
    province_admin: '/province',
    ministry_admin: '/ministry',
  };

  const userRole = typeof role === 'string' ? role : 'teacher';

  const handleContinue = () => {
    navigate(dashboardRoutes[userRole] || '/school');
  };

  const stats = [
    {
      icon: Building2,
      label: t('afghanistan.stats.totalSchools'),
      value: '+18000',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Users,
      label: t('afghanistan.stats.totalStudents'),
      value: '+11.7M',
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: BookOpen,
      label: t('afghanistan.stats.totalTeachers'),
      value: '+220,000',
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      icon: MapPin,
      label: t('afghanistan.stats.totalProvinces'),
      value: '34',
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      icon: BarChart3,
      label: t('afghanistan.stats.totalDistricts'),
      value: '421',
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
  ];

  const features = [
    {
      title: 'نظام مدیریت یکپارچه',
      description: 'تمام اطلاعات آموزشی در یک سیستم مرکزی',
      icon: BarChart3,
    },
    {
      title: 'آمار و تحلیل بلادرنگ',
      description: 'داده‌های زنده از عملکرد مکاتب',
      icon: BookOpen,
    },
    {
      title: 'ارتباط بهتر',
      description: 'اطلاعیه‌ها و هماهنگی میان تمام سطوح',
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <Helmet>
        <title>پل آموزش افغانستان — پورتال داده‌های مکاتب</title>
        <meta name="description" content="پورتال دیجیتال داده‌های مکاتب افغانستان؛ یکپارچه‌سازی آمار، گزارش‌ها و فورم‌ها از مکتب تا وزارت معارف." />
        <link rel="canonical" href="https://schoolbridge-afg.lovable.app/" />
        <meta property="og:title" content="پل آموزش افغانستان — پورتال داده‌های مکاتب" />
        <meta property="og:description" content="پورتال دیجیتال داده‌های مکاتب افغانستان؛ یکپارچه‌سازی آمار، گزارش‌ها و فورم‌ها از مکتب تا وزارت معارف." />
        <meta property="og:url" content="https://schoolbridge-afg.lovable.app/" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-background/80 via-card/70 to-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              {t('afghanistan.title')}
            </h1>

            <p className="text-sm text-muted-foreground">
              {t('afghanistan.description')}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleContinue}
            className="hover:bg-primary hover:text-white transition"
          >
            {t('common.close')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-14">

        {/* Hero / Motivation */}
        <div className="max-w-3xl mx-auto text-center mb-14 space-y-6">

          {/* Icon Badge */}
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary/15 to-primary/10 shadow-sm">
            <Heart className="w-7 h-7 text-primary animate-pulse" />
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            ساخت آینده آموزش در افغانستان
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground leading-relaxed">
            این سیستم برای اتصال تمام سطوح نظام آموزشی افغانستان طراحی شده است؛
            با هدف توانمندسازی مکاتب، معلمان و مدیران از طریق داده‌های دقیق، لحظه‌ای و شفاف.
          </p>

          {/* Motivation line */}
          <div className="text-sm text-primary font-medium">
            «قدم‌های کوچک در آموزش، نسل‌های بزرگ تغییر را می‌سازد.»
          </div>

        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className="hover:shadow-md transition border-0">
                <CardContent className="pt-6">
                  <div className={`p-3 rounded-lg ${s.bg} inline-flex mb-3`}>
                    <Icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center mb-6">
            ویژگی‌های سیستم
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="hover:shadow-md transition border-0">
                  <CardHeader>
                    <div className="p-2 bg-primary/10 rounded-lg w-fit mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                    <CardDescription>{f.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="max-w-2xl mx-auto mb-10">
          <Alert className="bg-warning/10 border-warning/20">
            <Clock className="w-4 h-4 text-warning" />
            <AlertDescription className="text-warning">
              <strong>وضعیت حساب:</strong> {t('profileCompletion.awaitingApproval')}
            </AlertDescription>
          </Alert>
        </div>

        {/* User Info */}
        <div className="max-w-3xl mx-auto grid gap-5 mb-12">

          <Card>
            <CardHeader>
              <CardTitle>نام شما</CardTitle>
              <CardDescription>
                {profile?.full_name || 'ثبت نشده'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>نقش شما</CardTitle>
              <CardDescription>
                {(typeof role === 'string' && t(`roles.${role}`)) || 'نامشخص'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>مکتب</CardTitle>
              <CardDescription>
                {profile?.school_name || 'ثبت نشده'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold">
            آماده ادامه هستید؟
          </h3>

          <Button size="lg" onClick={handleContinue} className="gap-2">
            ورود به دشبورد
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

      </main>
    </div>
  );
}
