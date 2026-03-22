import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Users,
  Building2,
  TrendingUp,
  Crown,
  User,
  TestTube,
} from 'lucide-react';

// Available demo roles for testing different system access levels
const DEMO_ROLES = [
  {
    id: 'teacher',
    label: 'معلم',
    description: 'دسترسی معلم به دشبورد مکتب و مدیریت فعالیت‌های آموزشی',
    icon: User,
    tier: 'school',
  },
  {
    id: 'principal',
    label: 'مدیریت مکتب',
    description: 'مدیریت کامل مکتب، نظارت بر معلمان و فعالیت‌های آموزشی',
    icon: Users,
    tier: 'school',
  },
  {
    id: 'district_admin',
    label: 'ریاست معارف ولسوالی',
    description: 'مدیریت و نظارت بر مکاتب در سطح ولسوالی',
    icon: Building2,
    tier: 'district',
  },
  {
    id: 'province_admin',
    label: 'ریاست معارف ولایت',
    description: 'مدیریت و نظارت بر سیستم آموزشی در سطح ولایت',
    icon: TrendingUp,
    tier: 'province',
  },
  {
    id: 'ministry_admin',
    label: 'وزارت معارف',
    description: 'دسترسی کامل به دشبورد وزارت و مدیریت سیستم آموزشی کشور',
    icon: Crown,
    tier: 'ministry',
  },
];

export default function Demo() {
  const navigate = useNavigate();
  const { setDemoMode } = useAuth();
  const { t } = useTranslation();

  // Currently selected demo role
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Handles selecting a role and navigating to the correct dashboard
  const handleSelectRole = (roleId: string) => {
    const role = DEMO_ROLES.find((r) => r.id === roleId);
    if (!role) return;

    // Activate demo mode with selected role
    setDemoMode(roleId as any, role.tier as any);

    // Dashboard routes based on system hierarchy
    const dashboardRoutes: Record<string, string> = {
      school: '/school',
      district: '/district',
      province: '/province',
      ministry: '/ministry',
    };

    // Redirect user to the appropriate dashboard
    navigate(dashboardRoutes[role.tier]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background/50 to-secondary/10 p-6">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center gap-4">
            <Building2 className="h-12 w-12 text-primary animate-pulse" />
            <Users className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800">{t('app.title')}</h1>
          <p className="text-lg text-gray-500">حالت نمایشی و تست (Demo Mode)</p>
        </div>

        {/* Warning */}
        <Alert className="border-yellow-200 bg-yellow-50 rounded-lg shadow-sm">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800 ml-2">
            <strong>⚠️ حالت توسعه:</strong> این صفحه فقط برای توسعه و تست است. هیچ داده واقعی ذخیره نمی‌شود.
          </AlertDescription>
        </Alert>

        {/* Role Selection */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">مقام من</h2>
            <p className="text-gray-500 mt-2">
              مقامی را انتخاب کنید تا داشبرد مربوط به آن مقام را مشاهده کنید:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEMO_ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <Card
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-2 border-primary bg-primary/10 shadow-md'
                      : 'border border-gray-200 hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <CardHeader className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">{role.label}</CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1">
                        {role.description}
                      </CardDescription>
                    </div>
                    <Icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row md:justify-center gap-4 mt-4">
          <Button
            size="lg"
            disabled={!selectedRole}
            onClick={() => selectedRole && handleSelectRole(selectedRole)}
            className="min-w-[200px]"
          >
            {selectedRole ? 'ورود به داشبرد' : 'انتخاب مقام'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/login')}
            className="min-w-[200px]"
          >
            بازگشت به ورود
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/test-buttons')}
            className="min-w-[200px] flex items-center justify-center gap-2"
          >
            <TestTube className="h-4 w-4" /> 🧪 آزمایش دکمه‌ها و عملکردها
          </Button>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-500">
          این حالت نمایشی داده‌های شبیه‌سازی شده استفاده می‌کند. برای دسترسی واقعی، لطفاً از حساب واقعی خود استفاده کنید.
        </div>
      </div>
    </div>
  );
}
