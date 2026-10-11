import { useState } from 'react';
import { sanitizeError } from '@/lib/sanitizeError';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Loader2, CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { useErrorToast } from '@/lib/errorToast';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import { FileUploadProgress } from '@/components/FileUploadProgress';
import { validateFileSize, validateFileType, validateRequired } from '@/lib/validation';
import { useDraft } from '@/hooks/useDraft';
import { useOfflineSubmissionStatus } from '@/hooks/useOfflineSubmissionStatus';
import { queueSubmissionForSync, type QueuedSubmissionResult } from '@/lib/offlineStore';
import NavigationBackButton from '@/components/NavigationBackButton';
// Mock submission removed - using real submissions

export default function SubmitReports() {
  const { user, profile, isDemoMode } = useAuth();
  const { showErrorMessage, showSuccess } = useErrorToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queuedSubmission, setQueuedSubmission] = useState<QueuedSubmissionResult | null>(null);
  const submissionStatus = useOfflineSubmissionStatus(queuedSubmission);
  const initialDraft = { title: '', description: '', file: null as File | null };
  const [formData, setFormData, clearDraft, hadDraft, draftSaveState] = useDraft(
    `school-report-submission:${user?.id ?? 'guest'}`,
    initialDraft,
  );
  const selectedFile = formData.file;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const titleError = validateRequired(formData.title);
    if (titleError) newErrors.title = titleError;

    if (!selectedFile) {
      newErrors.file = 'فایل الزامی است';
    } else {
      const fileSizeError = validateFileSize(selectedFile, 10);
      if (fileSizeError) newErrors.file = fileSizeError;
      const fileTypeError = validateFileType(selectedFile, ALLOWED_FILE_TYPES);
      if (fileTypeError) newErrors.file = fileTypeError;
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
      showErrorMessage('لطفاً تمام فیلدهای الزامی را بررسی کنید', 'خطای اعتبارسنجی');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!selectedFile) throw new Error('فایل انتخاب نشده است');

      if (isDemoMode) {
        setSubmitted(true);
      } else {
        const queued = await queueSubmissionForSync({
          userId: user.id,
          kind: 'report',
          payload: {
            school_id: profile.school_id,
            submitted_by: user.id,
            title: formData.title,
            description: formData.description || null,
            status: 'pending',
          },
          file: selectedFile,
          fileName: selectedFile.name,
        });
        setQueuedSubmission(queued);
        clearDraft();
        setSubmitted(true);
        if (queued.status === 'synced') showSuccess('گزارش شما با موفقیت ارسال شد', 'موفقیت');
        else if (queued.status === 'pending') showSuccess('گزارش و فایل در دستگاه ذخیره شد و هنگام اتصال ارسال می‌شود', 'ذخیره آفلاین');
        else showErrorMessage('گزارش و فایل روی دستگاه محفوظ است اما ارسال ناموفق بود. پیام خطا و گزینه تلاش دوباره بالای صفحه است.', 'ارسال ناموفق');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      const errorMsg = sanitizeError(err);
      showErrorMessage(errorMsg || 'گزارش در دستگاه ذخیره نشد. لطفاً صفحه را باز نگه دارید و دوباره تلاش کنید.', 'خطا در ذخیره');
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
                {submissionStatus === 'pending' ? 'گزارش ذخیره شد و در انتظار ارسال است' :
                  submissionStatus === 'failed' ? 'گزارش ذخیره شد اما ارسال آن ناموفق بود' : 'گزارش با موفقیت ارسال شد!'}
              </h2>
              <p className="text-muted-foreground">
                {submissionStatus === 'pending' ? 'Pending sync — گزارش و فایل روی این دستگاه محفوظ است.' :
                  submissionStatus === 'failed' ? 'گزارش و فایل روی این دستگاه محفوظ است. پیام خطا و گزینه تلاش دوباره در بالای صفحه نمایش داده می‌شود.' :
                    'گزارش شما به مرکز ارسال شده است.'}
              </p>
              <Button onClick={() => { 
                setSubmitted(false); 
                clearDraft();
                setErrors({});
                setTouched({});
                setQueuedSubmission(null);
              }}>
                ارسال گزارش دیگری
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
          <FileText className="h-6 w-6" />
          ارسال گزارش‌ها
        </h1>
        <p className="text-muted-foreground">اسناد و گزارش‌ها را به مرکز آپلود کنید</p>
      </div>

      {isDemoMode && (
        <Alert className="border-primary/20 bg-primary/10">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            <strong>🎨 حالت نمایشی:</strong> شما در حالت نمایشی هستید. داده‌های ارسال شده ذخیره نمی‌شوند.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>آپلود گزارش</CardTitle>
          <CardDescription>فورمت‌های پشتیبانی شده: PDF, DOC, DOCX, XLS, XLSX - حداکثر 10MB</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {draftSaveState !== 'loading' && (
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                {draftSaveState === 'saving' ? 'در حال ذخیره پیش‌نویس…' :
                  draftSaveState === 'saved' && hadDraft ? 'پیش‌نویس و فایل روی این دستگاه ذخیره شد' :
                    draftSaveState === 'fallback' ? 'پیش‌نویس در ذخیره‌سازی جایگزین مرورگر ذخیره شد' :
                      draftSaveState === 'error' ? 'ذخیره پیش‌نویس ناموفق بود؛ صفحه را باز نگه دارید' : null}
              </p>
            )}
            {Object.values(errors).filter(Boolean).length > 0 && (
              <FormErrorSummary errors={errors} />
            )}

            <FormFieldWrapper label="عنوان گزارش *" error={touched.title ? errors.title : undefined}>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="گزارش حضور و غیاب - ژانویه 1402" disabled={isSubmitting} aria-invalid={!!errors.title} />
            </FormFieldWrapper>

            <FormFieldWrapper label="توضیحات (اختیاری)">
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="توضیح مختصری در مورد گزارش..." rows={3} disabled={isSubmitting} />
            </FormFieldWrapper>

            <div className="space-y-2">
              <Label className={errors.file ? 'text-destructive' : ''}>فایل گزارش *</Label>
              <FileUploadProgress
                selectedFile={selectedFile}
                onFileRemove={() => setFormData(prev => ({ ...prev, file: null }))}
                onFileSelect={(file) => {
                  setFormData(prev => ({ ...prev, file }));
                  setTouched(prev => ({ ...prev, file: true }));
                  if (errors.file) setErrors(prev => ({ ...prev, file: '' }));
                }}
                maxFileSize={10 * 1024 * 1024}
                acceptedFileTypes={['.pdf', '.doc', '.docx', '.xls', '.xlsx']}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />در حال ارسال...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />ارسال گزارش</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
