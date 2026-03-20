import { useCallback, useState } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationRules {
  [field: string]: ValidationRule | ValidationRule[];
}

interface ValidationError {
  [field: string]: string;
}

/**
 * Smart real-time form validation hook
 * Provides instant feedback for user inputs
 * Supports custom, field-specific, and async validation
 */
export function useSmartValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationError>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const fieldRules = rules[fieldName];
    if (!fieldRules) return null;

    const rulesToCheck = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

    for (const rule of rulesToCheck) {
      // Required validation
      if (rule.required && (!value || value.toString().trim() === '')) {
        return rule.message || `${fieldName} is required`;
      }

      // Only validate if value exists
      if (!value || value.toString().trim() === '') continue;

      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `Minimum ${rule.minLength} characters required`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `Maximum ${rule.maxLength} characters allowed`;
      }

      // Pattern validation (email, phone, etc)
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `Invalid ${fieldName}`;
      }

      // Custom validation
      if (rule.customValidator) {
        const result = rule.customValidator(value);
        if (result !== true) {
          return typeof result === 'string' ? result : rule.message || `Invalid ${fieldName}`;
        }
      }
    }

    return null;
  }, [rules]);

  const validateForm = useCallback(
    (formData: { [key: string]: any }): boolean => {
      const newErrors: ValidationError = {};
      let isValid = true;

      Object.keys(rules).forEach((fieldName) => {
        const error = validateField(fieldName, formData[fieldName]);
        if (error) {
          newErrors[fieldName] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [rules, validateField]
  );

  const handleFieldChange = useCallback(
    (fieldName: string, value: any) => {
      // Only validate if field has been touched
      if (touched[fieldName]) {
        const error = validateField(fieldName, value);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error || undefined,
        }));
      }
    },
    [touched, validateField]
  );

  const handleFieldBlur = useCallback((fieldName: string, value: any) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error || undefined,
    }));
  }, [validateField]);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    validateForm,
    handleFieldChange,
    handleFieldBlur,
    clearFieldError,
    clearAllErrors,
    isValid: Object.keys(errors).length === 0,
  };
}

// Common validation patterns
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]{10,}$/,
  SCHOOL_CODE: /^[A-Z0-9]{6,}$/,
  NUMERIC: /^\d+$/,
  PHONE_AF: /^(\+93|0)[0-9]{9}$/,
};

// Common validators
export const CommonValidators = {
  email: (value: string) => ValidationPatterns.EMAIL.test(value) || 'Invalid email address',
  phone: (value: string) => ValidationPatterns.PHONE.test(value) || 'Invalid phone number',
  phoneAF: (value: string) => ValidationPatterns.PHONE_AF.test(value) || 'Invalid Afghan phone number',
  numeric: (value: string) => ValidationPatterns.NUMERIC.test(value) || 'Only numbers allowed',
  schoolCode: (value: string) => ValidationPatterns.SCHOOL_CODE.test(value) || 'Invalid school code (6+ alphanumeric)',
  passwordStrength: (value: string) => {
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain number';
    return true;
  },
};
