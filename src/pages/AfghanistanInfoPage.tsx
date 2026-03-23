import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Users, BookOpen, MapPin, BarChart3, Heart, ArrowRight, Clock } from 'lucide-react';

export default function AfghanistanInfoPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, role } = useAuth();

  // Mock Afghanistan education statistics
  const stats = [
    {
      icon: Building2,
      label: t('afghanistan.stats.totalSchools'),
      value: '18000+',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Users,
      label: t('afghanistan.stats.totalStudents'),
      value: '+11.7 میلیون',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: BookOpen,
      label: t('afghanistan.stats.totalTeachers'),
      value: '220,000',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: MapPin,
      label: t('afghanistan.stats.totalProvinces'),
      value: '34',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: BarChart3,
      label: t('afghanistan.stats.totalDistricts'),
      value: '421',
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
  ];

  const features = [
    {
      title: 'نظام مدیریت یکپارچه',
      description: 'تمام اطلاعات مکاتب در یک سیستم مرکزی',
      icon: BarChart3,
    },
    {
      title: 'آمار و تحلیل بلادرنگ',
      description: 'اطلاعات بلادرنگ درباره عملکرد آموزشی',
      icon: BookOpen,
    },
    {
      title: 'ارتباط بهتر',
      description: 'اطلاعیه‌ها و اسناد مرکزی برای همه مکاتب',
      icon: Users,
    },
  ];

  const handleContinue = () => {
    // Redirect to appropriate dashboard based on role
    const dashboardRoutes: Record<string, string> = {
      'teacher': '/school',
      'student': '/school',
      'principal': '/school',
      'district_admin': '/district',
      'province_admin': '/province',
      'ministry_admin': '/ministry',
    };

    const userRole = typeof role === 'string' ? role : 'teacher';
    const route = dashboardRoutes[userRole] || '/school';
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('afghanistan.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('afghanistan.description')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleContinue}>
            {t('common.close')}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="max-w-3xl mx-auto mb-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">{t('afghanistan.motivation')}</h2>
          <p className="text-lg text-muted-foreground">
            این سیستم برای بهبود نظام آموزشی و ارتباط بهتر میان تمام اجزاء نظام تعلیمی افغانستان ایجاد شده است.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className={`inline-flex p-3 rounded-lg ${stat.bg} mb-4`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">ویژگی‌های اصلی سیستم</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="inline-flex p-2 bg-primary/10 rounded-lg mb-4 w-fit">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Approval Status */}
        <div className="max-w-2xl mx-auto mb-12">
          <Alert className="border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>وضعیت حساب شما:</strong> {t('profileCompletion.awaitingApproval')}
            </AlertDescription>
          </Alert>
        </div>

        {/* Information Cards */}
        <div className="max-w-3xl mx-auto grid gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نام شما</CardTitle>
              <CardDescription>{profile?.full_name || 'بدون نام'}</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نقش شما</CardTitle>
              <CardDescription>
                {typeof role === 'string' && t(`roles.${role}`) || 'نامشخص'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مکتب</CardTitle>
              <CardDescription>{profile?.school_name || 'نیمشخص'}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">{t('afghanistan.readyToContinue')}</h3>
            <p className="text-muted-foreground">{t('afghanistan.returnWhenReady')}</p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleContinue}
              className="gap-2"
            >
              {t('afghanistan.backToDashboard')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
