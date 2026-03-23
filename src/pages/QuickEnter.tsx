import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Loader2, Zap, AlertTriangle } from "lucide-react";

/**
 * ⚡ QuickEnter – Development Access Gateway
 * Fast entry for developers & testers.
 * Skips manual login and redirects authenticated users
 * directly to the quick profile setup flow.
 */

export default function QuickEnter() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/setup-profile?quickMode=true", { replace: true });
    }
  }, [user, loading, navigate]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
              ورود سریع
            </CardTitle>

            <CardDescription>
              آماده‌سازی محیط توسعه...
            </CardDescription>
          </CardHeader>

          <CardContent className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unexpected state (no user)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg border-red-200">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="flex items-center justify-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            خطای سیستم
          </CardTitle>

          <CardDescription>
            ورود سریع با مشکل مواجه شد.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            لطفاً صفحه را دوباره بارگذاری کنید یا از صفحه ورود استفاده نمایید.
          </p>

          <div className="flex gap-3">
            <Button
              className="w-full"
              onClick={() => window.location.reload()}
            >
              بارگذاری دوباره
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              ورود عادی
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
