import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { useCooldown } from "@/hooks/useCooldown";
import { supabase } from "@/integrations/supabase/client";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const cooldown = useCooldown(60);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown.isActive) return;
    const em = email.trim();
    if (!em || !emailRe.test(em)) {
      setError("لطفاً یک ایمیل معتبر وارد کنید");
      return;
    }
    setError(null);
    setLoading(true);
    // Always show the neutral success screen to avoid email enumeration.
    await supabase.auth.resetPasswordForEmail(em, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
    cooldown.start();
  };

  return (
    <AuthShell title="بازنشانی رمز عبور" description="درخواست لینک بازنشانی رمز عبور">
      <Card className="border-border/60 shadow-elegant backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl">رمز عبور را فراموش کرده‌اید؟</CardTitle>
          <CardDescription>
            ایمیل خود را وارد کنید تا لینک بازنشانی برایتان ارسال شود.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {sent ? (
            <div className="py-2 space-y-4 text-center">
              <div className="p-4 rounded-full bg-success/10 w-fit mx-auto">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                اگر این ایمیل در سیستم ثبت باشد، یک لینک بازنشانی به{" "}
                <strong dir="ltr" className="text-foreground">{email}</strong> ارسال شد.
              </p>
              <Button
                variant="outline"
                onClick={() => setSent(false)}
                disabled={cooldown.isActive}
                className="w-full h-11"
              >
                {cooldown.isActive
                  ? `ارسال مجدد در ${cooldown.remaining}s`
                  : "ارسال مجدد لینک"}
              </Button>
              <Button asChild variant="ghost" className="w-full h-10 text-sm">
                <Link to="/login">
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  بازگشت به ورود
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="fp-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  ایمیل
                </Label>
                <Input
                  id="fp-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  placeholder="you@school.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`h-11 ${error ? "border-destructive" : ""}`}
                />
                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold shadow-glow">
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ارسال…
                  </>
                ) : (
                  "ارسال لینک بازنشانی"
                )}
              </Button>

              <Button asChild variant="ghost" className="w-full h-10 text-sm">
                <Link to="/login">
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  بازگشت به ورود
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
