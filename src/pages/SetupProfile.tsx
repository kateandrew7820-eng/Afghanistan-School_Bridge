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
import { useAPIError } from '@/hooks/useAPIError';
import { useErrorToast } from '@/lib/errorToast';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import { validateField, validateForm as validateFormFields } from '@/lib/validation';

const ROLES = [
  { id: 'student', label: 'شاگرد', value: 'student' },
  { id: 'teacher', label: 'معلم', value: 'teacher' },
  { id: 'principal', label: 'مدیر مکتب', value: 'principal' },
  { id: 'district_admin', label: 'رئیس معارف', value: 'district_admin' },
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
  const { executeWithErrorHandling } = useAPIError();
  const { showErrorToast, showSuccessToast } = useErrorToast();

  // Check if this is quick mode (for dev testing)
  const isQuickMode = searchParams.get('quickMode') === 'true';

  // Initialize form with either defaults (quick mode) or current profile
  const [formData, setFormData] = useState({
    full_name: isQuickMode ? 'سازنده توسعه' : (profile?.full_name || ''),
    role: isQuickMode ? 'teacher' : '',
    school_name: isQuickMode ? 'مکتب توسعه' : '',
    district: isQuickMode ? 'ناحیه تجربه' : '',
    province: isQuickMode ? 'کابل' : '',
    phone_number: isQuickMode ? '+93 700 000 000' : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
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
    // Mark field as touched and clear its error
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    // Mark as touched on blur
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    // Validate single field on blur
    validateSingleField(name);
  };

  const validateSingleField = (fieldName: string): boolean => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'full_name':
        if (!formData.full_name?.trim()) {
          newErrors.full_name = 'نام مکمل الزامی است';
        } else {
          delete newErrors.full_name;
        }
        break;
      case 'role':
        if (!formData.role) {
          newErrors.role = 'نقش انتخاب کردن الزامی است';
        } else {
          delete newErrors.role;
        }
        break;
      case 'school_name':
        if (!formData.school_name?.trim()) {
          newErrors.school_name = 'نام مکتب الزامی است';
        } else {
          delete newErrors.school_name;
        }
        break;
      case 'district':
        if (!formData.district?.trim()) {
          newErrors.district = 'نام ناحیه الزامی است';
        } else {
          delete newErrors.district;
        }
        break;
      case 'province':
        if (!formData.province) {
          newErrors.province = 'ولایت انتخاب کردن الزامی است';
        } else {
          delete newErrors.province;
        }
        break;
    }

    setErrors(newErrors);
    return !newErrors[fieldName];
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
      newErrors.district = 'نام ناحیه الزامی است';
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
      showErrorToast('خطای اعتبارسنجی', 'لطفاً تمام فیلدهای الزامی را پر کنید');
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
      
      // Use executeWithErrorHandling for API call with automatic error handling
      const { error } = await executeWithErrorHandling(
        () => supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'user_id' })
      );

      if (error) {
        throw error;
      }

      // DEV MODE: Skip verification process, go directly to dashboard
      if (DEV_MODE) {
        showSuccessToast('موفق', '[حالت توسعه] پروفایل شما تأیید شد. به صفحه اصلی منتقل می‌شود...');

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
        showSuccessToast('موفقیت', 'پروفایل شما ذخیره شد. اکنون به تایید اختیار رسانی منتظر هستید.');

        // Redirect to pending verification page
        navigate('/pending-verification');
      }
    } catch (err) {
      // Error is already handled by executeWithErrorHandling and showErrorToast
      // This catch is for any unexpected errors
      console.error('Unexpected error:', err);
      showErrorToast('خطا', 'خطایی در ذخیره پروفایل رخ داد. دوباره تلاش کنید.');
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
            <h1 className="text-3xl font-bold">ورود سریع</h1>
            <p className="text-muted-foreground">
              برای تجربه سیستم با یک کلیک وارد شوید
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
                  <span className="font-medium">معلم</span>
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
                  <span className="text-muted-foreground">ناحیه:</span>
                  <span className="font-medium">{formData.district}</span>
                </div>
              </div>

              {/* Warning Alert */}
              <Alert className="border-blue-200 bg-blue-50 mt-4">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  این حساب برای تجربه سیستم است. تمام داده‌ها فوری تأیید می‌شود.
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
                    ورود به سیستم
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
               بازگشت 
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
          <h1 className="text-3xl font-bold">پروفایل خود را تکمیل کنید</h1>
          <p className="text-muted-foreground">
            لطفاً معلومات خود را وارد کنید تا حساب شما تأیید شود
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
                <h3 className="font-medium text-amber-900">حالت توسعه فعال</h3>
                <p className="text-sm text-amber-800 mt-1">
                  در حالت توسعه، پروفایل شما فوری تأیید می‌شود و به صفحه اصلی منتقل می‌شویم.
                  این تنها برای تجربه است.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>معلومات کاربر</CardTitle>
            <CardDescription>
              این معلومات برای تعیین سطح دسترسی درست استفاده می‌شود
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Summary */}
              {Object.keys(errors).length > 0 && (
                <FormErrorSummary errors={Object.values(errors)} />
              )}

              {/* Full Name */}
              <FormFieldWrapper 
                label="نام مکمل" 
                error={touched.full_name ? errors.full_name : undefined}
              >
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="نام و نام‌خانوادگی"
                  disabled={isLoading}
                  aria-invalid={!!errors.full_name}
                />
              </FormFieldWrapper>

              {/* Role Selection */}
              <FormFieldWrapper 
                label="نقش" 
                error={touched.role ? errors.role : undefined}
              >
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md bg-background ${
                    errors.role ? 'border-red-500' : 'border-input'
                  }`}
                  aria-invalid={!!errors.role}
                >
                  <option value="">انتخاب نقش</option>
                  {ROLES.map(role => (
                    <option key={role.id} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </FormFieldWrapper>

              {/* School Name */}
              <FormFieldWrapper 
                label="نام مکتب" 
                error={touched.school_name ? errors.school_name : undefined}
              >
                <Input
                  id="school_name"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="نام مکتب یا موسسه آموزشی"
                  disabled={isLoading}
                  aria-invalid={!!errors.school_name}
                />
              </FormFieldWrapper>

              {/* District */}
              <FormFieldWrapper 
                label="ناحیه" 
                error={touched.district ? errors.district : undefined}
              >
                <Input
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="نام ناحیه"
                  disabled={isLoading}
                  aria-invalid={!!errors.district}
                />
              </FormFieldWrapper>

              {/* Province Selection */}
              <FormFieldWrapper 
                label="ولایت" 
                error={touched.province ? errors.province : undefined}
              >
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md bg-background ${
                    errors.province ? 'border-red-500' : 'border-input'
                  }`}
                  aria-invalid={!!errors.province}
                >
                  <option value="">انتخاب ولایت</option>
                  {PROVINCES.map(province => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </FormFieldWrapper>

              {/* Phone Number (Optional) */}
              <FormFieldWrapper 
                label="شماره تلفن (اختیاری)" 
              >
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+93 123 456 7890"
                  disabled={isLoading}
                />
              </FormFieldWrapper>

              {/* Info Alert */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  پس از ارسال، حساب شما باید توسط مدیر تأیید شود. تا زمان تأیید، نمی‌توانید از سیستم استفاده کنید.
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
                  'ادامه و ارسال برای تأیید'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
