# خطای مدیریت سیستم - کوئیک ریفرنس

سریع نگاه دارید که چطوری خطاها را مدیریت کنید

## 1️⃣ API Call

```tsx
import { useAPIError } from '@/hooks/useAPIError';

const { executeWithErrorHandling, isLoading } = useAPIError();

const { data, error } = await executeWithErrorHandling(() => 
  supabase.from('users').select('*')
);
```

## 2️⃣ Form Validation

```tsx
import { useFormValidation } from '@/hooks/useAPIError';
import { validateForm } from '@/lib/validation';
import { FormFieldWrapper } from '@/components/FormFieldError';

const { errors, touched, setFieldError, setFieldTouched } = useFormValidation();

// Single field
const error = validateEmail(email);

// Entire form
const validateForm(formData, {
  email: [{ type: 'required' }, { type: 'email' }],
  phone: [{ type: 'required' }],
});
```

## 3️⃣ Show Error Toast

```tsx
import { useErrorToast } from '@/lib/errorToast';

const { showError, showSuccess, showValidationError } = useErrorToast();

showError(appError); // خودکار
showSuccess('موفق!');
showValidationError('خطای اعتبارسنجی');
```

## 4️⃣ Handle Specific Errors

```tsx
import { classifyError, handleSupabaseError } from '@/lib/errors';

// Generic error
const appError = classifyError(error);

// Supabase error
const appError = handleSupabaseError(supabaseError);

console.log(appError.type); // 'network', 'auth', etc.
console.log(appError.messageFa); // Persian message
```

## 5️⃣ Retry with Network Detection

```tsx
const { executeWithErrorHandling } = useAPIError({
  retryable: true,
  maxRetries: 3,
});

const { isOnline } = useNetworkStatus();
```

## 6️⃣ Form Field Display

```tsx
<FormFieldWrapper
  label="ایمیل"
  error={errors.email}
  touched={touched.email}
  required
>
  <input
    onChange={e => handleChange('email', e.target.value)}
    onBlur={() => setFieldTouched('email')}
  />
</FormFieldWrapper>

<FormErrorSummary errors={errors} />
```

## 7️⃣ Error Summary

```tsx
<FormErrorSummary errors={errors} onDismiss={clearAllErrors} />
```

## 8️⃣ Simulate Errors (DEV Only)

```tsx
import { enableErrorSimulation, SIMULATED_ERROR_TYPES } from '@/lib/errorSimulation';

enableErrorSimulation({
  errorType: SIMULATED_ERROR_TYPES.NETWORK_ERROR,
  delay: 1000,
});
```

## 9️⃣ Wrap App with ErrorBoundary

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <YourAppHere />
    </ErrorBoundary>
  );
}
```

## 🔟 Common Validation Rules

```tsx
validateEmail(email)
validatePhone(phone, isAfghan = true)
validateRequired(value, fieldName)
validateMinLength(value, min)
validateMaxLength(value, max)
validatePassword(password)
validateFileSize(file, maxSizeInMB)
validateDate(dateString)
validateAge(birthDate, minAge = 18)
validateNumberRange(value, min, max)
```

## فایل‌های مهم

| فایل | استفاده | Import |
|------|--------|--------|
| `/src/lib/errors.ts` | تمام نوع‌های خطا، messages | `classifyError`, `handleSupabaseError` |
| `/src/hooks/useAPIError.ts` | API calls، form validation | `useAPIError`, `useFormValidation` |
| `/src/lib/validation.ts` | Validation functions | `validateEmail`, `validateForm` |
| `/src/components/FormFieldError.tsx` | Error UI | `FormFieldWrapper`, `FormErrorSummary` |
| `/src/lib/errorToast.ts` | Toast notifications | `useErrorToast` |
| `/src/lib/errorSimulation.tsx` | DEV mode testing | `enableErrorSimulation` |

## Persian Messages

```tsx
// Custom message
const error = validateEmail(email);
if (error) showError(error); // "ایمیل معتبر وارد کنید"

// API error
const { messageFa } = classifyError(networkError);
// "اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید"

// Validation
const errors = validateForm(data, {...});
// { email: "لطفاً یک ایمیل معتبر وارد کنید" }
```

## Error Types

```
validation - Form validation error
network - Network/internet error  
auth - Authentication error
unauthorized - Permission denied
not_found - Resource not found
server - Server error
timeout - Request timeout
unknown - Unknown error
file_upload - File upload error
insufficient_permissions - Access denied
duplicate_entry - Already exists
```

## مثال کامل

```tsx
import { useAPIError, useFormValidation } from '@/hooks/useAPIError';
import { validateForm } from '@/lib/validation';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import { useErrorToast } from '@/lib/errorToast';

export function MyForm() {
  const [data, setData] = React.useState({});
  const { errors, touched, setFieldError } = useFormValidation();
  const { executeWithErrorHandling } = useAPIError({ showToast: true });
  const { showSuccess } = useErrorToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = validateForm(data, {
      email: [{ type: 'required' }, { type: 'email' }],
    });
    if (Object.keys(validationErrors).length) {
      Object.entries(validationErrors).forEach(([field, error]) => {
        setFieldError(field, error);
      });
      return;
    }

    // Submit
    const { data: result } = await executeWithErrorHandling(
      () => submitForm(data),
      () => showSuccess('ذخیره شد!')
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormErrorSummary errors={errors} />
      
      <FormFieldWrapper error={errors.email} touched={touched.email}>
        <input
          value={data.email}
          onChange={e => setData({ ...data, email: e.target.value })}
        />
      </FormFieldWrapper>

      <button type="submit">ارسال</button>
    </form>
  );
}
```

## توضیحات مختصر

**useAPIError**: API calls + retry  
**useFormValidation**: Form error state  
**validateForm**: Check all fields  
**FormFieldWrapper**: Field + error UI  
**useErrorToast**: Show notifications  
**ErrorBoundary**: Catch React errors  
**enableErrorSimulation**: DEV testing  

---

### بیشتر بدانید

📖 تفصیل کامل: `ERROR_HANDLING_INTEGRATION_GUIDE.md`  
💾 مثال واقعی: `src/pages/SetupProfileExample.tsx`  
📋 خلاصه کامل: `ERROR_HANDLING_SYSTEM_COMPLETE.md`
