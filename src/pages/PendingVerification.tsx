import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useVerification } from "@/hooks/useVerification";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function PendingVerification() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const verification = useVerification();

  // Poll profile status every 5s by re-fetching
  useEffect(() => {
    if (!user || !verification.isPending) return;

    const channel = supabase
      .channel('pending-verification')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, verification.isPending]);

  // Auto redirect if verified
  useEffect(() => {
    if (verification.isVerified && verification.canAccessDashboard) {
      navigate("/school/dashboard", { replace: true });
    }
  }, [verification.isVerified, verification.canAccessDashboard, navigate]);

  // Redirect if needs setup
  useEffect(() => {
    if (!loading && verification.needsSetup) {
      navigate("/setup-profile", { replace: true });
    }
  }, [loading, verification.needsSetup, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">در حال بررسی حساب...</p>
      </div>
    );
  }

  // Rejected
  if (verification.isRejected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4 max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-destructive font-bold text-lg">حساب رد شده</h2>
          {verification.rejectionReason && (
            <p className="text-sm text-muted-foreground">{verification.rejectionReason}</p>
          )}
          <p className="text-sm text-muted-foreground">لطفاً با پشتیبانی تماس بگیرید</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm"
          >
            بازگشت به ورود
          </button>
        </div>
      </div>
    );
  }

  // Pending (default)
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5 max-w-sm w-full">
        <Clock className="w-12 h-12 text-primary animate-pulse mx-auto" />
        <h1 className="text-xl font-bold text-foreground">در حال بررسی</h1>
        <p className="text-muted-foreground text-sm">
          حساب شما هنوز تایید نشده است. این صفحه به صورت خودکار بروزرسانی می‌شود.
        </p>
        <div className="text-xs text-muted-foreground/60">
          بروزرسانی خودکار فعال است
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          بررسی مجدد
        </button>
      </div>
    </div>
  );
}
