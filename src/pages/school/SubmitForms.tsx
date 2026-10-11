import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Loader2, CheckCircle } from 'lucide-react';
import { useErrorToast } from '@/lib/errorToast';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import { validateRequired } from '@/lib/validation';
import { useDraft } from '@/hooks/useDraft';
import { useOfflineSubmissionStatus } from '@/hooks/useOfflineSubmissionStatus';
import { queueSubmissionForSync, type QueuedSubmissionResult } from '@/lib/offlineStore';
import NavigationBackButton from '@/components/NavigationBackButton';

const formTypes = [
  { value: 'infrastructure', label: 'بررسی زیرساخت‌ها' },
  { value: 'teacher_evaluation', label: 'ارزیابی معلمان' },
  { value: 'student_assessment', label: 'ارزیابی دانش‌آموزان' },
  { value: 'resource_request', label: 'درخواست منابع' },
  { value: 'incident_report', label: 'گزارش حادثه' },
  { value: 'other', label: 'سایر' }
];

export default function SubmitForms() {
  const { user, profile } = useAuth();
  const { showErrorMessage, showSuccess } = useErrorToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queuedSubmission, setQueuedSubmission] = useState<QueuedSubmissionResult | null>(null);
  const submissionStatus = useOfflineSubmissionStatus(queuedSubmission);
  const initialDraft = {
    formType: '',
    title: '',
    details: '',
    additional_info: ''
  };
  const [draft, setDraft, clearDraft, hadDraft, draftSaveState] = useDraft(
    `school-form-submission:${user?.id ?? 'guest'}`,
    initialDraft,
  );
  const { formType, title, details, additional_info: additionalInfo } = draft;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formType) newErrors.formType = 'نوع فورم الزامی است';
    const titleError = validateRequired(title);
    if (titleError) newErrors.title = titleError;
    const detailsError = validateRequired(details);
    if (detailsError) newErrors.details = detailsError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFormTypeChange = (value: string) => {
    setDraft(prev => ({ ...prev, formType: value }));
    setTouched(prev => ({ ...prev, formType: true }));
    if (errors.formType) setErrors(prev => ({ ...prev, formType: '' }));
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
      showErrorMessage('لطفاً تمام فیلدهای الزامی را بررسی کنید', 'خطای اعتبارسنجی');
      return;
    }

    setIsSubmitting(true);
    try {
      const queued = await queueSubmissionForSync({
        userId: user.id,
        kind: 'form',
        payload: {
          school_id: profile.school_id,
          submitted_by: user.id,
          form_type: formType,
          form_data: {
            title,
            details,
            additional_info: additionalInfo
          }
        },
      });
      setQueuedSubmission(queued);
      clearDraft();
      setSubmitted(true);
      if (queued.status === 'synced') showSuccess('فورم شما با موفقیت ارسال شد', 'موفقیت');
      else if (queued.status === 'pending') showSuccess('فورم در دستگاه ذخیره شد و هنگام اتصال ارسال می‌شود', 'ذخیره آفلاین');
      else showErrorMessage('فورم روی دستگاه محفوظ است اما ارسال آن ناموفق بود. پیام خطا و گزینه تلاش دوباره بالای صفحه است.', 'ارسال ناموفق');
    } catch (err) {
      console.error('Error submitting form:', err);
      showErrorMessage('فورم در دستگاه ذخیره نشد. لطفاً صفحه را باز نگه دارید و دوباره تلاش کنید.', 'خطا در ذخیره');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
        <NavigationBackButton fallback="/school" label="بازگشت به دشبورد مکتب" />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">
                {submissionStatus === 'pending' ? 'فورم ذخیره شد و در انتظار ارسال است' :
                  submissionStatus === 'failed' ? 'فورم ذخیره شد اما ارسال آن ناموفق بود' : 'فورم با موفقیت ارسال شد!'}
              </h2>
                  <p className="text-muted-foreground">
                    {submissionStatus === 'pending' ? 'Pending sync — فورم روی این دستگاه محفوظ است و پس از اتصال دوباره ارسال می‌شود.' :
                      submissionStatus === 'failed' ? 'فورم روی این دستگاه محفوظ است. پیام خطا و گزینه تلاش دوباره در بالای صفحه نمایش داده می‌شود.' :
                        'فورم شما به مرکز ارسال شده است.'}
              </p>
              <Button onClick={() => { 
                setSubmitted(false); 
                clearDraft();
                setErrors({});
                setTouched({});
                setQueuedSubmission(null);
              }}>
                ارسال فورم دیگری
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <NavigationBackButton fallback="/school" label="بازگشت به دشبورد مکتب" />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          ارسال فورم‌ها
        </h1>
        <p className="text-muted-foreground">فورم‌های مختلف را پر کنید و به مرکز ارسال کنید</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ارسال فورم</CardTitle>
          <CardDescription>نوع فورم را انتخاب کنید و جزئیات را پر کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              {draftSaveState === 'saving' ? 'در حال ذخیره پیش‌نویس…' :
                draftSaveState === 'saved' && hadDraft ? 'پیش‌نویس روی این دستگاه ذخیره شد' :
                  draftSaveState === 'fallback' ? 'پیش‌نویس در ذخیره‌سازی جایگزین مرورگر ذخیره شد' :
                    draftSaveState === 'error' ? 'ذخیره پیش‌نویس ناموفق بود؛ داده‌ها را کپی کنید' : null}
            </p>
            {Object.values(errors).filter(Boolean).length > 0 && (
              <FormErrorSummary errors={errors} />
            )}

            <div className="space-y-2">
              <Label className={errors.formType ? 'text-destructive' : ''}>نوع فورم *</Label>
              <Select value={formType} onValueChange={handleFormTypeChange}>
                <SelectTrigger className={errors.formType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="نوع فورم را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {formTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.formType && errors.formType && (
                <p className="text-sm text-destructive">{errors.formType}</p>
              )}
            </div>

            <FormFieldWrapper label="عنوان / موضوع *" error={touched.title ? errors.title : undefined}>
              <Input id="title" name="title" value={title} onChange={handleChange} placeholder="موضوع کوتاه درخواست خود" disabled={isSubmitting} aria-invalid={!!errors.title} />
            </FormFieldWrapper>

            <FormFieldWrapper label="جزئیات *" error={touched.details ? errors.details : undefined}>
              <Textarea id="details" name="details" value={details} onChange={handleChange} placeholder="اطلاعات تفصیلی را ارائه دهید..." rows={5} disabled={isSubmitting} aria-invalid={!!errors.details} />
            </FormFieldWrapper>

            <FormFieldWrapper label="اطلاعات اضافی">
              <Textarea id="additional_info" name="additional_info" value={additionalInfo} onChange={handleChange} placeholder="هر اطلاعات مرتبط دیگری..." rows={3} disabled={isSubmitting} />
            </FormFieldWrapper>

            <Button type="submit" className="w-full" disabled={isSubmitting || !formType}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />در حال ارسال...</>
              ) : (
                'ارسال فورم'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
