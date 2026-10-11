import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/AuthShell";

type Status = "loading" | "success" | "error";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDelayed, setIsDelayed] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout>;
    let unsubscribe: (() => void) | undefined;
    let isCurrent = true;

    const timeout = setTimeout(() => {
      fail("لینک تأیید منقضی شده یا نامعتبر است. لطفاً دوباره ثبت‌نام کنید.");
    }, 25000);
    const delayedTimeout = setTimeout(() => {
      if (isCurrent) setIsDelayed(true);
    }, 6000);

    const clearPendingTimeouts = () => {
      clearTimeout(timeout);
      clearTimeout(delayedTimeout);
    };

    const fail = (message: string) => {
      clearPendingTimeouts();
      if (!isCurrent) return;
      setErrorMsg(message);
      setStatus("error");
    };

    const succeed = () => {
      if (!isCurrent) return;
      clearPendingTimeouts();
      setStatus("success");
      redirectTimeout = setTimeout(() => navigate("/", { replace: true }), 800);
      unsubscribe?.();
    };

    setIsDelayed(false);

    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isCurrent) return;

        if (error) {
          fail(mapError(error.message));
          return;
        }

        if (data.session) {
          succeed();
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!isCurrent) return;
          if (sessionError) {
            fail(mapError(sessionError.message));
            return;
          }
          succeed();
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!isCurrent) return;
          if (exchangeError) {
            fail(mapError(exchangeError.message));
            return;
          }
          succeed();
          return;
        }

        const errorParam = hashParams.get("error_description") || urlParams.get("error_description");
        if (errorParam) {
          fail(mapError(errorParam));
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) succeed();
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (err) {
        fail("خطا در تأیید ایمیل. لطفاً دوباره تلاش کنید.");
      }
    };

    handleCallback();

    return () => {
      isCurrent = false;
      clearPendingTimeouts();
      clearTimeout(redirectTimeout);
      unsubscribe?.();
    };
  }, [navigate, retryAttempt]);

  return (
    <AuthShell title="تأیید ایمیل" description="در حال تأیید حساب کاربری شما">
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-5 shadow-lg">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <h1 className="text-xl font-heading font-bold text-foreground">در حال تأیید ایمیل...</h1>
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {isDelayed
                ? 'در حال برقراری ارتباط با سرور و بررسی پیوند تأیید… در صورت کندی اینترنت لطفاً کمی صبر نمایید.'
                : 'لطفاً چند لحظه صبر کنید'}
            </p>
            <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 bg-primary animate-[shimmer_1.2s_ease-in-out_infinite]" />
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
            <h1 className="text-xl font-heading font-bold text-foreground">ایمیل تأیید شد</h1>
            <p className="text-muted-foreground text-sm">در حال انتقال به داشبورد...</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-heading font-bold text-foreground">خطا در تأیید</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{errorMsg}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => { setErrorMsg(""); setStatus("loading"); setRetryAttempt((attempt) => attempt + 1); }} className="w-full">
                <RotateCcw className="ml-2 h-4 w-4" />
                تلاش مجدد
              </Button>
              <Button variant="outline" onClick={() => navigate("/login", { replace: true })} className="w-full">
                ورود به سیستم
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}

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
