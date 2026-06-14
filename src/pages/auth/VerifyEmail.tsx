import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/AuthShell";
import { useCooldown } from "@/hooks/useCooldown";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/sanitizeError";
import { supabase } from "@/integrations/supabase/client";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const cooldown = useCooldown(60);

  // Poll for session — user might click the verification link in another tab.
  useEffect(() => {
    let active = true;
    const id = window.setInterval(async () => {
      if (document.hidden) return;
      const { data } = await supabase.auth.getSession();
      if (active && data.session) {
        navigate("/", { replace: true });
      }
    }, 5000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [navigate]);

  const resend = async () => {
    if (!email || cooldown.isActive) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
      return;
    }
    cooldown.start();
    toast({ title: "ایمیل تأیید دوباره ارسال شد" });
  };

  return (
    <AuthShell title="تأیید ایمیل" description="بررسی ایمیل برای فعال‌سازی حساب">
      <Card className="border-border/60 shadow-elegant backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardHeader className="text-center">
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-2">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">ایمیل خود را بررسی کنید</CardTitle>
          <CardDescription>
            {email ? (
              <>
                ما لینک تأیید را به{" "}
                <strong dir="ltr" className="text-foreground">{email}</strong> فرستادیم.
              </>
            ) : (
              "ما لینک تأیید را به ایمیل شما فرستادیم."
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 text-[11px] text-muted-foreground space-y-1">
            <p>• ایمیل ممکن است در پوشه Spam باشد</p>
            <p>• لینک تأیید تا ۲۴ ساعت معتبر است</p>
            <p>• پس از تأیید، به‌صورت خودکار وارد می‌شوید</p>
          </div>

          {email && (
            <Button
              variant="outline"
              onClick={resend}
              disabled={cooldown.isActive}
              className="w-full h-11"
            >
              {cooldown.isActive ? `ارسال مجدد در ${cooldown.remaining}s` : "ارسال مجدد لینک"}
            </Button>
          )}

          <Button asChild variant="ghost" className="w-full h-10 text-sm">
            <Link to="/login">
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
              بازگشت به ورود
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
