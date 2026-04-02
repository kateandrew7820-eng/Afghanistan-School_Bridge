import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase client auto-detects the hash/query params and exchanges the token
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setErrorMsg(error.message);
          setStatus("error");
          return;
        }

        if (data.session) {
          // Session established — redirect to dashboard
          setStatus("success");
          setTimeout(() => navigate("/", { replace: true }), 1000);
          return;
        }

        // No session yet — try exchanging code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setErrorMsg(sessionError.message);
            setStatus("error");
            return;
          }

          setStatus("success");
          setTimeout(() => navigate("/", { replace: true }), 1000);
          return;
        }

        // Fallback: wait for onAuthStateChange to pick up the session
        const timeout = setTimeout(() => {
          setErrorMsg("لینک تأیید منقضی شده یا نامعتبر است.");
          setStatus("error");
        }, 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            clearTimeout(timeout);
            setStatus("success");
            setTimeout(() => navigate("/", { replace: true }), 1000);
            subscription.unsubscribe();
          }
        });

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      } catch {
        setErrorMsg("خطا در تأیید ایمیل. لطفاً دوباره تلاش کنید.");
        setStatus("error");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5 max-w-sm w-full">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-foreground">در حال تأیید ایمیل...</h1>
            <p className="text-muted-foreground text-sm">لطفاً صبر کنید</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">ایمیل تأیید شد! ✅</h1>
            <p className="text-muted-foreground text-sm">در حال انتقال به سیستم...</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">خطا در تأیید</h1>
            <p className="text-muted-foreground text-sm">{errorMsg}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => navigate("/login")}>بازگشت به ورود</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>تلاش مجدد</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}