import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, Building2, TrendingUp, Crown, User } from 'lucide-react';

const DEMO_ROLES = [
  {
    id: 'teacher',
    label: 'معلم',
    description: 'صاحب صلاحیت معلم - دسترسی به داشبرد مکتب',
    icon: User,
    tier: 'school',
  },
  {
    id: 'principal',
    label: 'مدیر',
    description: 'صاحب صلاحیت مدیر مکتب - دسترسی کامل به داشبرد مکتب',
    icon: Users,
    tier: 'school',
  },
  {
    id: 'district_admin',
    label: 'مسئول منطقه',
    description: 'صاحب صلاحیت مسئول آموزش و پرورش منطقه',
    icon: Building2,
    tier: 'district',
  },
  {
    id: 'province_admin',
    label: 'مسئول استان',
    description: 'صاحب صلاحیت مسئول آموزش و پرورش استان',
    icon: TrendingUp,
    tier: 'province',
  },
  {
    id: 'ministry_admin',
    label: 'مسئول وزارت',
    description: 'صاحب صلاحیت مسئول وزارت آموزش و پرورش',
    icon: Crown,
    tier: 'ministry',
  },
];

export default function Demo() {
  const navigate = useNavigate();
  const { setDemoMode } = useAuth();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSelectRole = async (roleId: string) => {
    const role = DEMO_ROLES.find(r => r.id === roleId);
    if (!role) return;

    // Set demo mode in auth context
    setDemoMode(roleId as any, role.tier as any);

    // Navigate to appropriate dashboard
    const dashboardRoutes: Record<string, string> = {
      'school': '/school',
      'district': '/district',
      'province': '/province',
      'ministry': '/ministry',
    };

    navigate(dashboardRoutes[role.tier]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center gap-3">
            <Building2 className="h-12 w-12 text-primary" />
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{t('app.title')}</h1>
          <p className="text-lg text-muted-foreground">حالت نمایشی و تست (Demo Mode)</p>
        </div>

        {/* Warning Banner */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>⚠️ حالت توسعه:</strong> این صفحه فقط برای توسعه و تست است. در محیط تولید در دسترس نیست. هیچ داده واقعی ذخیره نمی‌شود.
          </AlertDescription>
        </Alert>

        {/* Role Selection Grid */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">نقش خود را انتخاب کنید:</h2>
            <p className="text-sm text-muted-foreground mb-6">
              نقشی را انتخاب کنید تا داشبرد مربوط به آن نقش را مشاهده کنید:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_ROLES.map((role) => {
              const IconComponent = role.icon;
              return (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all ${
                    selectedRole === role.id
                      ? 'border-primary border-2 bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{role.label}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {role.description}
                        </CardDescription>
                      </div>
                      <IconComponent className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center pt-4">
          <Button
            size="lg"
            disabled={!selectedRole}
            onClick={() => selectedRole && handleSelectRole(selectedRole)}
            className="min-w-[200px]"
          >
            {selectedRole ? 'ورود به داشبرد' : 'نقش را انتخاب کنید'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/login')}
            className="min-w-[200px]"
          >
            بازگشت به ورود
          </Button>
        </div>

        {/* Info Footer */}
        <div className="bg-muted/50 rounded-lg p-4 text-center text-xs text-muted-foreground">
          <p>
            این حالت نمایشی داده‌های شبیه‌سازی شده استفاده می‌کند.
            <br />
            برای دسترسی واقعی، لطفاً از حساب واقعی خود استفاده کنید.
          </p>
        </div>
      </div>
    </div>
  );
}
