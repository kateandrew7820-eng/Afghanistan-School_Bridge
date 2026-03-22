import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Clock, AlertCircle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { getApproverLabel, getDashboardRouteForRole, isPendingExpired, TEMPORARY_TEST_MODE } from '@/lib/testMode';

interface ProfileData {
  full_name: string | null;
  role: string | null;
  school_name: string | null;
  district: string | null;
  province: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export default function PendingVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(2);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Fetch profile and check status
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('full_name, role, school_name, district, province, status, rejection_reason, created_at')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          // Fallback for missing columns
          if (fetchError.message.includes("does not exist")) {
            const { data: basicData, error: basicError } = await supabase
              .from('profiles')
              .select('full_name, district, province, created_at')
              .eq('user_id', user.id)
              .single();
            
            if (basicError) throw basicError;
            
            setProfile({
              ...(basicData as any),
              role: null,
              school_name: null,
              status: 'pending_verification',
              rejection_reason: null,
            });
            setShouldRedirect(true);
            return;
          }
          throw fetchError;
        }

        if (data) {
          setProfile(data as unknown as ProfileData);
          
          // If verified, redirect to role-based dashboard
          if ((data as any)?.status === 'verified') {
            const role = (data as any)?.role || 'teacher';
            const dashboardRoute = getDashboardRouteForRole(role);
            navigate(dashboardRoute);
            return;
          }
          
          // If pending, start redirect countdown to /afghanistan-info
          if ((data as any)?.status === 'pending_verification') {
            setShouldRedirect(true);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();

    // Auto-refresh every 10 seconds to check verification status
    const interval = setInterval(fetchProfile, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Countdown and smooth redirect to /afghanistan-info
  useEffect(() => {
    if (!shouldRedirect || !profile || profile.status !== 'pending_verification') return;

    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/afghanistan-info');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [shouldRedirect, profile, navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      // Sign out error handled
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">خطا</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              تلاش دوباره
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleSignOut}>
              بازگشت به ورود
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If rejected
  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">حساب رد شد</CardTitle>
            <CardDescription>متأسفانه درخواست شما تایید نشد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.rejection_reason && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>دلیل رد:</strong><br />{profile.rejection_reason}
                </AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              لطفاً با مسئول منطقه یا ولایت تماس بگیرید.
            </p>
            <Button className="w-full" onClick={handleSignOut}>
              بازگشت به ورود
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if pending has expired (24 hours)
  const isExpired = profile?.created_at ? isPendingExpired(profile.created_at) : false;
  const approverLabel = profile?.role ? getApproverLabel(profile.role) : 'مدیر';

  // Pending verification (default state)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Clock className="h-16 w-16 text-yellow-600 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">حساب شما در حال بررسی است</h1>
          <p className="text-lg text-muted-foreground">
            منتظر تأیید از طرف <strong className="text-foreground">{approverLabel}</strong> باشید.
          </p>
        </div>

        {/* Redirect notice */}
        {shouldRedirect && redirectCountdown > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-center">
              بعد از {redirectCountdown} ثانیه به صفحه معلومات منتقل می‌شوید...
            </AlertDescription>
          </Alert>
        )}

        {/* Expired warning */}
        {isExpired && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>مدت انتظار تأیید (۲۴ ساعت) به پایان رسید.</strong> لطفاً با مسئول تماس بگیرید.
            </AlertDescription>
          </Alert>
        )}

        {/* 🚧 TEMPORARY TEST MODE indicator */}
        {TEMPORARY_TEST_MODE && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              🧪 <strong>حالت آزمایشی:</strong> تأیید توسط مسئول اصلی سیستم انجام خواهد شد.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle>خلاصه اطلاعات ثبت‌شده</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">نام</p>
                <p className="font-semibold">{profile?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مقام</p>
                <p className="font-semibold">{profile?.role || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مکتب</p>
                <p className="font-semibold">{profile?.school_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ولسوالی</p>
                <p className="font-semibold">{profile?.district || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ولایت</p>
                <p className="font-semibold">{profile?.province || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">وضعیت</p>
                <p className="font-semibold text-yellow-600">در انتظار تأیید</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/afghanistan-info')} className="w-full" variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            مشاهده معلومات سیستم
          </Button>
          <Button onClick={handleSignOut} className="w-full" variant="ghost">
            خروج
          </Button>
        </div>
      </div>
    </div>
  );
}
