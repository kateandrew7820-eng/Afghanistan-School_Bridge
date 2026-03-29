import React, { useState, useCallback } from 'react';
import { useAPIError, useFormValidation } from '@/hooks/useAPIError';
import {
  validateForm,
  validateEmail,
  validatePhone,
  validateRequired,
  validateMinLength,
} from '@/lib/validation';

import {
  FormFieldWrapper,
  FormErrorSummary,
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

export default function SetupProfileWithErrorHandling() {
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    errors,
    touched,
    setFieldError,
    setFieldTouched,
    clearAllErrors,
    hasErrors,
  } = useFormValidation();

  const { executeWithErrorHandling, isLoading } = useAPIError({
    showToast: true,
    context: 'Setup Profile',
  });

  const { showSuccess, showValidationError } = useErrorToast();

  const handleFieldChange = useCallback(
    (field: keyof ProfileFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setFieldError(field, '');
      }
    },
    [errors, setFieldError]
  );

  const validateField = (field: keyof ProfileFormData, value: string) => {
    switch (field) {
      case 'fullName':
        return (
          validateRequired(value, 'نام کامل') ||
          validateMinLength(value, 3)
        );
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value, true);
      case 'birthDate':
      case 'address':
      case 'province':
      case 'district':
        return validateRequired(value, field);
      default:
        return null;
    }
  };

  const handleFieldBlur = (field: keyof ProfileFormData) => {
    setFieldTouched(field);
    const error = validateField(field, formData[field]);

    setFieldError(field, error);
  };

  const validateFormData = () => {
    const validationErrors = validateForm(formData, {
      fullName: [
        { type: 'required' },
        { type: 'minLength', value: 3 },
      ],
      email: [{ type: 'required' }, { type: 'email' }],
      phone: [{ type: 'required' }, { type: 'phone' }],
      birthDate: [{ type: 'required' }],
      address: [{ type: 'required' }],
      province: [{ type: 'required' }],
      district: [{ type: 'required' }],
    });

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, error]) => {
        setFieldError(field as keyof ProfileFormData, error);
        setFieldTouched(field as keyof ProfileFormData);
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFormData()) {
      showValidationError('لطفاً تمام فیلدها را درست پر کنید');
      return;
    }

    setIsSubmitting(true);

    const { error } = await executeWithErrorHandling(async () => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save profile');
      return res.json();
    });

    setIsSubmitting(false);

    if (!error) {
      showSuccess('پروفایل با موفقیت ذخیره شد');
      setFormData(INITIAL_FORM_DATA);
      clearAllErrors();
    }
  };

  const loading = isSubmitting || isLoading;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-right">تنظیم پروفایل</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {hasErrors && (
          <FormErrorSummary errors={errors} onDismiss={clearAllErrors} />
        )}

        {/* Full Name */}
        <FormFieldWrapper label="نام کامل" name="fullName" error={errors.fullName} touched={touched.fullName} required>
          <input
            value={formData.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            onBlur={() => handleFieldBlur('fullName')}
            className="input"
          />
        </FormFieldWrapper>

        {/* Email */}
        <FormFieldWrapper label="ایمیل" name="email" error={errors.email} touched={touched.email} required>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            className="input"
          />
        </FormFieldWrapper>

        {/* Phone */}
        <FormFieldWrapper label="تلفن" name="phone" error={errors.phone} touched={touched.phone} required>
          <input
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            onBlur={() => handleFieldBlur('phone')}
            className="input"
          />
        </FormFieldWrapper>

        {/* Birth Date */}
        <FormFieldWrapper label="تاریخ تولد" name="birthDate" error={errors.birthDate} touched={touched.birthDate} required>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleFieldChange('birthDate', e.target.value)}
            onBlur={() => handleFieldBlur('birthDate')}
            className="input"
          />
        </FormFieldWrapper>

        {/* Address */}
        <FormFieldWrapper label="آدرس" name="address" error={errors.address} touched={touched.address} required>
          <textarea
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            onBlur={() => handleFieldBlur('address')}
            className="input"
          />
        </FormFieldWrapper>

        {/* Province */}
        <FormFieldWrapper label="ولایت" name="province" error={errors.province} touched={touched.province} required>
          <select
            value={formData.province}
            onChange={(e) => handleFieldChange('province', e.target.value)}
            onBlur={() => handleFieldBlur('province')}
            className="input"
          >
            <option value="">انتخاب</option>
            <option value="kabul">کابل</option>
            <option value="herat">هرات</option>
            <option value="kandahar">قندهار</option>
          </select>
        </FormFieldWrapper>

        {/* District */}
        <FormFieldWrapper label="ولسوالی" name="district" error={errors.district} touched={touched.district} required>
          <input
            value={formData.district}
            onChange={(e) => handleFieldChange('district', e.target.value)}
            onBlur={() => handleFieldBlur('district')}
            className="input"
          />
        </FormFieldWrapper>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading || hasErrors} className="flex-1">
            {loading ? 'درحال ذخیره...' : 'ذخیره'}
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
            ریست
          </Button>
        </div>
      </form>
    </div>
  );
}
