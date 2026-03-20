import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, CheckCircle, Upload, AlertCircle, Zap } from 'lucide-react';
import { useAPIError } from '@/hooks/useAPIError';
import { useErrorToast } from '@/lib/errorToast';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import { FileUploadProgress } from '@/components/FileUploadProgress';
import { validateFileSize, validateFileType, validateRequired } from '@/lib/validation';

export default function SubmitReports() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { executeWithErrorHandling } = useAPIError();
  const { showErrorToast, showSuccessToast } = useErrorToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate title
    const titleError = validateRequired(formData.title);
    if (titleError) newErrors.title = titleError;

    // Validate file
    if (!selectedFile) {
      newErrors.file = 'فایل الزامی است';
    } else {
      const fileSizeError = validateFileSize(selectedFile.size, MAX_FILE_SIZE);
      if (fileSizeError) newErrors.file = fileSizeError;

      const fileTypeError = validateFileType(selectedFile.type, ALLOWED_FILE_TYPES);
      if (fileTypeError) newErrors.file = fileTypeError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setTouched(prev => ({ ...prev, file: true }));
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id || !user) {
      showErrorToast('خطا', 'اطلاعات نیمرفتار کامل نیست');
      return;
    }

    if (!validateForm()) {
      showErrorToast('خطای اعتبارسنجی', 'لطفاً تمام فیلدهای الزامی را بررسی کنید');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!selectedFile) {
        throw new Error('فایل انتخاب نشده است');
      }

      // Upload file to storage with proper error handling
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${profile.school_id}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('school-reports')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Create database record
      const { error: dbError } = await supabase.from('report_submissions').insert({
        school_id: profile.school_id,
        submitted_by: user.id,
        title: formData.title,
        description: formData.description || null,
        file_path: data.path,
        file_name: selectedFile.name,
        status: 'pending'
      });

      if (dbError) {
        throw dbError;
      }

      setSubmitted(true);
      showSuccessToast('موفقیت', 'گزارش شما با موفقیت ارسال شد');
    } catch (err) {
      console.error('Error submitting report:', err);
      const errorMsg = err instanceof Error ? err.message : 'خطایی نامعلوم رخ داد';
      showErrorToast('خطا در ارسال', errorMsg);
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
              <h2 className="text-xl font-semibold">گزارش با موفقیت ارسال شد!</h2>
              <p className="text-muted-foreground">گزارش شما به مرکز ارسال شده است.</p>
              <Button onClick={() => { 
                setSubmitted(false); 
                setFormData({ title: '', description: '' }); 
                setSelectedFile(null);
                setErrors({});
                setTouched({});
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          ارسال گزارش‌ها
        </h1>
        <p className="text-muted-foreground">اسناد و گزارش‌ها را به مرکز آپلود کنید</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>آپلود گزارش</CardTitle>
          <CardDescription>فرمت‌های پشتیبانی شده: PDF, DOC, DOCX, XLS, XLSX - حداکثر 10MB</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <FormErrorSummary errors={Object.values(errors)} />
            )}

            {/* Title Field */}
            <FormFieldWrapper 
              label="عنوان گزارش *" 
              error={touched.title ? errors.title : undefined}
            >
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="گزارش حضور و غیاب - ژانویه 1402"
                disabled={isSubmitting}
                aria-invalid={!!errors.title}
              />
            </FormFieldWrapper>

            {/* Description Field */}
            <FormFieldWrapper 
              label="توضیحات (اختیاری)" 
            >
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="توضیح مختصری در مورد گزارش..."
                rows={3}
                disabled={isSubmitting}
              />
            </FormFieldWrapper>

            {/* File Upload Field */}
            <div className="space-y-2">
              <Label className={errors.file ? 'text-red-500' : ''}>
                فایل گزارش *
              </Label>
              <FileUploadProgress
                onFileSelect={(file) => {
                  setSelectedFile(file);
                  setTouched(prev => ({ ...prev, file: true }));
                  if (errors.file) {
                    setErrors(prev => ({ ...prev, file: '' }));
                  }
                }}
                maxFileSize={10 * 1024 * 1024}
                acceptedFileTypes={['.pdf', '.doc', '.docx', '.xls', '.xlsx']}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !selectedFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  ارسال گزارش
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
