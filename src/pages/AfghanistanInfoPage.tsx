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
      title: 'نظام مدیریت یک پارچه',
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

      
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مکتب</CardTitle>
              <CardDescription>{profile?.school_name || 'نیمشخص'}</CardDescription>
            </CardHeader>
          </Card>
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
