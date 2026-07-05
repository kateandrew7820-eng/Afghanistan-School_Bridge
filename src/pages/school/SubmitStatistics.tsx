import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, Loader2, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Users, GraduationCap, ClipboardCheck, Sparkles, Pencil } from 'lucide-react';
import { useAPIError } from '@/hooks/useAPIError';
import { useErrorToast } from '@/lib/errorToast';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import { validateNumberRange, validateRequired } from '@/lib/validation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDraft } from '@/hooks/useDraft';
import { Stepper } from '@/components/Stepper';
import { deriveStats, toInt, toPersianDigits } from '@/lib/smartCalc';

type FormData = {
  academic_year: string;
  total_students: string;
  male_students: string;
  female_students: string;
  total_teachers: string;
  attendance_rate: string;
  notes: string;
};

const STEPS = [
  { key: 'enrollment', label: 'سال و ثبت‌نام', icon: GraduationCap },
  { key: 'demographics', label: 'جنسیت و کادر', icon: Users },
  { key: 'review', label: 'بازبینی و ارسال', icon: ClipboardCheck },
] as const;

export default function SubmitStatistics() {
  const { user, profile, isDemoMode } = useAuth();
  const { executeWithErrorHandling } = useAPIError();
  const { showErrorMessage, showSuccess } = useErrorToast();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const initialForm: FormData = {
    academic_year: new Date().getFullYear().toString(),
    total_students: '',
    male_students: '',
    female_students: '',
    total_teachers: '',
    attendance_rate: '',
    notes: '',
  };
  const [formData, setFormData, clearDraft, hadDraft] = useDraft<FormData>('school-statistics', initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totalManual, setTotalManual] = useState(false); // user overrode auto-total

  const setField = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Smart auto-total: total_students = male + female unless user overrode.
  const derived = useMemo(() => deriveStats({
    male: toInt(formData.male_students),
    female: toInt(formData.female_students),
    teachers: toInt(formData.total_teachers),
    total: toInt(formData.total_students),
  }), [formData.male_students, formData.female_students, formData.total_teachers, formData.total_students]);

  useEffect(() => {
    if (totalManual) return;
    const auto = derived.autoTotal;
    if (auto > 0 && String(auto) !== formData.total_students) {
      setFormData(prev => ({ ...prev, total_students: String(auto) }));
    }
  }, [derived.autoTotal, totalManual]);


  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      const y = validateRequired(formData.academic_year);
      if (y) e.academic_year = y;
      const t = validateRequired(formData.total_students);
      if (t) e.total_students = t;
      else {
        const numErr = validateNumberRange(parseInt(formData.total_students), 0, 10000);
        if (numErr) e.total_students = numErr;
      }
    } else if (s === 1) {
      const male = parseInt(formData.male_students) || 0;
      const female = parseInt(formData.female_students) || 0;
      const total = parseInt(formData.total_students) || 0;
      if (male + female > total) {
        e.students_ratio = 'تعداد دانش‌آموزان پسر و دختر نمی‌تواند بیشتر از کل شود';
      }
      if (formData.attendance_rate) {
        const a = validateNumberRange(parseFloat(formData.attendance_rate), 0, 100);
        if (a) e.attendance_rate = a;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!user) return showErrorMessage('لطفاً وارد سیستم شوید', 'خطا');
    if (!profile?.school_id) return showErrorMessage('مکتب شما هنوز ثبت نشده است.', 'خطا');
    if (!validateStep(0) || !validateStep(1)) { setStep(0); return; }

    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        setSubmitted(true);
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
            notes: formData.notes || null,
          }).select(),
        );
        if (error) throw error;
        setSubmitted(true);
        clearDraft();
        showSuccess('اطلاعات شما با موفقیت ارسال شد', 'موفقیت');
      }
    } catch (err) {
      console.error('Error submitting statistics:', err);
      showErrorMessage('خطایی در ارسال اطلاعات رخ داد. دوباره تلاش کنید.', 'خطا در ارسال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = useMemo(() => ([
    { label: 'سال تحصیلی', value: formData.academic_year || '—' },
    { label: 'کل دانش‌آموزان', value: formData.total_students || '—' },
    { label: 'پسران', value: formData.male_students || '۰' },
    { label: 'دختران', value: formData.female_students || '۰' },
    { label: 'کل معلمان', value: formData.total_teachers || '۰' },
    { label: 'نرخ حضور', value: formData.attendance_rate ? `${formData.attendance_rate}%` : '—' },
    { label: 'دانش‌آموز به معلم',
      value: derived.studentsPerTeacher != null ? `${toPersianDigits(derived.studentsPerTeacher.toFixed(1))} : ۱` : '—' },
    { label: 'درصد دختران',
      value: derived.femalePercent != null ? `${toPersianDigits(derived.femalePercent.toFixed(1))}٪` : '—' },
  ]), [formData, derived]);

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">اطلاعات با موفقیت ارسال شد!</h2>
              <p className="text-muted-foreground">ارسال شما به مرحله تأیید ولسوالی منتقل شد.</p>
              <Button onClick={() => {
                setSubmitted(false);
                setFormData(initialForm);
                clearDraft();
                setErrors({});
                setStep(0);
              }}>
                ارسال آمار جدید
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          ارسال آمار‌ها
        </h1>
        <p className="text-sm text-muted-foreground">در سه مرحله ساده، آمار مکتب خود را ارسال کنید</p>
      </div>

      <Stepper steps={STEPS as any} currentIndex={step} />

      {hadDraft && step === 0 && (
        <Alert className="border-warning/20 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning flex items-center justify-between gap-2">
            <span>پیش‌نویس قبلی شما بازیابی شد.</span>
            <Button size="sm" variant="ghost" onClick={() => { setFormData(initialForm); clearDraft(); }}>
              پاک کردن
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isDemoMode && (
        <Alert className="border-primary/20 bg-primary/10">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            <strong>🎨 حالت نمایشی:</strong> داده‌ها ذخیره نمی‌شوند.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STEPS[step].label}</CardTitle>
          <CardDescription>
            {step === 0 && 'سال تحصیلی و تعداد کل دانش‌آموزان را وارد کنید'}
            {step === 1 && 'تفکیک جنسیتی، کادر آموزشی و نرخ حضور'}
            {step === 2 && 'اطلاعات وارد شده را بازبینی و تأیید کنید'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.values(errors).filter(Boolean).length > 0 && (
            <FormErrorSummary errors={errors} />
          )}

          {step === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <FormFieldWrapper label="سال تحصیلی *" error={errors.academic_year}>
                <Input value={formData.academic_year} onChange={(e) => setField('academic_year', e.target.value)} placeholder="1402" disabled={isSubmitting} />
              </FormFieldWrapper>
              <FormFieldWrapper
                label={
                  <span className="flex items-center gap-2">
                    کل دانش‌آموزان *
                    {!totalManual && derived.autoTotal > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                        <Sparkles className="h-3 w-3" /> محاسبه خودکار
                      </span>
                    )}
                  </span> as any
                }
                error={errors.total_students}
              >
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.total_students}
                    onChange={(e) => { setTotalManual(true); setField('total_students', e.target.value); }}
                    placeholder="0"
                    min="0"
                    disabled={isSubmitting || !totalManual}
                    readOnly={!totalManual}
                    className={!totalManual ? 'bg-muted/40' : ''}
                  />
                  {!totalManual ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setTotalManual(true)} className="shrink-0 gap-1">
                      <Pencil className="h-3.5 w-3.5" /> ویرایش دستی
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setTotalManual(false); setField('total_students', String(derived.autoTotal || '')); }} className="shrink-0 gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> خودکار
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  با وارد کردن پسران و دختران در گام بعد، مجموع به‌طور خودکار محاسبه می‌شود.
                </p>
              </FormFieldWrapper>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <FormFieldWrapper label="دانش‌آموزان پسر">
                  <Input type="number" value={formData.male_students} onChange={(e) => setField('male_students', e.target.value)} placeholder="0" min="0" disabled={isSubmitting} />
                </FormFieldWrapper>
                <FormFieldWrapper label="دانش‌آموزان دختر">
                  <Input type="number" value={formData.female_students} onChange={(e) => setField('female_students', e.target.value)} placeholder="0" min="0" disabled={isSubmitting} />
                </FormFieldWrapper>
                <FormFieldWrapper label="کل معلمان">
                  <Input type="number" value={formData.total_teachers} onChange={(e) => setField('total_teachers', e.target.value)} placeholder="0" min="0" disabled={isSubmitting} />
                </FormFieldWrapper>
                <FormFieldWrapper label="نرخ حضور (%)" error={errors.attendance_rate}>
                  <Input type="number" value={formData.attendance_rate} onChange={(e) => setField('attendance_rate', e.target.value)} placeholder="85.5" min="0" max="100" step="0.1" disabled={isSubmitting} />
                </FormFieldWrapper>
              </div>

              {(derived.autoTotal > 0 || derived.studentsPerTeacher != null) && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <Sparkles className="h-4 w-4" /> محاسبات خودکار
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold">{toPersianDigits(derived.autoTotal)}</div>
                      <div className="text-[11px] text-muted-foreground">مجموع دانش‌آموزان</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {derived.studentsPerTeacher != null ? toPersianDigits(derived.studentsPerTeacher.toFixed(1)) : '—'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">دانش‌آموز به معلم</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {derived.femalePercent != null ? `${toPersianDigits(derived.femalePercent.toFixed(0))}٪` : '—'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">درصد دختران</div>
                    </div>
                  </div>
                  {derived.isOvercrowded && (
                    <Alert className="border-warning/30 bg-warning/10 py-2">
                      <AlertCircle className="h-3.5 w-3.5 text-warning" />
                      <AlertDescription className="text-warning text-xs">
                        نسبت دانش‌آموز به معلم بالای ۴۰ است — کیفیت تدریس می‌تواند تحت تأثیر قرار گیرد.
                      </AlertDescription>
                    </Alert>
                  )}
                  {derived.totalMismatch && (
                    <Alert className="border-warning/30 bg-warning/10 py-2">
                      <AlertCircle className="h-3.5 w-3.5 text-warning" />
                      <AlertDescription className="text-warning text-xs flex items-center justify-between gap-2">
                        <span>مجموع پسر و دختر ({toPersianDigits(derived.autoTotal)}) با کل دستی مطابقت ندارد.</span>
                        <Button size="sm" variant="ghost" className="h-6 text-xs"
                          onClick={() => { setTotalManual(false); setField('total_students', String(derived.autoTotal)); }}>
                          اصلاح
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <FormFieldWrapper label="یادداشت‌های اضافی">
                <Textarea value={formData.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="هر اطلاعات اضافی..." rows={3} disabled={isSubmitting} />
              </FormFieldWrapper>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl border divide-y">
                {summary.map((r) => (
                  <div key={r.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
              {formData.notes && (
                <div className="rounded-xl border p-4 text-sm">
                  <p className="text-muted-foreground mb-1">یادداشت‌ها</p>
                  <p className="whitespace-pre-wrap">{formData.notes}</p>
                </div>
              )}
              <Alert className="border-primary/20 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground/80 text-xs">
                  پس از ارسال، اطلاعات به ولسوالی → ولایت → وزارت ارجاع داده می‌شود.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={prev} disabled={step === 0 || isSubmitting} className="gap-1">
              <ArrowRight className="h-4 w-4" />
              قبلی
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={isSubmitting} className="gap-1">
                بعدی
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ارسال…</>
                ) : (
                  'تأیید و ارسال'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
