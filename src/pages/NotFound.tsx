import { Helmet } from 'react-helmet-async';
import NavigationBackButton from '@/components/NavigationBackButton';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted" dir="rtl">
      <Helmet>
        <title>صفحه یافت نشد | پل آموزش افغانستان</title>
        <meta name="description" content="متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا آدرس آن تغییر یافته است." />
      </Helmet>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">۴۰۴ - صفحه مورد نظر یافت نشد</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا آدرس آن تغییر یافته است.
        </p>
        <NavigationBackButton fallback="/" label="بازگشت به صفحه اصلی" />
      </div>
    </div>
  );
};

export default NotFound;
