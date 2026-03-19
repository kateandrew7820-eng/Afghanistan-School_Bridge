import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

/**
 * DEVELOPMENT ONLY: Quick Entry Page
 * Bypasses sign up and logs in a test user directly
 * User is then redirected to SetupProfile in quick mode
 */
export default function QuickEnter() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // If user is already logged in, go to quick setup
    if (user && !loading) {
      navigate('/setup-profile?quickMode=true');
    }
  }, [user, loading, navigate]);

  // Still initializing
  if (loading || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              ورود سریع
            </CardTitle>
            <CardDescription>
              درحال اعدادرسانی...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // No user - shouldn't happen in normal flow
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>خطا</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            خرابی در ورود سریع. لطفاً صفحه را دوباره بارگذاری کنید.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            بارگذاری دوباره
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
