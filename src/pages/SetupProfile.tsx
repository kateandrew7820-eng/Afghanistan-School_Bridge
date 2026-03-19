import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

const ROLES = [
  { id: 'student', label: 'دانش‌آموز', value: 'student' },
  { id: 'teacher', label: 'معلم', value: 'teacher' },
  { id: 'principal', label: 'مدیر مدرسه', value: 'principal' },
  { id: 'district_admin', label: 'مسئول منطقه', value: 'district_admin' },
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
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    role: '',
    school_name: '',
    district: '',
    province: '',
    phone_number: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

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
      newErrors.full_name = 'نام کامل الزامی است';
    }
    if (!formData.role) {
      newErrors.role = 'انتخاب نقش الزامی است';
    }
    if (!formData.school_name?.trim()) {
      newErrors.school_name = 'نام مدرسه الزامی است';
    }
    if (!formData.district?.trim()) {
      newErrors.district = 'نام منطقه الزامی است';
    }
    if (!formData.province) {
      newErrors.province = 'انتخاب استان الزامی است';
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
      // Update user profile with setup information
      // Use type casting to handle schema version mismatch during development
      const updateData: any = {
        full_name: formData.full_name,
        district: formData.district,
        province: formData.province,
      };
      
      // Add new fields only if they're in the database schema
      // (They may not be if migration hasn't been deployed)
      updateData.role = formData.role;
      updateData.school_name = formData.school_name;
      updateData.phone_number = formData.phone_number || null;
      updateData.status = 'pending_verification';
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'موفقیت',
        description: 'پروفایل شما ذخیره شد. اکنون به تایید اختیار رسانی منتظر هستید.',
      });

      // Redirect to pending verification page
      navigate('/pending-verification');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطایی در ذخیره پروفایل رخ داد';
      console.error('Setup error:', err);
      toast({
        title: 'خطا',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">تکمیل پروفایل</h1>
          <p className="text-muted-foreground">
            لطفاً اطلاعات خود را وارد کنید تا حساب کاربری شما تایید شود
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>اطلاعات کاربر</CardTitle>
            <CardDescription>
              این اطلاعات برای تعیین دسترسی‌های مناسب استفاده می‌شود
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">نام کامل</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="نام و نام خانوادگی"
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
                <Label htmlFor="school_name">نام مدرسه</Label>
                <Input
                  id="school_name"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  placeholder="نام مدرسه یا مؤسسه آموزشی"
                  disabled={isLoading}
                  className={errors.school_name ? 'border-red-500' : ''}
                />
                {errors.school_name && (
                  <p className="text-sm text-red-500">{errors.school_name}</p>
                )}
              </div>

              {/* District */}
              <div className="space-y-2">
                <Label htmlFor="district">منطقه</Label>
                <Input
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="نام منطقه"
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
                <Label htmlFor="phone_number">شماره تماس (اختیاری)</Label>
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
                  پس از ارسال، حساب شما نیاز به تایید اختیار رسانی دارد. تا زمان تایید، نمی‌توانید از سیستم استفاده کنید.
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
