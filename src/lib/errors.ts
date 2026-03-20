/**
 * Centralized Error Handling System
 * 
 * Provides consistent error types, messages in Persian/Dari, and error utilities
 * for the entire application
 */

// ============================================================================
// Error Types
// ============================================================================

export type ErrorType = 
  | 'validation'
  | 'network'
  | 'auth'
  | 'unauthorized'
  | 'not_found'
  | 'server'
  | 'timeout'
  | 'unknown'
  | 'file_upload'
  | 'insufficient_permissions'
  | 'duplicate_entry';

export interface AppError {
  type: ErrorType;
  message: string;
  messageFa: string; // Persian/Dari message
  statusCode?: number;
  originalError?: Error | unknown;
  timestamp: number;
  userAction?: string; // What the user should do
  devInfo?: string; // Extra info for developers
}

// ============================================================================
// Persian Error Messages
// ============================================================================

export const ERROR_MESSAGES_FA: Record<ErrorType, { title: string; message: string }> = {
  validation: {
    title: 'خطای اعتبارسنجی',
    message: 'لطفاً معلومات خود را بررسی کنید'
  },
  network: {
    title: 'خطای اتصال',
    message: 'اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید'
  },
  auth: {
    title: 'خطای احراز هویت',
    message: 'نام کاربری یا رمز عبور نادرست است'
  },
  unauthorized: {
    title: 'دسترسی ممنوع',
    message: 'شما اجازه دسترسی به این صفحه را ندارید'
  },
  not_found: {
    title: 'یافت نشد',
    message: 'اطلاعاتی که به دنبال آن هستید موجود نیست'
  },
  server: {
    title: 'خطای سرور',
    message: 'مشکلی در سرور پیش آمده است. لطفاً بعداً تلاش کنید'
  },
  timeout: {
    title: 'زمان انتظار تمام شد',
    message: 'درخواست شما بیش‌ازحد طول کشید. دوباره تلاش کنید'
  },
  unknown: {
    title: 'خطای نامشخص',
    message: 'خطایی نامشخص رخ داده است. لطفاً دوباره تلاش کنید'
  },
  file_upload: {
    title: 'خطای بارگذاری فایل',
    message: 'فایل شما بارگذاری نشد. لطفاً دوباره تلاش کنید'
  },
  insufficient_permissions: {
    title: 'مجوز ناکافی',
    message: 'شما اجازه انجام این کار را ندارید'
  },
  duplicate_entry: {
    title: 'ورودی تکراری',
    message: 'این مورد قبلاً در سیستم ثبت شده است'
  }
};

// ============================================================================
// Specific Validation Error Messages in Persian
// ============================================================================

export const VALIDATION_ERRORS_FA: Record<string, string> = {
  // Field-specific errors
  'required': 'این فیلد الزامی است',
  'email': 'لطفاً یک ایمیل معتبر وارد کنید',
  'phone': 'لطفاً یک شماره تلفن معتبر وارد کنید',
  'phoneAF': 'لطفاً یک شماره تلفن افغان معتبر وارد کنید (با +93 یا 0)',
  'schoolCode': 'کد مکتب نامعتبر است',
  'minLength': 'حداقل {{count}} حرف مورد نیاز است',
  'maxLength': 'حداکثر {{count}} حرف مجاز است',
  'passwordStrength': 'رمز عبور باید شامل حروف، اعداد و نمادهای خاص باشد',
  'passwordMatch': 'رمز عبورها مطابقت ندارند',
  'fileSize': 'حجم فایل باید کمتر از {{maxSize}} باشد',
  'fileType': 'نوع فایل {{types}} مجاز است',
  'emptySelection': 'لطفاً یک گزینه انتخاب کنید',
  'invalidDate': 'تاریخ نامعتبر است',
  'dateRange': 'تاریخ شروع باید قبل از تاریخ پایان باشد',
  'numeric': 'لطفاً تنها اعداد وارد کنید',
  'alphanumeric': 'لطفاً تنها حروف و اعداد وارد کنید',
  'url': 'لطفاً یک URL معتبر وارد کنید',
  'duplicate': 'این مورد قبلاً وجود دارد',
  'notFound': 'این مورد یافت نشد',
  'unauthorized': 'شما اجازه دسترسی به این مورد را ندارید',
  'serverError': 'خطایی در سرور پیش آمده است'
};

// ============================================================================
// API Error Messages in Persian
// ============================================================================

export const API_ERROR_MESSAGES_FA: Record<string, string> = {
  'connection_error': 'خطا در اتصال به سرور',
  'timeout': 'درخواست شما پاسخ داده نشد',
  'network_error': 'مشکل در اتصال اینترنت',
  'invalid_response': 'پاسخ سرور نامعتبر است',
  'missing_data': 'معلومات مورد نیاز وجود ندارد',
  'insufficient_permissions': 'شما مجوز لازم را ندارید',
  'resource_not_found': 'منبع مورد نظر یافت نشد',
  'conflict': 'این منبع قبلاً موجود است',
  'rate_limit': 'تعداد درخواست‌های شما بیشتر است. بعداً تلاش کنید',
  'maintenance': 'سیستم درحال نگهداری است. بعداً امتحان کنید',
  'unknown': 'خطای نامشخص رخ داده است'
};

// ============================================================================
// Error Creation Functions
// ============================================================================

/**
 * Create a standardized AppError
 */
export function createError(
  type: ErrorType,
  message: string,
  messageFa?: string,
  statusCode?: number,
  originalError?: Error | unknown
): AppError {
  return {
    type,
    message,
    messageFa: messageFa || ERROR_MESSAGES_FA[type].message,
    statusCode,
    originalError,
    timestamp: Date.now(),
  };
}

/**
 * Create a validation error
 */
export function createValidationError(field: string, errorKey: string): AppError {
  const message = VALIDATION_ERRORS_FA[errorKey] || `خطا در فیلد ${field}`;
  return createError('validation', message, message);
}

/**
 * Classify and create error from unknown source
 */
export function classifyError(error: unknown): AppError {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return createError('network', error.message, API_ERROR_MESSAGES_FA['network_error'], undefined, error);
    }

    // Auth errors
    if (error.message.includes('auth') || error.message.includes('Unauthorized')) {
      return createError('auth', error.message, ERROR_MESSAGES_FA['auth'].message, 401, error);
    }

    // Permission errors
    if (error.message.includes('permission') || error.message.includes('Forbidden')) {
      return createError('insufficient_permissions', error.message, ERROR_MESSAGES_FA['insufficient_permissions'].message, 403, error);
    }

    // Not found errors
    if (error.message.includes('not found') || error.message.includes('404')) {
      return createError('not_found', error.message, ERROR_MESSAGES_FA['not_found'].message, 404, error);
    }

    // Server errors
    if (error.message.includes('server') || error.message.includes('500')) {
      return createError('server', error.message, ERROR_MESSAGES_FA['server'].message, 500, error);
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return createError('timeout', error.message, ERROR_MESSAGES_FA['timeout'].message, undefined, error);
    }

    // Default to unknown
    return createError('unknown', error.message, ERROR_MESSAGES_FA['unknown'], undefined, error);
  }

  // Handle non-Error objects
  return createError('unknown', String(error), ERROR_MESSAGES_FA['unknown'], undefined, error);
}

/**
 * Handle Supabase errors specifically
 */
export function handleSupabaseError(error: any): AppError {
  if (!error) {
    return createError('unknown', 'Unknown error', ERROR_MESSAGES_FA['unknown']);
  }

  const errorMessage = error.message || String(error);

  // Specific Supabase error patterns
  if (errorMessage.includes('duplicate key')) {
    return createError('duplicate_entry', errorMessage, VALIDATION_ERRORS_FA['duplicate']);
  }

  if (errorMessage.includes('not found')) {
    return createError('not_found', errorMessage, API_ERROR_MESSAGES_FA['resource_not_found']);
  }

  if (errorMessage.includes('permission denied')) {
    return createError('insufficient_permissions', errorMessage, ERROR_MESSAGES_FA['insufficient_permissions'].message);
  }

  if (errorMessage.includes('already registered')) {
    return createError('duplicate_entry', errorMessage, 'این ایمیل قبلاً ثبت شده است');
  }

  if (errorMessage.includes('Invalid login credentials')) {
    return createError('auth', errorMessage, 'ایمیل یا رمز عبور نادرست است');
  }

  if (errorMessage.includes('PGRST')) {
    return createError('server', errorMessage, ERROR_MESSAGES_FA['server'].message);
  }

  return classifyError(error);
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: AppError | Error | unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'messageFa' in error) {
    return (error as AppError).messageFa;
  }

  return String(error);
}

/**
 * Safe Persian error message extraction
 */
export function getErrorMessageFa(error: AppError | Error | unknown): string {
  if (typeof error === 'object' && error !== null && 'messageFa' in error) {
    return (error as AppError).messageFa;
  }

  if (error instanceof Error) {
    const appError = classifyError(error);
    return appError.messageFa;
  }

  return ERROR_MESSAGES_FA['unknown'].message;
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: AppError | Error | unknown, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    const appError = error instanceof AppError 
      ? error 
      : classifyError(error);

    console.error(
      `[${context || 'ERROR'}] ${appError.type}:`,
      appError.message,
      appError.originalError
    );
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('Connection');
  }
  return false;
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: AppError): boolean {
  return [
    'network',
    'timeout',
    'server',
  ].includes(error.type);
}

/**
 * Get user action recommendation based on error
 */
export function getErrorRecoveryAction(error: AppError): string {
  const actions: Record<ErrorType, string> = {
    'validation': 'فیلد‌های خود را بررسی کنید و دوباره تلاش کنید',
    'network': 'اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید',
    'auth': 'نام کاربری و رمز عبور خود را بررسی کنید',
    'unauthorized': 'لطفاً ابتدا وارد شوید',
    'not_found': 'صفحه یا منبع مورد نظر یافت نشد',
    'server': 'بعداً دوباره تلاش کنید',
    'timeout': 'اتصال خود را بررسی کنید و دوباره تلاش کنید',
    'unknown': 'دوباره تلاش کنید یا با تیم پشتیبانی تماس بگیرید',
    'file_upload': 'فایل دیگری انتخاب کنید و دوباره تلاش کنید',
    'insufficient_permissions': 'با صاحب صلاحیت تماس بگیرید',
    'duplicate_entry': 'اطلاعات تکراری است. یکی از موارد موجود را بشناسید'
  };

  return actions[error.type] || actions['unknown'];
}
