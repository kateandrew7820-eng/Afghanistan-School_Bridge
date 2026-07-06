import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, RefreshCw, LogOut, ArrowRight, MailCheck } from "lucide-react";
import { useVerification } from "@/hooks/useVerification";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { getApproverRoute, DASHBOARD_ROUTE_BY_ROLE } from "@/lib/approverRouting";

export default function PendingVerification() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const verification = useVerification();
  const requestedRef = useRef(false);
  const [approverLabel, setApproverLabel] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  // Send the approval-request email the moment the user lands here
  useEffect(() => {
    if (!user || !profile?.role || requestedRef.current) return;
    if (profile.status && profile.status !== 'pending_verification' && profile.status !== 'pending') return;

    const sentKey = `approvalRequestSent:${user.id}`;
    // Set the approver label immediately from the local routing table
    const route = getApproverRoute(profile.role);
    setApproverLabel(route.label);

    if (sessionStorage.getItem(sentKey)) {
      setEmailSent(true);
      return;
    }
    requestedRef.current = true;

    supabase.functions
      .invoke('request-approval', { body: {} })
      .then(({ data, error }) => {
        if (error) {
          console.warn('request-approval error:', error);
          setEmailSent(false);
          return;
        }
        sessionStorage.setItem(sentKey, '1');
        setEmailSent(Boolean(data?.email_sent));
        if (data?.approver_label) setApproverLabel(data.approver_label);
      });
  }, [user, profile?.role, profile?.status]);

  // Realtime listener for profile status changes
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
      const target = profile?.role ? DASHBOARD_ROUTE_BY_ROLE[profile.role] ?? '/school' : '/school';
      navigate(target, { replace: true });
    }
  }, [verification.isVerified, verification.canAccessDashboard, profile?.role, navigate]);

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-background relative" dir="rtl">
        <div className="absolute top-4 right-4">
          <NotificationBell align="end" />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4 max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-destructive font-bold text-lg">حساب رد شده</h2>
          {verification.rejectionReason && (
            <p className="text-sm text-muted-foreground">{verification.rejectionReason}</p>
          )}
          <p className="text-sm text-muted-foreground">لطفاً با پشتیبانی تماس بگیرید</p>
          <div className="flex flex-col gap-2">
            <Button variant="destructive" onClick={() => navigate("/login")}>
              بازگشت به ورود
            </Button>
            <Button variant="outline" onClick={async () => { await signOut(); navigate("/login"); }}>
              <LogOut className="w-4 h-4 ml-2" />
              خروج از حساب
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pending (default)
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative" dir="rtl">
      <div className="absolute top-4 right-4">
        <NotificationBell align="end" />
      </div>
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5 max-w-sm w-full">
        <Clock className="w-12 h-12 text-primary animate-pulse mx-auto" />
        <h1 className="text-xl font-bold text-foreground">در انتظار تأیید</h1>
        <p className="text-muted-foreground text-sm">
          حساب شما هنوز تایید نشده است. پس از تأیید توسط مدیر، به صورت خودکار منتقل می‌شوید.
        </p>

        {approverLabel && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-right space-y-1">
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <MailCheck className="w-4 h-4" />
              درخواست تأیید ارسال شد
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              درخواست شما برای <strong>{approverLabel}</strong> فرستاده شد.
              {emailSent === false && ' (در حال آماده‌سازی سیستم ایمیل)'}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground/60">
          بروزرسانی خودکار فعال است
        </div>

        {/* Action buttons - user is NOT locked out */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            بررسی مجدد
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به صفحه اصلی
          </Button>
          <Button
            variant="ghost"
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="w-full text-muted-foreground"
          >
            <LogOut className="w-4 h-4 ml-2" />
            خروج از حساب
          </Button>
        </div>
      </div>
    </div>
  );
}
