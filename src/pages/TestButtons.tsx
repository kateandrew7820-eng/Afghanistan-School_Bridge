import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorToast } from '@/lib/errorToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  Navigation,
  FileText,
  BarChart3,
  Users,
  Settings,
  Play,
  Loader2,
  CheckCircle,
} from 'lucide-react';

type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

export default function TestButtons() {
  const navigate = useNavigate();
  const { isDemoMode, role, roleTier } = useAuth();
  const { showSuccessToast, showErrorToast } = useErrorToast();

  // Button states
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonStatus>>({});
  const [simulationResults, setSimulationResults] = useState<Record<string, string>>({});

  const simulateButtonClick = async (buttonId: string, buttonName: string) => {
    setButtonStates(prev => ({ ...prev, [buttonId]: 'loading' }));

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));

      // Randomly succeed (85% success rate)
      if (Math.random() > 0.15) {
        setButtonStates(prev => ({ ...prev, [buttonId]: 'success' }));
        setSimulationResults(prev => ({ ...prev, [buttonId]: `✅ ${buttonName} کار کرد!` }));
        showSuccessToast('موفقیت', `${buttonName} با موفقیت انجام شد`);

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setButtonStates(prev => ({ ...prev, [buttonId]: 'idle' }));
          setSimulationResults(prev => ({ ...prev, [buttonId]: '' }));
        }, 2000);
      } else {
        throw new Error('Simulated error');
      }
    } catch (error) {
      setButtonStates(prev => ({ ...prev, [buttonId]: 'error' }));
      setSimulationResults(prev => ({ ...prev, [buttonId]: `❌ خطا: ${buttonName} ناموفق بود` }));
      showErrorToast('خطا', `خطایی در ${buttonName} رخ داد`);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [buttonId]: 'idle' }));
        setSimulationResults(prev => ({ ...prev, [buttonId]: '' }));
      }, 3000);
    }
  };

  const getButtonState = (buttonId: string) => buttonStates[buttonId] || 'idle';

  const ButtonGroup = ({
    title,
    description,
    buttons,
  }: {
    title: string;
    description: string;
    buttons: { id: string; label: string; action?: () => void; simulate?: boolean }[];
  }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {buttons.map(button => {
            const state = getButtonState(button.id);
            return (
              <div key={button.id} className="space-y-2">
                <Button
                  onClick={() => {
                    if (button.simulate) {
                      simulateButtonClick(button.id, button.label);
                    } else if (button.action) {
                      button.action();
                    }
                  }}
                  disabled={state === 'loading'}
                  variant="outline"
                  className="w-full justify-start"
                >
                  {state === 'loading' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {state === 'success' && (
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                  )}
                  {state === 'error' && (
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                  )}
                  {state !== 'loading' && state !== 'success' && state !== 'error' && (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {button.label}
                </Button>
                {simulationResults[button.id] && (
                  <p className={`text-sm font-medium ${
                    state === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {simulationResults[button.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">🧪 آزمایش دکمه‌ها و عملکردها</h1>
          <p className="text-muted-foreground">
            تمام دکمه‌ها و عملکردهای مقام خود را آزمایش کنید
          </p>

          {/* Current Role Info */}
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">مقام: {role || 'نامعلوم'}</Badge>
              <Badge variant="outline">سطح‌دسترسی: {roleTier || 'نامعلوم'}</Badge>
              {isDemoMode && <Badge className="bg-blue-600">حالت نمایشی</Badge>}
            </div>
          </div>
        </div>

        {isDemoMode && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>🎨 حالت نمایشی فعال:</strong> تمام اقدامات شبیه‌سازی‌شده هستند. هیچ داده واقعی ذخیره نمی‌شود.
            </AlertDescription>
          </Alert>
        )}

        {/* School Role Buttons */}
        {(roleTier === 'school' || !roleTier) && (
          <div className="space-y-6">
            <ButtonGroup
              title="🏫 دکمه‌های مکتب"
              description="دکمه‌ها و عملکردهای داشبرد مکتب"
              buttons={[
                {
                  id: 'submit-stats',
                  label: 'ارسال آمار',
                  action: () => navigate('/school/submit-statistics'),
                },
                {
                  id: 'submit-reports',
                  label: 'ارسال گزارش',
                  action: () => navigate('/school/submit-reports'),
                },
                {
                  id: 'submit-forms',
                  label: 'ارسال فورم‌ها',
                  action: () => navigate('/school/submit-forms'),
                },
                {
                  id: 'view-announcements',
                  label: 'مشاهده اعلانات',
                  action: () => navigate('/school/announcements'),
                },
                {
                  id: 'test-submit',
                  label: '🧪 آزمایش ارسال (شبیه‌سازی)',
                  simulate: true,
                },
                {
                  id: 'test-verify',
                  label: '🧪 آزمایش تایید (شبیه‌سازی)',
                  simulate: true,
                },
              ]}
            />
          </div>
        )}

        {/* District Role Buttons */}
        {(roleTier === 'district' || !roleTier) && (
          <div className="space-y-6">
            <ButtonGroup
              title="🔷 دکمه‌های منطقه‌آموزش‌وپرورش"
              description="دکمه‌ها و عملکردهای داشبرد منطقه"
              buttons={[
                {
                  id: 'view-submissions',
                  label: 'مشاهده ارسال‌ها',
                  action: () => navigate('/district/submissions'),
                },
                {
                  id: 'verify-data',
                  label: 'تایید اطلاعات',
                  action: () => navigate('/district/verify'),
                },
                {
                  id: 'manage-schools',
                  label: 'مدیریت مکاتب',
                  action: () => navigate('/district/schools'),
                },
                {
                  id: 'test-approve',
                  label: '🧪 آزمایش تصویب (شبیه‌سازی)',
                  simulate: true,
                },
                {
                  id: 'test-reject',
                  label: '🧪 آزمایش رد (شبیه‌سازی)',
                  simulate: true,
                },
              ]}
            />
          </div>
        )}

        {/* Province Role Buttons */}
        {(roleTier === 'province' || !roleTier) && (
          <div className="space-y-6">
            <ButtonGroup
              title="🔶 دکمه‌های ولایت"
              description="دکمه‌ها و عملکردهای داشبرد ولایت"
              buttons={[
                {
                  id: 'view-analytics',
                  label: 'مشاهده آمارشناسی',
                  action: () => navigate('/province'),
                },
                {
                  id: 'export-data',
                  label: 'صادر کردن اطلاعات',
                  simulate: true,
                },
                {
                  id: 'test-analysis',
                  label: '🧪 آزمایش تحلیل (شبیه‌سازی)',
                  simulate: true,
                },
              ]}
            />
          </div>
        )}

        {/* Ministry Role Buttons */}
        {(roleTier === 'ministry' || !roleTier) && (
          <div className="space-y-6">
            <ButtonGroup
              title="👑 دکمه‌های وزارت"
              description="دکمه‌ها و عملکردهای داشبرد وزارت"
              buttons={[
                {
                  id: 'national-analytics',
                  label: 'آمارشناسی ملی',
                  action: () => navigate('/ministry/analytics'),
                },
                {
                  id: 'manage-users',
                  label: 'مدیریت کاربران',
                  action: () => navigate('/ministry/users'),
                },
                {
                  id: 'export-reports',
                  label: 'صادر کردن گزارش‌ها',
                  action: () => navigate('/ministry/export'),
                },
                {
                  id: 'test-bulk-action',
                  label: '🧪 آزمایش اقدام دسته‌ای (شبیه‌سازی)',
                  simulate: true,
                },
              ]}
            />
          </div>
        )}

        {/* Common Actions */}
        <ButtonGroup
          title="⚙️ اقدام‌های عمومی"
          description="اقدام‌های دسترسی‌پذیر برای تمام مقام‌ها"
          buttons={[
            {
              id: 'refresh-data',
              label: 'بازخوانی اطلاعات',
              simulate: true,
            },
            {
              id: 'save-changes',
              label: 'ذخیره تغییرات',
              simulate: true,
            },
            {
              id: 'download-file',
              label: 'دانلود فایل',
              simulate: true,
            },
            {
              id: 'print-report',
              label: 'چاپ گزارش',
              simulate: true,
            },
          ]}
        />

        {/* Instructions */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              نحوه استفاده
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              ✅ <strong>دکمه‌های ملاحظ‌شده:</strong> به صفحات واقعی نیاز می‌برند و کارایی را نشان می‌دهند
            </p>
            <p>
              🧪 <strong>دکمه‌های شبیه‌سازی‌شده:</strong> برای تست کردن بازخورد بصری و وضع‌المثال‌ها طراحی شده‌اند
            </p>
            <p>
              ⏳ <strong>وقت‌تاخیری:</strong> هر دکمه یک تاخیر شبکه شبیه‌سازی‌شده (500-2000ms) دارد
            </p>
            <p>
              🎨 <strong>حالت نمایشی:</strong> در حالت نمایشی، هیچ داده واقعی ذخیره نمی‌شود
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
