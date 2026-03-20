import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface ProfileData {
  full_name: string | null;
  role: string | null;
  school_name: string | null;
  district: string | null;
  province: string | null;
  status: string;
  rejection_reason: string | null;
}

export default function PendingVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  if (!user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('full_name, role, school_name, district, province, status, rejection_reason')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          // If columns don't exist yet (migration not deployed), fall back to basic query
          if (fetchError.message.includes("column '*' does not exist")) {
            const { data: basicData, error: basicError } = await supabase
              .from('profiles')
              .select('full_name, district, province')
              .eq('user_id', user.id)
              .single();
            
            if (basicError) throw basicError;
            
            // Set with defaults for fields not yet in database
            setProfile({
              ...(basicData as unknown as Partial<ProfileData>),
              role: null,
              school_name: null,
              status: 'pending_verification',
              rejection_reason: null,
            } as ProfileData);
            return;
          }
          throw fetchError;
        }

        if (data) {
          setProfile(data as unknown as ProfileData);
          
          // If verified, redirect to dashboard
          if ((data as any)?.status === 'verified') {
            navigate('/school');
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

    // Optional: Auto-refresh every 10 seconds to check verification status
    const interval = setInterval(fetchProfile, 10000);
    return () => clearInterval(interval);
  }, [user.id, refreshCount]);

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

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
            <Button variant="outline" className="w-full" onClick={handleRefresh}>
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
                  <strong>دلیل رد:</strong>
                  <br />
                  {profile.rejection_reason}
                </AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              لطفاً با مسئول منطقه یا ولایت تماس بگیرید.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                handleSignOut();
              }}
            >
              بازگشت به ورود
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending verification (default state)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Clock className="h-16 w-16 text-yellow-600 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">حساب شما در حال بررسی است</h1>
          <p className="text-lg text-muted-foreground">
            اطلاعات شما توسط اختیار رسانی در حال بررسی است.
          </p>
        </div>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle>خلاصه اطلاعات ثبت‌شده</CardTitle>
            <CardDescription>
              این اطلاعات برای تایید ارسال شد
            </CardDescription>
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
                <p className="text-sm text-muted-foreground">منطقه</p>
                <p className="font-semibold">{profile?.district || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ولایت</p>
                <p className="font-semibold">{profile?.province || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">وضعیت</p>
                <p className="font-semibold text-yellow-600">در انتظار تایید</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 space-y-2">
            <p>
              <strong>این چه معنی دارد؟</strong>
            </p>
            <p>
              حساب شما به‌طور موفق ایجاد شده است، اما قبل از اینکه بتوانید ورود به سیستم، نیاز است که توسط مسئول منطقه یا ولایت تایید شود.
            </p>
            <p>
              معمولاً این فرآیند <strong>1-2 روز</strong> طول می‌کشد.
            </p>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleRefresh}
            className="w-full"
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            بررسی وضعیت
          </Button>
          <Button
            onClick={handleSignOut}
            className="w-full"
            variant="ghost"
          >
            خروج
          </Button>
        </div>

        {/* Footer Info */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            پس از تایید، می‌توانید از تمام ویژگی‌های سیستم استفاده کنید.
          </p>
          <p className="text-xs text-muted-foreground">
            اگر سؤالی دارید، لطفاً با پشتیبانی تماس بگیرید.
          </p>
        </div>
      </div>
    </div>
  );
}
