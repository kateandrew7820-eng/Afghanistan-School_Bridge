# Persian Error Messages Library - کتالوگ پیام‌ها

Quick lookup برای تمام پیام‌های فارسی موجود در سیستم

## 1. General Error Messages (ERROR_MESSAGES_FA)

| Error Type | Title (فارسی) | Message (فارسی) | When Used |
|---|---|---|---|
| `validation` | خطای اعتبارسنجی | لطفاً معلومات خود را بررسی کنید | فیلد به غلط پر شده |
| `network` | خطای اتصال | اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید | شبکه قطع |
| `auth` | خطای احراز هویت | نام کاربری یا رمز عبور نادرست است | Wrong credentials |
| `unauthorized` | دسترسی ممنوع | شما اجازه دسترسی به این صفحه را ندارید | 403 Forbidden |
| `not_found` | یافت نشد | اطلاعاتی که به دنبال آن هستید موجود نیست | 404 Not Found |
| `server` | خطای سرور | مشکلی در سرور پیش آمده است. لطفاً بعداً تلاش کنید | 500+ errors |
| `timeout` | زمان انتظار تمام شد | درخواست شما بیش‌ازحد طول کشید. دوباره تلاش کنید | Request timeout |
| `unknown` | خطای نامشخص | خطایی نامشخص رخ داده است. لطفاً دوباره تلاش کنید | Unknown error |
| `file_upload` | خطای بارگذاری فایل | فایل شما بارگذاری نشد. لطفاً دوباره تلاش کنید | Upload failed |
| `insufficient_permissions` | مجوز ناکافی | شما اجازه انجام این کار را ندارید | Not authorized |
| `duplicate_entry` | ورودی تکراری | این مورد قبلاً در سیستم ثبت شده است | Duplicate record |

### Import:
```tsx
import { ERROR_MESSAGES_FA } from '@/lib/errors';
console.log(ERROR_MESSAGES_FA.network.message); 
// "اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید"
```

## 2. Validation Error Messages (VALIDATION_ERRORS_FA)

| Key | Message (فارسی) | Usage |
|---|---|---|
| `required` | این فیلد الزامی است | Empty required field |
| `email` | لطفاً یک ایمیل معتبر وارد کنید | Invalid email format |
| `email_required` | (derived) | Email field is required |
| `phone` | لطفاً یک شماره تلفن معتبر وارد کنید | Invalid phone format |
| `phone_invalid_afghanistan` | لطفاً یک شماره تلفن افغان معتبر وارد کنید (با +93 یا 0) | Afghan number validation |
| `phone_required` | (derived) | Phone field required |
| `schoolCode` | کد مکتب نامعتبر است | Invalid school code |
| `minLength` | حداقل {{count}} حرف مورد نیاز است | String too short |
| `maxLength` | حداکثر {{count}} حرف مجاز است | String too long |
| `passwordStrength` | رمز عبور باید شامل حروف، اعداد و نمادهای خاص باشد | Weak password |
| `file_required` | فایل انتخاب کنید | No file selected |
| `file_too_large` | حجم فایل خیلی بزرگ است | File size exceeded |
| `file_type_invalid` | نوع فایل مجاز نیست | Wrong file type |
| `duplicate` | این مورد قبلاً وجود دارد | Record already exists |
| `date_invalid` | تاریخ نامعتبر است | Invalid date format |
| `date_in_past` | تاریخ نمی‌تواند در گذشته باشد | Date is in past |
| `age_invalid` | سن نامعتبر است | Invalid age |
| `email_already_exists` | این ایمیل قبلاً ثبت شده است | Email already registered |
| `phone_already_exists` | این شماره تلفن قبلاً ثبت شده است | Phone already registered |
| `network_error` | خطای شبکه | Network unavailable |
| `server_error` | خطای سرور | Server error |
| `invalid_field` | {{fieldName}} نامعتبر است | Generic validation |
| `match_error` | {{field1}} و {{field2}} با هم مطابقت ندارند | Fields don't match |

### Import:
```tsx
import { VALIDATION_ERRORS_FA } from '@/lib/errors';
const error = VALIDATION_ERRORS_FA.email; 
// "لطفاً یک ایمیل معتبر وارد کنید"
```

## 3. API Error Messages (API_ERROR_MESSAGES_FA)

| Key | Message (فارسی) | Scenario |
|---|---|---|
| `connection_error` | خطا در اتصال به سرور | Cannot reach server |
| `timeout` | درخواست شما پاسخ داده نشد | Request timed out |
| `network_error` | مشکل در اتصال اینترنت | Network down |
| `invalid_response` | پاسخ سرور نامعتبر است | Invalid response format |
| `missing_data` | معلومات مورد نیاز وجود ندارد | Missing required fields |
| `insufficient_permissions` | شما مجوز لازم را ندارید | 403 Forbidden |
| `resource_not_found` | منبع مورد نظر یافت نشد | 404 Not Found |
| `conflict` | این منبع قبلاً موجود است | 409 Conflict |
| `rate_limit` | تعداد درخواست‌های شما بیشتر است. بعداً تلاش کنید | Rate limited |
| `maintenance` | سیستم درحال نگهداری است. بعداً امتحان کنید | Server maintenance |
| `unknown` | خطای نامشخص رخ داده است | Unknown error |

### Import:
```tsx
import { API_ERROR_MESSAGES_FA } from '@/lib/errors';
const msg = API_ERROR_MESSAGES_FA.timeout;
// "درخواست شما پاسخ داده نشد"
```

## 4. Validation Functions Results

جستجوی پیام‌های returned توسط validation functions:

```tsx
import * as validation from '@/lib/validation';

// Email
validateEmail("bad") → "لطفاً یک ایمیل معتبر وارد کنید"

// Phone - General
validatePhone("123") → "لطفاً یک شماره تلفن معتبر وارد کنید"

// Phone - Afghanistan
validatePhone("123", true) → "لطفاً یک شماره تلفن افغان معتبر وارد کنید..."

// Required
validateRequired("") → "فیلد مورد نظر را پر کنید" (یا custom message)

// MinLength
validateMinLength("abc", 5) → "حداقل 5 کاراکتر وارد کنید"

// MaxLength  
validateMaxLength("abcdefghijk", 5) → "حداکثر 5 کاراکتر مجاز است"

// Password
validatePassword("weak") → "کلمه عبور باید حداقل 8 کاراکتر باشد"

// File Size
validateFileSize(file, 5) → "حجم فایل خیلی بزرگ است"

// Date
validateDate("invalid") → "تاریخ نامعتبر است"

// Age
validateAge("2024-01-01", 18) → "سن شما باید حداقل 18 سال باشد"

// Number Range
validateNumberRange(15, 1, 10) → "عدد باید بین 1 و 10 باشد"
```

## 5. Setup Profile مثال Messages

مثال پیام‌ها برای یک setup form:

| Field | هنگام Empty | هنگام Invalid | Success |
|---|---|---|---|
| نام کامل | "این فیلد الزامی است" | "نام کامل باید حداقل 3 حرف باشد" | ✓ |
| ایمیل | "این فیلد الزامی است" | "لطفاً یک ایمیل معتبر وارد کنید" | ✓ |
| تلفن | "این فیلد الزامی است" | "لطفاً یک شماره تلفن افغان معتبر وارد کنید" | ✓ |
| Password | "این فیلد الزامی است" | "رمز عبور باید حداقل 8 کاراکتر باشد" | ✓ |

## 6. رنگ‌کدینگ توصیات

```tsx
// Validation Error - Red
<FormFieldError error={error} /> // Red text

// Success - Green  
<FormFieldError error={null} success /> // Green checkmark

// Warning - Orange
showWarningToast() // Orange border

// Info - Blue
showInfoToast() // Blue border
```

## 7. بیشترین استفاده شده Messages

Top 10 frequently needed phrases:

1. ✅ "این فیلد الزامی است"
2. ✅ "لطفاً یک ایمیل معتبر وارد کنید"
3. ✅ "اتصال اینترنت خود را بررسی کنید"
4. ✅ "خطایی رخ داده است. دوباره تلاش کنید"
5. ✅ "درحال ذخیره..."
6. ✅ "موفقیت!"
7. ✅ "حجم فایل خیلی بزرگ است"
8. ✅ "شما دسترسی ندارید"
9. ✅ "تاریخ نامعتبر است"
10. ✅ "کلمه عبور الزامی است"

## چگونه استفاده کنم

### 1. Copy-Paste Messages
```tsx
import { VALIDATION_ERRORS_FA } from '@/lib/errors';
const msg = VALIDATION_ERRORS_FA.required; // "این فیلد الزامی است"
```

### 2. استفاده Validation Functions
```tsx
const error = validateEmail(email); // Returns Persian message
```

### 3. Import Directly
```tsx
import { useErrorToast } from '@/lib/errorToast';
const { showValidationError } = useErrorToast();
showValidationError('لطفاً یک ایمیل معتبر وارد کنید');
```

### 4. Custom Messages
```tsx
const rule = { 
  type: 'email',
  message: 'ایمیل درستی وارد کنید' // Custom!
};
```

## موقعیت‌ها

استفاده داخل ErrorBoundary: ✅  
استفاده داخل Form Validation: ✅  
استفاده داخل API Error Handling: ✅  
استفاده داخل Toast Notifications: ✅  
استفاده داخل DEV Simulation: ✅  

---

**نکته**: تمام پیام‌ها فارسی درست و گرامار صحیح دارند. اگر نیاز به پیام جدید است، اول این لیست رو بررسی کنید! 📝
