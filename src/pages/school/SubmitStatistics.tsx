import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAPIError } from '@/hooks/useAPIError';
import { useErrorToast } from '@/lib/errorToast';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import { validateNumberRange, validateRequired } from '@/lib/validation';
// Mock submission removed - using real submissions
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sanitizeError } from '@/lib/sanitizeError';
import { useDraft } from '@/hooks/useDraft';

export default function SubmitStatistics() {
  const { user, profile, isDemoMode } = useAuth();
  const { toast } = useToast();
  const { executeWithErrorHandling } = useAPIError();
  const { showErrorMessage, showSuccess } = useErrorToast();
  const mockSubmitStatistics = async (_data: any) => ({ success: true, message: 'Demo mode' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const initialForm = {
    academic_year: new Date().getFullYear().toString(),
    total_students: '',
    male_students: '',
    female_students: '',
    total_teachers: '',
    attendance_rate: '',
    notes: ''
  };
  const [formData, setFormData, clearDraft, hadDraft] = useDraft('school-statistics', initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const yearError = validateRequired(formData.academic_year);
    if (yearError) newErrors.academic_year = yearError;

    const totalStudentsError = validateRequired(formData.total_students);
    if (totalStudentsError) {
      newErrors.total_students = totalStudentsError;
    } else {
      const numError = validateNumberRange(parseInt(formData.total_students), 0, 10000);
      if (numError) newErrors.total_students = numError;
    }

    if (formData.attendance_rate) {
      const attendanceError = validateNumberRange(parseFloat(formData.attendance_rate), 0, 100);
      if (attendanceError) newErrors.attendance_rate = attendanceError;
    }

    const male = parseInt(formData.male_students) || 0;
    const female = parseInt(formData.female_students) || 0;
    const total = parseInt(formData.total_students) || 0;
    if (male + female > total) {
      newErrors.students_ratio = 'تعداد دانش‌آموزان پسر و دختر نمی‌تواند بیشتر از کل شود';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showErrorMessage('لطفاً وارد سیستم شوید', 'خطا');
      return;
    }
    if (!profile?.school_id) {
      showErrorMessage('مکتب شما هنوز ثبت نشده است. لطفاً با مدیر سیستم تماس بگیرید.', 'خطا');
      return;
    }
    if (!validateForm()) {
      showErrorMessage('لطفاً فیلدهای الزامی را بررسی کنید', 'خطای اعتبارسنجی');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        const result = await mockSubmitStatistics(formData);
        if (result.success) setSubmitted(true);
      } else {
        const { error } = await executeWithErrorHandling(
          async () => await supabase.from('statistics_submissions').insert({
            school_id: profile.school_id,
            submitted_by: user.id,
            academic_year: formData.academic_year,
            total_students: parseInt(formData.total_students) || 0,
            male_students: parseInt(formData.male_students) || 0,
            female_students: parseInt(formData.female_students) || 0,
            total_teachers: parseInt(formData.total_teachers) || 0,
            attendance_rate: formData.attendance_rate ? parseFloat(formData.attendance_rate) : null,
            notes: formData.notes || null
          }).select()
        );
        if (error) throw error;
        setSubmitted(true);
        showSuccess('اطلاعات شما با موفقیت ارسال شد', 'موفقیت');
      }
    } catch (err) {
      console.error('Error submitting statistics:', err);
      showErrorMessage('خطایی در ارسال اطلاعات رخ داد. دوباره تلاش کنید.', 'خطا در ارسال');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">اطلاعات با موفقیت ارسال شد!</h2>
              <p className="text-muted-foreground">اطلاعات شما به مرکز ارسال شده است.</p>
              <Button onClick={() => { 
                setSubmitted(false); 
                setFormData({ academic_year: new Date().getFullYear().toString(), total_students: '', male_students: '', female_students: '', total_teachers: '', attendance_rate: '', notes: '' });
                setErrors({});
                setTouched({});
              }}>
                ارسال اطلاعات دیگری
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          ارسال آمار‌ها
        </h1>
        <p className="text-muted-foreground">اطلاعات دانش‌آموز و حضور و غیاب مکتب خود را وارد کنید</p>
      </div>

      {isDemoMode && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>🎨 حالت نمایشی:</strong> شما در حالت نمایشی هستید. داده‌های ارسال شده ذخیره نمی‌شوند.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>فورم آمار مکتب</CardTitle>
          <CardDescription>تمام فیلدهایی که با * مشخص شده‌اند الزامی هستند</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {Object.values(errors).filter(Boolean).length > 0 && (
              <FormErrorSummary errors={errors} />
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <FormFieldWrapper label="سال تحصیلی *" error={touched.academic_year ? errors.academic_year : undefined}>
                <Input id="academic_year" name="academic_year" value={formData.academic_year} onChange={handleChange} placeholder="1402" disabled={isSubmitting} aria-invalid={!!errors.academic_year} />
              </FormFieldWrapper>

              <FormFieldWrapper label="کل دانش‌آموزان *" error={touched.total_students ? errors.total_students : undefined}>
                <Input id="total_students" name="total_students" type="number" value={formData.total_students} onChange={handleChange} placeholder="0" disabled={isSubmitting} min="0" aria-invalid={!!errors.total_students} />
              </FormFieldWrapper>

              <FormFieldWrapper label="دانش‌آموزان پسر">
                <Input id="male_students" name="male_students" type="number" value={formData.male_students} onChange={handleChange} placeholder="0" disabled={isSubmitting} min="0" />
              </FormFieldWrapper>

              <FormFieldWrapper label="دانش‌آموزان دختر">
                <Input id="female_students" name="female_students" type="number" value={formData.female_students} onChange={handleChange} placeholder="0" disabled={isSubmitting} min="0" />
              </FormFieldWrapper>

              <FormFieldWrapper label="کل معلمان">
                <Input id="total_teachers" name="total_teachers" type="number" value={formData.total_teachers} onChange={handleChange} placeholder="0" disabled={isSubmitting} min="0" />
              </FormFieldWrapper>

              <FormFieldWrapper label="نرخ حضور (%)" error={touched.attendance_rate ? errors.attendance_rate : undefined}>
                <Input id="attendance_rate" name="attendance_rate" type="number" value={formData.attendance_rate} onChange={handleChange} placeholder="85.5" disabled={isSubmitting} min="0" max="100" step="0.1" aria-invalid={!!errors.attendance_rate} />
              </FormFieldWrapper>
            </div>

            {errors.students_ratio && (
              <FormErrorSummary errors={{ students_ratio: errors.students_ratio }} />
            )}

            <FormFieldWrapper label="یادداشت‌های اضافی">
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="هر اطلاعات اضافی..." rows={3} disabled={isSubmitting} />
            </FormFieldWrapper>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />در حال ارسال...</>
              ) : (
                'ارسال آمار‌ها'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
