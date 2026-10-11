import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Zap, ArrowRight, Clock, LogOut } from 'lucide-react';
import { useErrorToast } from '@/lib/errorToast';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import NavigationBackButton from '@/components/NavigationBackButton';
import { TEMPORARY_TEST_MODE, getApproverLabel } from '@/lib/testMode';
import { useQuery } from '@tanstack/react-query';
import { useDraft } from '@/hooks/useDraft';
import { useOfflineSubmissionStatus } from '@/hooks/useOfflineSubmissionStatus';
import { queueSubmissionForSync, type QueuedSubmissionResult } from '@/lib/offlineStore';
import type { Database } from '@/integrations/supabase/types';

const ROLES = [
  { id: 'student', label: 'شاگرد', value: 'student' },
  { id: 'teacher', label: 'معلم', value: 'teacher' },
  { id: 'principal', label: 'مدیر مکتب', value: 'principal' },
  { id: 'district_admin', label: 'رئیس معارف', value: 'district_admin' },
];

// Provinces and districts are now loaded from the database master tables

export default function SetupProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { showErrorMessage, showSuccess } = useErrorToast();

  const isQuickMode = searchParams.get('quickMode') === 'true';

  const [schoolSearch, setSchoolSearch] = useState('');

  const initialFormData: {
    full_name: string;
    role: string;
    school_name: string;
    district: string;
    province: string;
    phone_number: string;
    selected_school_id: string | null;
  } = {
    full_name: isQuickMode ? 'سازنده' : (profile?.full_name || ''),
    role: isQuickMode ? 'teacher' : (profile?.role || ''),
    school_name: isQuickMode ? 'مکتب توسعه' : (profile?.school_name || ''),
    district: isQuickMode ? 'ولسوالی تجربه' : (profile?.district || ''),
    province: isQuickMode ? 'کابل' : (profile?.province || ''),
    phone_number: isQuickMode ? '+93 700 000 000' : (profile?.phone_number || ''),
    selected_school_id: isQuickMode ? null : (profile?.school_id || null),
  };
  const [formData, setFormData, clearDraft, hadDraft, draftSaveState] = useDraft(
    `setup-profile:${user?.id ?? 'guest'}`,
    initialFormData,
  );
  const selectedSchoolId = formData.selected_school_id;
  const setSelectedSchoolId = (schoolId: string | null) => {
    setFormData((current) => ({ ...current, selected_school_id: schoolId }));
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [queuedSubmission, setQueuedSubmission] = useState<QueuedSubmissionResult | null>(null);
  const submissionStatus = useOfflineSubmissionStatus(queuedSubmission);

  useEffect(() => {
    if (!queuedSubmission || submissionStatus !== 'synced') return;
    localStorage.setItem('setupProfileCompleted', 'true');
    const timer = window.setTimeout(() => navigate('/pending-verification'), 500);
    return () => window.clearTimeout(timer);
  }, [navigate, queuedSubmission, submissionStatus]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const pageHeader = (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3" dir="rtl">
        <NavigationBackButton fallback="/" />
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="ml-2 h-4 w-4" />
          خروج از حساب
        </Button>
      </div>
    </header>
  );

  // Load provinces from master table
  const { data: masterProvinces } = useQuery({
    queryKey: ['master-provinces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provinces')
        .select('id, name, code')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Load districts filtered by selected province
  const { data: masterDistricts } = useQuery({
    queryKey: ['master-districts', formData.province],
    queryFn: async () => {
      if (!formData.province) return [];
      const province = masterProvinces?.find(p => p.name === formData.province);
      if (!province) return [];
      const { data, error } = await supabase
        .from('districts')
        .select('id, name')
        .eq('province_id', province.id)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!formData.province && !!masterProvinces?.length,
  });

  // School lookup query
  const { data: existingSchools } = useQuery({
    queryKey: ['schools-lookup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, province, district')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (isQuickMode && !isLoading) {
      const timer = setTimeout(() => {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isQuickMode, isLoading, formData.full_name]);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (queuedSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        {pageHeader}
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="space-y-4 pt-6 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-primary" />
              <h1 className="text-xl font-semibold">
                {submissionStatus === 'failed' ? 'پروفایل ذخیره شد اما ارسال ناموفق بود' :
                  submissionStatus === 'synced' ? 'پروفایل همگام‌سازی شد — منتظر تأیید' : 'پروفایل ذخیره شد — Pending sync'}
              </h1>
              <Alert className="text-right">
                <AlertDescription className="space-y-4">
                  <span>
                    {submissionStatus === 'failed'
                      ? 'معلومات شما روی این دستگاه محفوظ است؛ می‌توانید آن را ویرایش کنید یا به خانه برگردید.'
                      : submissionStatus === 'synced'
                        ? 'پروفایل به سرور ارسال شد. در حال انتقال به مرحله تأیید…'
                        : 'معلومات شما روی این دستگاه محفوظ است و پس از اتصال دوباره برای تأیید ارسال می‌شود.'}
                  </span>
                  <span className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" onClick={() => setQueuedSubmission(null)}>
                      ویرایش معلومات
                    </Button>
                    <Button onClick={() => navigate('/')}>
                      بازگشت به خانه
                    </Button>
                  </span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateSingleField(name);
  };

  const validateSingleField = (fieldName: string): boolean => {
    const newErrors = { ...errors };
    switch (fieldName) {
      case 'full_name':
        if (!formData.full_name?.trim()) newErrors.full_name = 'نام مکمل الزامی است';
        else delete newErrors.full_name;
        break;
      case 'role':
        if (!formData.role) newErrors.role = 'مقام انتخاب کردن الزامی است';
        else delete newErrors.role;
        break;
      case 'school_name':
        if (!formData.school_name?.trim()) newErrors.school_name = 'نام مکتب الزامی است';
        else delete newErrors.school_name;
        break;
      case 'district':
        if (!formData.district?.trim()) newErrors.district = 'نام ولسوالی الزامی است';
        else delete newErrors.district;
        break;
      case 'province':
        if (!formData.province) newErrors.province = 'ولایت انتخاب کردن الزامی است';
        else delete newErrors.province;
        break;
    }
    setErrors(newErrors);
    return !newErrors[fieldName];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name?.trim()) newErrors.full_name = 'نام مکمل الزامی است';
    if (!formData.role) newErrors.role = 'مقام انتخاب کردن الزامی است';
    if (!formData.school_name?.trim()) newErrors.school_name = 'نام مکتب الزامی است';
    if (!formData.district?.trim()) newErrors.district = 'نام ولسوالی الزامی است';
    if (!formData.province) newErrors.province = 'ولایت انتخاب کردن الزامی است';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showErrorMessage('لطفاً وارد سیستم شوید', 'خطا');
      return;
    }
    if (!validateForm()) {
      showErrorMessage('لطفاً تمام فیلدهای الزامی را پر کنید', 'خطای اعتبارسنجی');
      return;
    }

    setIsLoading(true);
    try {
      // New profiles begin in the hierarchical approval flow.
      // Try to find matching school
      let schoolId = selectedSchoolId;
      if (!schoolId && formData.school_name && formData.province && formData.district) {
        // Try exact match
        const match = (existingSchools ?? []).find(
          s => s.name === formData.school_name && s.province === formData.province && s.district === formData.district
        );
        if (match) schoolId = match.id;
      }

      const profileData: Database['public']['Tables']['profiles']['Insert'] = {
        user_id: user.id,
        full_name: formData.full_name,
        district: formData.district,
        province: formData.province,
        role: formData.role,
        school_name: formData.school_name,
        school_id: schoolId || null,
        phone_number: formData.phone_number || null,
        status: 'pending_verification',
        updated_at: new Date().toISOString(),
      };
      
      const queued = await queueSubmissionForSync({
        userId: user.id,
        kind: 'profile',
        payload: profileData,
      });
      clearDraft();
      if (queued.status !== 'synced') {
        setQueuedSubmission(queued);
        if (queued.status === 'failed') {
          showErrorMessage('پروفایل در دستگاه ذخیره شد اما ارسال ناموفق بود. پیام خطا و گزینه تلاش دوباره بالای صفحه است.', 'ارسال ناموفق');
        } else {
          showSuccess('پروفایل در دستگاه ذخیره شد و هنگام اتصال برای تأیید ارسال می‌شود', 'ذخیره آفلاین');
        }
        return;
      }

      localStorage.setItem('setupProfileCompleted', 'true');

      // Show pending message with approver info
      const approverLabel = getApproverLabel(formData.role);
      showSuccess(
        `پروفایل شما ذخیره شد. منتظر تأیید ${approverLabel} باشید.`,
        'موفقیت'
      );

      // Redirect to pending verification page
      // PendingVerification will auto-redirect to /afghanistan-info after 2 seconds
      setTimeout(() => navigate('/pending-verification'), 500);
    } catch (err) {
      console.error('Unexpected error:', err);
      showErrorMessage('پروفایل در دستگاه ذخیره نشد. لطفاً صفحه را باز نگه دارید و دوباره تلاش کنید.', 'خطا در ذخیره');
    } finally {
      setIsLoading(false);
    }
  };

  if (isQuickMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        {pageHeader}
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Zap className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">ورود سریع</h1>
            <p className="text-muted-foreground">برای تجربه سیستم با یک کلیک وارد شوید</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اطلاعات ورود سریع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">نام:</span>
                  <span className="font-medium">{formData.full_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">مقام:</span>
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
                  <span className="text-muted-foreground">ولسوالی:</span>
                  <span className="font-medium">{formData.district}</span>
                </div>
              </div>

              <Alert className="border-primary/20 bg-primary/10 mt-4">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary text-sm">
                  این حساب برای تجربه سیستم است. تمام داده‌ها فوری تأیید می‌شود.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                disabled={isLoading}
                size="lg"
                className="w-full mt-6 h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />درحال ورود...</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />ورود به سیستم</>
                )}
              </Button>

              <Button variant="outline" onClick={() => navigate('/login')} disabled={isLoading} className="w-full">
                بازگشت
              </Button>
            </CardContent>
          </Card>
        </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {pageHeader}
      <main className="flex justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">پروفایل خود را تکمیل کنید</h1>
          <p className="text-muted-foreground">لطفاً معلومات خود را وارد کنید تا حساب شما تأیید شود</p>
        </div>

        {(profile?.status === 'pending_verification' || profile?.status === 'pending') && (
          <Alert className="border-warning/20 bg-warning/10">
            <Clock className="h-4 w-4 text-warning" />
            <AlertDescription className="space-y-3 text-warning">
              <p>حساب شما در انتظار تأیید است. می‌توانید معلومات را ویرایش کنید یا به خانه برگردید.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => document.getElementById('full_name')?.focus()}>
                  ویرایش معلومات
                </Button>
                <Button type="button" onClick={() => navigate('/')}>
                  بازگشت به خانه
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 🚧 TEMPORARY TEST MODE banner */}
        {TEMPORARY_TEST_MODE && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0"><span className="text-xl">🧪</span></div>
              <div>
                <h3 className="font-medium text-warning">حالت آزمایشی فعال</h3>
                <p className="text-sm text-warning mt-1">
                  در حالت آزمایشی، تأیید حساب توسط مسئول اصلی سیستم انجام می‌شود.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>معلومات کاربر</CardTitle>
            <CardDescription>این معلومات برای تعیین سطح دسترسی درست استفاده می‌شود</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
              {draftSaveState !== 'loading' && (
                <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                  {draftSaveState === 'saving' ? 'در حال ذخیره پیش‌نویس…' :
                    draftSaveState === 'saved' && hadDraft ? 'پیش‌نویس قبلی بازیابی و روی این دستگاه ذخیره شد' :
                      draftSaveState === 'fallback' ? 'پیش‌نویس در ذخیره‌سازی جایگزین مرورگر ذخیره شد' :
                        draftSaveState === 'error' ? 'ذخیره پیش‌نویس ناموفق بود؛ معلومات را کپی کنید' : null}
                </p>
              )}
              {Object.keys(errors).length > 0 && (
                <FormErrorSummary errors={errors} />
              )}

              <FormFieldWrapper label="نام مکمل" error={touched.full_name ? errors.full_name : undefined}>
                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} onBlur={handleBlur} placeholder="نام و نام‌خانوادگی" disabled={isLoading} aria-invalid={!!errors.full_name} />
              </FormFieldWrapper>

              <FormFieldWrapper label="مقام" error={touched.role ? errors.role : undefined}>
                <select id="role" name="role" value={formData.role} onChange={handleChange} onBlur={handleBlur} disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md bg-background ${errors.role ? 'border-destructive' : 'border-input'}`}
                  aria-invalid={!!errors.role}
                >
                  <option value="">انتخاب مقام</option>
                  {ROLES.map(role => (
                    <option key={role.id} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </FormFieldWrapper>

              {/* Show who will approve based on selected role */}
              {formData.role && (
                <Alert className="border-primary/20 bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary text-sm">
                    بعد از ارسال، حساب شما منتظر تأیید <strong>{getApproverLabel(formData.role)}</strong> خواهد بود.
                  </AlertDescription>
                </Alert>
              )}

              <FormFieldWrapper label="نام مکتب" error={touched.school_name ? errors.school_name : undefined}>
                <Input
                  id="school_name"
                  name="school_name"
                  value={formData.school_name}
                  onChange={(e) => {
                    handleChange(e);
                    setSchoolSearch(e.target.value);
                    setSelectedSchoolId(null);
                  }}
                  onBlur={handleBlur}
                  placeholder="نام مکتب را تایپ کنید..."
                  disabled={isLoading}
                  aria-invalid={!!errors.school_name}
                />
                {schoolSearch.length >= 2 && !selectedSchoolId && (
                  <div className="border rounded-md mt-1 max-h-32 overflow-y-auto bg-card shadow-sm">
                    {(existingSchools ?? [])
                      .filter(s => s.name.includes(schoolSearch))
                      .slice(0, 5)
                      .map(s => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                          onClick={() => {
                            setSelectedSchoolId(s.id);
                            setSchoolSearch('');
                            setFormData(prev => ({
                              ...prev,
                              school_name: s.name,
                              province: s.province ?? prev.province,
                              district: s.district ?? prev.district,
                            }));
                          }}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-muted-foreground mr-2">
                            {s.district} — {s.province}
                          </span>
                        </button>
                      ))}
                    {(existingSchools ?? []).filter(s => s.name.includes(schoolSearch)).length === 0 && (
                      <p className="px-3 py-2 text-xs text-muted-foreground">مکتب جدید — بعد از تأیید ادمین ثبت خواهد شد</p>
                    )}
                  </div>
                )}
              </FormFieldWrapper>

              <FormFieldWrapper label="ولسوالی" error={touched.district ? errors.district : undefined}>
                {masterDistricts?.length ? (
                  <select id="district" name="district" value={formData.district} onChange={handleChange} onBlur={handleBlur} disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-md bg-background ${errors.district ? 'border-destructive' : 'border-input'}`}
                    aria-invalid={!!errors.district}
                  >
                    <option value="">انتخاب ولسوالی</option>
                    {masterDistricts.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <Input id="district" name="district" value={formData.district} onChange={handleChange} onBlur={handleBlur}
                    placeholder="نام ولسوالی را وارد کنید" disabled={isLoading} aria-invalid={!!errors.district} />
                )}
              </FormFieldWrapper>

              <FormFieldWrapper label="ولایت" error={touched.province ? errors.province : undefined}>
                {masterProvinces?.length ? (
                  <select id="province" name="province" value={formData.province}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, province: e.target.value, district: '' }));
                    }}
                    onBlur={handleBlur} disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-md bg-background ${errors.province ? 'border-destructive' : 'border-input'}`}
                    aria-invalid={!!errors.province}
                  >
                    <option value="">انتخاب ولایت</option>
                    {masterProvinces.map(province => (
                      <option key={province.id} value={province.name}>{province.name}</option>
                    ))}
                  </select>
                ) : (
                  <Input id="province" name="province" value={formData.province} onChange={handleChange} onBlur={handleBlur}
                    placeholder="نام ولایت را وارد کنید" disabled={isLoading} aria-invalid={!!errors.province} />
                )}
              </FormFieldWrapper>

              <FormFieldWrapper label="شماره تلفن (اختیاری)">
                <Input id="phone_number" name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} onBlur={handleBlur} placeholder="+93 123 456 7890" disabled={isLoading} />
              </FormFieldWrapper>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />در حال ذخیره‌سازی...</>
                ) : (
                  'ادامه و ارسال برای تأیید'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
  );
}
