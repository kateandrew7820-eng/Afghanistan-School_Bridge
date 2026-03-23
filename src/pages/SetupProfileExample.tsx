/**
 * Example: Using Error Handling System with SetupProfile Form
 * 
 * This example demonstrates how to integrate the comprehensive error handling
 * system with a real form component, including validation, API calls, and
 * user-friendly error display.
 */

import React, { useState } from 'react';
import { useAPIError, useFormValidation } from '@/hooks/useAPIError';
import { 
  validateForm, 
  validateEmail, 
  validatePhone,
  validateRequired,
  validateMinLength 
} from '@/lib/validation';
import { 
  FormFieldWrapper, 
  FormErrorSummary, 
  FormFieldError 
} from '@/components/FormFieldError';
import { useErrorToast } from '@/lib/errorToast';
import { Button } from '@/components/ui/button';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  province: string;
  district: string;
}

const INITIAL_FORM_DATA: ProfileFormData = {
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  address: '',
  province: '',
  district: '',
};

/**
 * SetupProfile Component with Full Error Handling
 */
export default function SetupProfileWithErrorHandling() {
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error handling hooks
  const { errors, touched, setFieldError, setFieldTouched, clearAllErrors, hasErrors } = 
    useFormValidation();
  const { executeWithErrorHandling, error: apiError, isLoading } = 
    useAPIError({
      showToast: true,
      context: 'Setup Profile',
    });
  const { showError, showSuccess, showValidationError } = useErrorToast();

  /**
   * Handle field change - clear error when user types
   */
  const handleFieldChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setFieldError(field, null);
    }
  };

  /**
   * Handle field blur - real-time validation
   */
  const handleFieldBlur = (field: keyof ProfileFormData) => {
    setFieldTouched(field);
    
    // Perform real-time validation based on field type
    let error: string | null = null;

    switch (field) {
      case 'fullName':
        error = validateRequired(formData.fullName, 'نام کامل');
        if (!error) {
          error = validateMinLength(formData.fullName, 3);
        }
        break;
      case 'email':
        error = validateEmail(formData.email);
        break;
      case 'phone':
        error = validatePhone(formData.phone, true); // Afghanistan format
        break;
      case 'birthDate':
        error = validateRequired(formData.birthDate, 'تاریخ تولد');
        break;
    }

    if (error) {
      setFieldError(field, error);
    }
  };

  /**
   * Validate entire form before submission
   */
  const validateFormData = (): boolean => {
    clearAllErrors();

    const validationErrors = validateForm(formData, {
      fullName: [
        { type: 'required' },
        { type: 'minLength', value: 3, message: 'نام کامل باید حداقل 3 حرف باشد' },
      ],
      email: [
        { type: 'required' },
        { type: 'email' },
      ],
      phone: [
        { type: 'required' },
        { type: 'phone' },
      ],
      birthDate: [
        { type: 'required' },
      ],
      address: [
        { type: 'required' },
      ],
      province: [
        { type: 'required' },
      ],
      district: [
        { type: 'required' },
      ],
    });

    if (Object.keys(validationErrors).length > 0) {
      // Set all validation errors
      Object.entries(validationErrors).forEach(([field, error]) => {
        setFieldError(field, error);
        setFieldTouched(field);
      });
      return false;
    }

    return true;
  };

  /**
   * Handle form submission with error handling
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateFormData()) {
      showValidationError('لطفاً تمام فیلدهای الزامی را پر کنید');
      return;
    }

    setIsSubmitting(true);

    // Call API with error handling
    const { data, error } = await executeWithErrorHandling(
      async () => {
        // Example API call (replace with actual API)
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
      },
      (data) => {
        // Success callback
        showSuccess('پروفایل شما با موفقیت ذخیره شد');
        // Reset form or navigate
        setFormData(INITIAL_FORM_DATA);
        clearAllErrors();
      }
    );

    setIsSubmitting(false);

    // Error was already handled by executeWithErrorHandling + showToast
    // But we can add additional UI logic here if needed
    if (error) {
      console.error('Profile update failed:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-right">تنظیم پروفایل</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Summary - shown at top if there are validation errors */}
        {hasErrors && (
          <FormErrorSummary 
            errors={errors}
            onDismiss={clearAllErrors}
            className="mb-6"
          />
        )}

        {/* Full Name Field */}
        <FormFieldWrapper
          label="نام کامل"
          name="fullName"
          error={errors.fullName}
          touched={touched.fullName}
          required
          hint="نام و نام خانوادگی خود را وارد کنید"
        >
          <input
            type="text"
            value={formData.fullName}
            onChange={e => handleFieldChange('fullName', e.target.value)}
            onBlur={() => handleFieldBlur('fullName')}
            placeholder="مثال: احمد حسنی"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
        </FormFieldWrapper>

        {/* Email Field */}
        <FormFieldWrapper
          label="ایمیل"
          name="email"
          error={errors.email}
          touched={touched.email}
          required
          hint="ایمیل معتبری که می‌توانیم از طریق آن با شما تماس بگیریم"
        >
          <input
            type="email"
            value={formData.email}
            onChange={e => handleFieldChange('email', e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            placeholder="example@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </FormFieldWrapper>

        {/* Phone Field */}
        <FormFieldWrapper
          label="شماره تلفن"
          name="phone"
          error={errors.phone}
          touched={touched.phone}
          required
          hint="شماره تلفن همراه افغانی (با +93 یا 0 فهمیدم)"
        >
          <input
            type="tel"
            value={formData.phone}
            onChange={e => handleFieldChange('phone', e.target.value)}
            onBlur={() => handleFieldBlur('phone')}
            placeholder="+93701234567 یا 0701234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
        </FormFieldWrapper>

        {/* Birth Date Field */}
        <FormFieldWrapper
          label="تاریخ تولد"
          name="birthDate"
          error={errors.birthDate}
          touched={touched.birthDate}
          required
        >
          <input
            type="date"
            value={formData.birthDate}
            onChange={e => handleFieldChange('birthDate', e.target.value)}
            onBlur={() => handleFieldBlur('birthDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            aria-describedby={errors.birthDate ? 'birthDate-error' : undefined}
          />
        </FormFieldWrapper>

        {/* Address Field */}
        <FormFieldWrapper
          label="آدرس"
          name="address"
          error={errors.address}
          touched={touched.address}
          required
        >
          <textarea
            value={formData.address}
            onChange={e => handleFieldChange('address', e.target.value)}
            onBlur={() => handleFieldBlur('address')}
            placeholder="آدرس کامل خود را وارد کنید"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
        </FormFieldWrapper>

        {/* Province Field */}
        <FormFieldWrapper
          label="ولایت"
          name="province"
          error={errors.province}
          touched={touched.province}
          required
        >
          <select
            value={formData.province}
            onChange={e => handleFieldChange('province', e.target.value)}
            onBlur={() => handleFieldBlur('province')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            aria-describedby={errors.province ? 'province-error' : undefined}
          >
            <option value="">-- انتخاب کنید --</option>
            <option value="kabul">کابل</option>
            <option value="kandahar">قندهار</option>
            <option value="herat">هرات</option>
            <option value="mazar">مزار شریف</option>
          </select>
        </FormFieldWrapper>

        {/* District Field */}
        <FormFieldWrapper
          label="ولسوالی"
          name="district"
          error={errors.district}
          touched={touched.district}
          required
        >
          <input
            type="text"
            value={formData.district}
            onChange={e => handleFieldChange('district', e.target.value)}
            onBlur={() => handleFieldBlur('district')}
            placeholder="ولسوالی را وارد کنید"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            aria-describedby={errors.district ? 'district-error' : undefined}
          />
        </FormFieldWrapper>

        {/* Submit Button */}
        <div className="flex gap-3 pt-6">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading || hasErrors}
            className="flex-1"
          >
            {isSubmitting || isLoading ? 'درحال ذخیره...' : 'ذخیره پروفایل'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData(INITIAL_FORM_DATA);
              clearAllErrors();
            }}
            className="flex-1"
          >
            پاک کردن
          </Button>
        </div>

        {/* Debug: Show current form state (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 p-4 bg-gray-100 dark:bg-gray-900 rounded">
            <summary className="cursor-pointer font-semibold">حالت فورم (توسعه only)</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify({ formData, errors, touched, hasErrors }, null, 2)}
            </pre>
          </details>
        )}
      </form>
    </div>
  );
}
