/**
 * Form Validation Utilities
 * 
 * Provides validation functions with Persian error messages
 * Integrates with the centralized error system
 */

import { VALIDATION_ERRORS_FA } from '@/lib/errors';

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern' | 'match' | 'custom';
  value?: string | number | RegExp;
  message?: string; // custom error message in Persian
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule[];
}

/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number validation regex (supports various formats)
 */
export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

/**
 * Afghan phone number validation
 */
export const AFGHAN_PHONE_REGEX = /^(\+93|0)?[0-9]{9}$/;

/**
 * Validate email address
 */
export function validateEmail(email: string): string | null {
  if (!email) {
    return VALIDATION_ERRORS_FA.email_required;
  }
  if (!EMAIL_REGEX.test(email)) {
    return VALIDATION_ERRORS_FA.email_invalid;
  }
  return null;
}

/**
 * Validate required field
 */
export function validateRequired(value: string | null | undefined, fieldName: string = 'فیلد'): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return VALIDATION_ERRORS_FA.required || `${fieldName} الزامی است`;
  }
  return null;
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, minLength: number): string | null {
  if (!value) return null;
  if (value.length < minLength) {
    return `حداقل ${minLength} کاراکتر وارد کنید`;
  }
  return null;
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, maxLength: number): string | null {
  if (!value) return null;
  if (value.length > maxLength) {
    return `حداکثر ${maxLength} کاراکتر مجاز است`;
  }
  return null;
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string, isAfghan: boolean = true): string | null {
  if (!phone) {
    return VALIDATION_ERRORS_FA.phone_required;
  }
  const regex = isAfghan ? AFGHAN_PHONE_REGEX : PHONE_REGEX;
  if (!regex.test(phone)) {
    return isAfghan ? VALIDATION_ERRORS_FA.phone_invalid_afghanistan : VALIDATION_ERRORS_FA.phone_invalid;
  }
  return null;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'کلمه عبور الزامی است';
  }
  if (password.length < 8) {
    return 'کلمه عبور باید حداقل 8 کاراکتر باشد';
  }
  // Check for at least one number and one letter
  if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
    return 'کلمه عبور باید شامل حروف و اعداد باشد';
  }
  return null;
}

/**
 * Validate that two fields match
 */
export function validateMatch(value1: string, value2: string, fieldName: string = 'فیلدها'): string | null {
  if (value1 !== value2) {
    return `${fieldName} با هم مطابقت ندارند`;
  }
  return null;
}

/**
 * Validate pattern (regex)
 */
export function validatePattern(value: string, pattern: RegExp, errorMessage: string = 'فورمت نامعتبر است'): string | null {
  if (!value) return null;
  if (!pattern.test(value)) {
    return errorMessage;
  }
  return null;
}

/**
 * Validate file size
 */
export function validateFileSize(file: File | null, maxSizeInMB: number): string | null {
  if (!file) {
    return VALIDATION_ERRORS_FA.file_required;
  }
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > maxSizeInMB) {
    return VALIDATION_ERRORS_FA.file_too_large;
  }
  return null;
}

/**
 * Validate file type
 */
export function validateFileType(file: File | null, allowedTypes: string[]): string | null {
  if (!file) {
    return VALIDATION_ERRORS_FA.file_required;
  }
  if (!allowedTypes.includes(file.type)) {
    return `فقط فایل‌های ${allowedTypes.join('، ')} مجاز است`;
  }
  return null;
}

/**
 * Validate date
 */
export function validateDate(dateString: string): string | null {
  if (!dateString) {
    return 'تاریخ الزامی است';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'تاریخ نامعتبر است';
  }
  return null;
}

/**
 * Validate date is not in past
 */
export function validateDateNotPast(dateString: string): string | null {
  const error = validateDate(dateString);
  if (error) return error;

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return 'تاریخ نمی‌تواند در گذشته باشد';
  }
  return null;
}

/**
 * Validate age
 */
export function validateAge(birthDate: string, minAge: number = 18): string | null {
  const error = validateDate(birthDate);
  if (error) return error;

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < minAge) {
    return `سن شما باید حداقل ${minAge} سال باشد`;
  }

  if (age > 120) {
    return 'سن نامعتبر است';
  }

  return null;
}

/**
 * Validate number range
 */
export function validateNumberRange(value: number | string, min: number, max: number): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return 'یک عدد معتبر وارد کنید';
  }

  if (num < min || num > max) {
    return `عدد باید بین ${min} و ${max} باشد`;
  }

  return null;
}

/**
 * Run validation rules on a field
 */
export function validateField(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    let error: string | null = null;

    switch (rule.type) {
      case 'required':
        error = validateRequired(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'minLength':
        error = validateMinLength(value, rule.value as number);
        break;
      case 'maxLength':
        error = validateMaxLength(value, rule.value as number);
        break;
      case 'pattern':
        error = validatePattern(value, rule.value as RegExp, rule.message);
        break;
      case 'custom':
        // Custom validation function should be in message
        break;
    }

    if (error) {
      return rule.message || error;
    }
  }

  return null;
}

/**
 * Validate entire form
 */
export function validateForm(
  formData: Record<string, any>,
  validationRules: FieldValidation
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const value = formData[fieldName];
    const error = validateField(value, rules);

    if (error) {
      errors[fieldName] = error;
    }
  }

  return errors;
}

export default {
  validateEmail,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePhone,
  validatePassword,
  validateMatch,
  validatePattern,
  validateFileSize,
  validateFileType,
  validateDate,
  validateDateNotPast,
  validateAge,
  validateNumberRange,
  validateField,
  validateForm,
};
