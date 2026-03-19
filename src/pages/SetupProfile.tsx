import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import Breadcrumb from '@/components/Breadcrumb';
import PageHeader from '@/components/PageHeader';
import { Loader2, AlertCircle, Zap, ArrowRight } from 'lucide-react';

const ROLES = [
  { id: 'student', label: 'شاگرد', value: 'student' },
  { id: 'teacher', label: 'مولوی', value: 'teacher' },
  { id: 'principal', label: 'رئیس مکتب', value: 'principal' },
  { id: 'district_admin', label: 'سریرست منطقہ', value: 'district_admin' },
];

const PROVINCES = [
  'کابل',
  'پنجشیر',
  'باغلان',
  'بامیان',
  'بدخشان',
  'بغلان',
  'چغچران',
  'دایکندی',
  'غزنی',
  'فاریاب',
  'فراه',
  'قندهار',
  'قندز',
  'کاپیسا',
  'لغمان',
  'لوگر',
  'میدان وردک',
  'میمنه',
  'نیمروز',
  'ننگرهار',
  'نورستان',
  'هرات',
  'هلمند',
  'پکتیا',
  'پکتیکا',
  'پروان',
  'سمنگان',
  'سرپل',
  'سمنگان',
  'تخار',
  'ورزگان',
  'یاقاولنگ',
  'یکاولنگ',
];

export default function SetupProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  // Check if this is quick mode (for dev testing)
  const isQuickMode = searchParams.get('quickMode') === 'true';

  // Initialize form with either defaults (quick mode) or current profile
  const [formData, setFormData] = useState({
    full_name: isQuickMode ? 'سازنده توسعہ' : (profile?.full_name || ''),
    role: isQuickMode ? 'teacher' : '',
    school_name: isQuickMode ? 'مکتب توسعہ' : '',
    district: isQuickMode ? 'منطقہ توسعہ' : '',
    province: isQuickMode ? 'کابل' : '',
    phone_number: isQuickMode ? '+93 700 000 000' : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Auto-submit if in quick mode (one-click confirmation)
  useEffect(() => {
    if (isQuickMode && !isLoading) {
      // Small delay to ensure form is rendered, then auto-click submit
      const timer = setTimeout(() => {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isQuickMode]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'نام مکمل الزامی است';
    }
    if (!formData.role) {
      newErrors.role = 'نقش انتخاب کردن الزامی است';
    }
    if (!formData.school_name?.trim()) {
      newErrors.school_name = 'نام مکتب الزامی است';
    }
    if (!formData.district?.trim()) {
      newErrors.district = 'نام منطقہ الزامی است';
    }
    if (!formData.province) {
      newErrors.province = 'ولایت انتخاب کردن الزامی است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // ========================================
      // DEV MODE: Auto-verify for testing
      // Set to false for production
      // ========================================
      const DEV_MODE = import.meta.env.MODE === 'development';
      
      // Prepare profile data for upsert
      // Use upsert so it works even if profile record doesn't exist yet
      const profileData: any = {
        user_id: user.id,
        full_name: formData.full_name,
        district: formData.district,
        province: formData.province,
        role: formData.role,
        school_name: formData.school_name,
        phone_number: formData.phone_number || null,
        status: DEV_MODE ? 'verified' : 'pending_verification',
        updated_at: new Date().toISOString(),
      };
      
      // Use upsert instead of update to handle case where profile doesn't exist
      // This fixes the issue where profiles table doesn't auto-create on signup
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      // DEV MODE: Skip verification process, go directly to dashboard
      if (DEV_MODE) {
        toast({
          title: 'کامیابی',
          description: '[DEV MODE] نمونہ شما تأیید شد۔ به داشبورد منتقل می‌شود...',
        });

        // Determine dashboard route based on role
        const dashboardRoutes: Record<string, string> = {
          'student': '/school',
          'teacher': '/school',
          'principal': '/school',
          'district_admin': '/district',
          'province_admin': '/province',
          'ministry_admin': '/ministry',
        };
        
        const dashboardRoute = dashboardRoutes[formData.role] || '/school';
        
        // Redirect directly to dashboard (skip pending verification)
        setTimeout(() => {
          navigate(dashboardRoute);
        }, 500);
      } else {
        // PRODUCTION: Normal flow - user waits for admin approval
        toast({
          title: 'موفقیت',
          description: 'پروفایل شما ذخیره شد. اکنون به تایید اختیار رسانی منتظر هستید.',
        });

        // Redirect to pending verification page
        navigate('/pending-verification');
      }
    } catch (err) {
      // Extract detailed error information
      let errorMessage = 'خطایی در ذخیره پروفایل رخ داد';
      let errorDetails = '';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        errorDetails = err.toString();
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase error objects
        const errorObj = err as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
          errorDetails = JSON.stringify(errorObj, null, 2);
        }
      }
      
      console.error('❌ Profile setup error:', {
        message: errorMessage,
        details: errorDetails,
        fullError: err,
      });
      
      // Show user-friendly error message
      const userMessage = errorMessage.startsWith('$1.') 
        ? 'یکی از فیلدهای فرم نامعتبر است'
        : errorMessage;
        
      toast({
        title: 'خطا',
        description: userMessage || 'خطایی نامشخص رخ داد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Mode: Show summary and one-click enter button
  if (isQuickMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Zap className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">ورود تیز</h1>
            <p className="text-muted-foreground">
              برای تجربہ سیستم با یک کلیک وارد شوید
            </p>
          </div>

          {/* Quick Mode Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اطلاعات ورود تیز</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">نام:</span>
                  <span className="font-medium">{formData.full_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">نقش:</span>
                  <span className="font-medium">مولوی</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">مکتب:</span>
                  <span className="font-medium">{formData.school_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">ولایت:</span>
                  <span className="font-medium">{formData.province}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">منطقہ:</span>
                  <span className="font-medium">{formData.district}</span>
                </div>
              </div>

              {/* Warning Alert */}
              <Alert className="border-blue-200 bg-blue-50 mt-4">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  یہ حساب توسعہ برای سیستم کی تجربہ ہے۔ تمام ڈیٹا فوری تأیید شود۔
                </AlertDescription>
              </Alert>

              {/* One-Click Enter Button */}
              <Button
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                disabled={isLoading}
                size="lg"
                className="w-full mt-6 h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    درحال ورود...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    سیستم میں داخل ہوں
                  </>
                )}
              </Button>

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                disabled={isLoading}
                className="w-full"
              >
                ورود میں واپس آئیں
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">نمونہ مکمل کریں</h1>
          <p className="text-muted-foreground">
            براہ کرم معلومات درج کریں تاکہ آپ کا حساب تأیید ہو
          </p>
        </div>

        {/* DEV MODE WARNING */}
        {import.meta.env.MODE === 'development' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <h3 className="font-medium text-amber-900">حالت توسعہ فعال</h3>
                <p className="text-sm text-amber-800 mt-1">
                  حالت توسعہ میں، نمونہ فوری تأیید ہوگا اور داشبورد میں منتقل ہوگا۔
                  یہ صرف تجربہ کے لیے ہے۔
                </p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>معلومات صارف</CardTitle>
            <CardDescription>
              یہ معلومات مناسب رسائی کے تعین کے لیے استعمال ہوتی ہے
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">نام مکمل</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="نام اور نام خانوادہ"
                  disabled={isLoading}
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500">{errors.full_name}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">نقش</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md bg-background ${
                    errors.role ? 'border-red-500' : 'border-input'
                  }`}
                >
                  <option value="">انتخاب نقش</option>
                  {ROLES.map(role => (
                    <option key={role.id} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role}</p>
                )}
              </div>

              {/* School Name */}
              <div className="space-y-2">
                <Label htmlFor="school_name">نام مکتب</Label>
                <Input
                  id="school_name"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  placeholder="مکتب یا تعلیمی ادارے کا نام"
                  disabled={isLoading}
                  className={errors.school_name ? 'border-red-500' : ''}
                />
                {errors.school_name && (
                  <p className="text-sm text-red-500">{errors.school_name}</p>
                )}
              </div>

              {/* District */}
              <div className="space-y-2">
                <Label htmlFor="district">منطقہ</Label>
                <Input
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="منطقہ کا نام"
                  disabled={isLoading}
                  className={errors.district ? 'border-red-500' : ''}
                />
                {errors.district && (
                  <p className="text-sm text-red-500">{errors.district}</p>
                )}
              </div>

              {/* Province Selection */}
              <div className="space-y-2">
                <Label htmlFor="province">استان</Label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md bg-background ${
                    errors.province ? 'border-red-500' : 'border-input'
                  }`}
                >
                  <option value="">انتخاب استان</option>
                  {PROVINCES.map(province => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="text-sm text-red-500">{errors.province}</p>
                )}
              </div>

              {/* Phone Number (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone_number">فون نمبر (اختیاری)</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+93 123 456 7890"
                  disabled={isLoading}
                />
              </div>

              {/* Info Alert */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  جمع کرنے کے بعد، آپ کے حساب کو منظور کرنے کی ضرورت ہے۔ منظوری تک، آپ سسٹم استعمال نہیں کر سکتے۔
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال ذخیره‌سازی...
                  </>
                ) : (
                  'ادامه و ارسال برای تایید'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
