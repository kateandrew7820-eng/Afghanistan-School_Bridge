# خطای مدیریت سیستم - راهنمای یکپارچگی

## نمای کلی

سیستم مدیریت خطا یک حل جامع برای مدیریت خطاها در کل برنامه فراهم می‌کند. این شامل:

- **Centralized Error Library** (`/src/lib/errors.ts`) - تمام انواع خطاها و پیام‌های فارسی
- **Error Boundary Component** (`/src/components/ErrorBoundary.tsx`) - جلوگیری از کریش‌های React
- **API Error Hook** (`/src/hooks/useAPIError.ts`) - مدیریت خطاهای API با retry logic
- **Validation Utilities** (`/src/lib/validation.ts`) - بررسی‌های فرم با پیام‌های فارسی
- **Form Error Components** (`/src/components/FormFieldError.tsx`) - نمایش خطاهای فرم
- **Error Simulation Tools** (`/src/lib/errorSimulation.ts`) - تست خطاها در حالت توسعه

## مروحل یکپارچگی سریع

### گام 1: Wrap App با ErrorBoundary

```tsx
// src/App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      {/* باقی برنامه */}
    </ErrorBoundary>
  );
}
```

### گام 2: استفاده از useAPIError برای API Calls

```tsx
import { useAPIError } from '@/hooks/useAPIError';

export function MyComponent() {
  const { executeWithErrorHandling, error, isLoading } = useAPIError({
    showToast: true,
    context: 'Fetch User Data',
  });

  const loadData = async () => {
    const { data, error } = await executeWithErrorHandling(
      () => supabase.from('users').select('*')
    );
    // استفاده کنید data یا handle error
  };

  return (
    <div>
      {error && <p>{error.messageFa}</p>}
      <button onClick={loadData} disabled={isLoading}>
        بارگذاری
      </button>
    </div>
  );
}
```

### گام 3: استفاده از Form Validation

```tsx
import { validateForm, validateEmail } from '@/lib/validation';
import { FormFieldWrapper } from '@/components/FormFieldError';
import { useFormValidation } from '@/hooks/useAPIError';

export function LoginForm() {
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const { errors, touched, setFieldError, setFieldTouched } = useFormValidation();

  const handleBlur = (field: string) => {
    setFieldTouched(field);
    // Validate single field
    const error = validateEmail(formData.email);
    if (error) setFieldError(field, error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate entire form
    const validationErrors = validateForm(formData, {
      email: [{ type: 'required' }, { type: 'email' }],
      password: [{ type: 'required' }, { type: 'minLength', value: 8 }],
    });

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, error]) => {
        setFieldError(field, error);
      });
      return;
    }

    // Submit form
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormFieldWrapper
        label="ایمیل"
        error={errors.email}
        touched={touched.email}
        required
      >
        <input
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          onBlur={() => handleBlur('email')}
        />
      </FormFieldWrapper>
    </form>
  );
}
```

## نمونه‌های دقیق

### 1. صفحه SetupProfile کامل

```tsx
// src/pages/SetupProfile.tsx
import React, { useState } from 'react';
import { useAPIError, useFormValidation } from '@/hooks/useAPIError';
import { validateForm } from '@/lib/validation';
import { FormFieldWrapper, FormErrorSummary } from '@/components/FormFieldError';
import { Button } from '@/components/ui/button';

export default function SetupProfile() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
  });

  const { errors, touched, setFieldError, setFieldTouched, clearAllErrors } = 
    useFormValidation();
  
  const { executeWithErrorHandling, isLoading, error } = useAPIError({
    showToast: true,
    context: 'Setup Profile',
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setFieldError(field, null);
    }
  };

  const handleFieldBlur = (field: string) => {
    setFieldTouched(field);
    // Could do real-time validation here
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();

    // Validate form
    const validationErrors = validateForm(formData, {
      fullName: [
        { type: 'required' },
        { type: 'minLength', value: 3, message: 'نام باید حداقل 3 حرف باشد' },
      ],
      email: [{ type: 'required' }, { type: 'email' }],
      phone: [{ type: 'required' }, { type: 'phone' }],
      birthDate: [{ type: 'required' }],
    });

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, error]) => {
        setFieldError(field, error);
        setFieldTouched(field);
      });
      return;
    }

    // Submit to API
    const { data, error: apiError } = await executeWithErrorHandling(
      () => updateProfile(formData),
      (data) => {
        // Success - navigate or show success message
        console.log('Profile updated:', data);
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Show error summary if there are errors */}
      <FormErrorSummary 
        errors={errors}
        onDismiss={clearAllErrors}
      />

      <FormFieldWrapper
        label="نام کامل"
        name="fullName"
        error={errors.fullName}
        touched={touched.fullName}
        required
      >
        <input
          type="text"
          value={formData.fullName}
          onChange={e => handleFieldChange('fullName', e.target.value)}
          onBlur={() => handleFieldBlur('fullName')}
          placeholder="نام خود را وارد کنید"
          className="w-full px-3 py-2 border rounded-md"
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="ایمیل"
        name="email"
        error={errors.email}
        touched={touched.email}
        required
      >
        <input
          type="email"
          value={formData.email}
          onChange={e => handleFieldChange('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          placeholder="ایمیل خود را وارد کنید"
          className="w-full px-3 py-2 border rounded-md"
        />
      </FormFieldWrapper>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'در حال ذخیره...' : 'ذخیره'}
      </Button>
    </form>
  );
}
```

### 2. API Call Handler Pattern

```tsx
// src/lib/apiClient.ts
import { useAPIError } from '@/hooks/useAPIError';
import { handleSupabaseError } from '@/lib/errors';

export function useSupabaseAPI() {
  const { executeWithErrorHandling } = useAPIError({
    showToast: true,
    retryable: true,
    maxRetries: 2,
  });

  const fetchUsers = async () => {
    return executeWithErrorHandling(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw handleSupabaseError(error);
      return data;
    });
  };

  const updateUser = async (id: string, updates: Record<string, any>) => {
    return executeWithErrorHandling(async () => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);
      
      if (error) throw handleSupabaseError(error);
      return data;
    });
  };

  return { fetchUsers, updateUser };
}
```

### 3. استفاده از DEV Mode Error Simulation

```tsx
// در حالت توسعه، می‌توانید خطاها را شبیه‌سازی کنید
import { enableErrorSimulation, SIMULATED_ERROR_TYPES } from '@/lib/errorSimulation';

// فعال کردن network error برای تست
enableErrorSimulation({
  errorType: SIMULATED_ERROR_TYPES.NETWORK_ERROR,
  delay: 1000, // After 1 second
});

// یا از پنل استفاده کنید
import { ErrorSimulationPanel } from '@/lib/errorSimulation';

export function DevTools() {
  return <ErrorSimulationPanel />;
}
```

## تابع‌های کمکی

### classifyError
خطا را تشخیص می‌دهد و نوع آن را مشخص می‌کند:

```tsx
const error = classifyError(someError);
console.log(error.type); // 'network_error', 'validation_error', etc.
console.log(error.messageFa); // فارسی message
console.log(error.isRecoverable); // true/false
```

### handleSupabaseError
خطاهای Supabase را مدیریت می‌کند:

```tsx
const { data, error } = await supabase.from('users').select('*');
if (error) {
  const appError = handleSupabaseError(error);
  // appError has type, messageFa, isRecoverable, etc.
}
```

### getErrorRecoveryAction
پیشنهاد می‌دهد که کاربر چه کار کند:

```tsx
const recoveryAction = getErrorRecoveryAction(error.type);
// {
//   type: 'retry' | 'contact_support' | 'check_connection' | etc.,
//   messageFa: 'اینترنت خود را بررسی کنید و دوباره تلاش کنید',
// }
```

## بهترین روش‌ها

1. **همیشه Wrap API Calls:**
   ```tsx
   const { executeWithErrorHandling } = useAPIError();
   const { data } = await executeWithErrorHandling(() => apiCall());
   ```

2. **استفاده از FormFieldWrapper برای Consistent UI:**
   ```tsx
   <FormFieldWrapper error={errors.field} touched={touched.field}>
     <input />
   </FormFieldWrapper>
   ```

3. **Provide Context برای بهتر Debugging:**
   ```tsx
   useAPIError({ context: 'Update User Profile' })
   ```

4. **تست خطاها با DEV Mode:**
   ```tsx
   // در حالت توسعه ErrorSimulationPanel را add کنید
   // و نوع خطا را انتخاب کنید برای تست UI
   ```

5. **Clear Errors زمانی که مناسب است:**
   ```tsx
   handleFieldChange = () => {
     // Clear field error when user corrects it
     if (errors[field]) setFieldError(field, null);
   }
   ```

## فیل‌های موجود

- `ERROR_MESSAGES_FA`: General error messages
- `VALIDATION_ERRORS_FA`: Form validation messages
- `API_ERROR_MESSAGES_FA`: API-specific error messages
- `SIMULATED_ERROR_TYPES`: Available error types for DEV mode

تمام پیام‌ها فارسی هستند و برای کاربران افغانی/فارسی‌زبان طراحی شده‌اند.
