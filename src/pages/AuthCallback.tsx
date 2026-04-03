import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "error";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let unsubscribe: (() => void) | undefined;

    const handleCallback = async () => {
      try {
        // 1. Check if session already exists (e.g. from auto-detection of hash params)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthCallback] getSession error:", error.message);
          setErrorMsg(mapError(error.message));
          setStatus("error");
          return;
        }

        if (data.session) {
          console.log("[AuthCallback] Session found, redirecting...");
          setStatus("success");
          setTimeout(() => navigate("/", { replace: true }), 800);
          return;
        }

        // 2. Try extracting tokens from URL hash (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("[AuthCallback] setSession error:", sessionError.message);
            setErrorMsg(mapError(sessionError.message));
            setStatus("error");
            return;
          }

          setStatus("success");
          setTimeout(() => navigate("/", { replace: true }), 800);
          return;
        }

        // 3. Check for PKCE code in query params
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("[AuthCallback] code exchange error:", exchangeError.message);
            setErrorMsg(mapError(exchangeError.message));
            setStatus("error");
            return;
          }

          setStatus("success");
          setTimeout(() => navigate("/", { replace: true }), 800);
          return;
        }

        // 4. Check for error in URL (e.g. expired link)
        const errorParam = hashParams.get("error_description") || urlParams.get("error_description");
        if (errorParam) {
          setErrorMsg(mapError(errorParam));
          setStatus("error");
          return;
        }

        // 5. Fallback: wait briefly for onAuthStateChange
        timeout = setTimeout(() => {
          setErrorMsg("لینک تأیید منقضی شده یا نامعتبر است. لطفاً دوباره ثبت‌نام کنید.");
          setStatus("error");
        }, 6000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            clearTimeout(timeout);
            setStatus("success");
            setTimeout(() => navigate("/", { replace: true }), 800);
            subscription.unsubscribe();
          }
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (err) {
        console.error("[AuthCallback] unexpected error:", err);
        setErrorMsg("خطا در تأیید ایمیل. لطفاً دوباره تلاش کنید.");
        setStatus("error");
      }
    };

    handleCallback();

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5 max-w-sm w-full shadow-lg">
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
            <p className="text-muted-foreground text-sm leading-relaxed">{errorMsg}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => navigate("/login")} className="w-full">
                بازگشت به ورود
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                <RotateCcw className="ml-2 h-4 w-4" />
                تلاش مجدد
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Map common Supabase error strings to user-friendly Persian messages */
function mapError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("expired") || lower.includes("invalid")) {
    return "لینک تأیید منقضی شده یا نامعتبر است. لطفاً دوباره ثبت‌نام کنید.";
  }
  if (lower.includes("already") || lower.includes("confirmed")) {
    return "این ایمیل قبلاً تأیید شده است. لطفاً وارد شوید.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "مشکل در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.";
  }
  return msg;
}
