/**
 * Error Sanitization Utility
 * Prevents leaking database internals (table names, constraint names) to users.
 */

const ERROR_MAP: Record<string, string> = {
  // RLS / auth
  'new row violates row-level security': 'شما مجاز به انجام این عمل نیستید',
  'row-level security': 'دسترسی غیرمجاز',
  'JWT expired': 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید',
  'invalid JWT': 'نشست نامعتبر. لطفاً دوباره وارد شوید',
  // Constraints
  'duplicate key': 'این رکورد قبلاً وجود دارد',
  'unique constraint': 'این اطلاعات قبلاً ثبت شده است',
  'foreign key constraint': 'اطلاعات مرتبط یافت نشد',
  'not-null constraint': 'لطفاً تمام فیلدهای الزامی را پر کنید',
  'check constraint': 'مقدار وارد شده معتبر نیست',
  // Storage
  'Payload too large': 'حجم فایل بیش از حد مجاز است',
  'bucket not found': 'خطا در آپلود فایل',
  // Network
  'Failed to fetch': 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید',
  'NetworkError': 'خطا در اتصال به شبکه',
  'TIMEOUT': 'عملیات بیش از حد طول کشید',
  // Form data
  'form_data exceeds maximum size': 'حجم داده‌های فورم بیش از حد مجاز است (حداکثر ۱۰۰ کیلوبایت)',
};

/**
 * Sanitize an error message for display to users.
 * Matches known patterns and returns a Persian-friendly message.
 * Falls back to a generic message if no pattern matches.
 */
export function sanitizeError(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as any).message)
        : '';

  // Check each known pattern
  for (const [pattern, persianMessage] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(pattern.toLowerCase())) {
      return persianMessage;
    }
  }

  // If the message contains SQL-like terms, sanitize it
  if (/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|TABLE|COLUMN|INDEX|CONSTRAINT)\b/i.test(message)) {
    return 'خطایی در پردازش درخواست رخ داد';
  }

  // If message looks safe (no SQL internals), return it
  if (message.length > 0 && message.length < 200) {
    return message;
  }

  return 'خطایی نامعلوم رخ داد. لطفاً دوباره تلاش کنید';
}

export default sanitizeError;
