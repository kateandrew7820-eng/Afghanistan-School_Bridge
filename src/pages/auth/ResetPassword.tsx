import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/auth/PasswordStrengthMeter";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/sanitizeError";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tokenOk, setTokenOk] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase populates the session from the hash automatically on link click.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setTokenOk(!!data.session);
    };
    check();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < 6) next.password = "رمز عبور حداقل ۶ حرف باشد";
    else if (getPasswordStrength(password).score < 2) next.password = "رمز عبور بسیار ضعیف است";
    if (password !== confirm) next.confirm = "رمز عبور مطابقت ندارد";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
      return;
    }
    toast({ title: "رمز عبور با موفقیت تغییر کرد" });
    navigate("/login", { replace: true });
  };

  return (
    <AuthShell title="بازنشانی رمز عبور" description="تنظیم رمز عبور جدید">
      <Card className="border-border/60 shadow-elegant backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl">رمز عبور جدید</CardTitle>
          <CardDescription>یک رمز عبور جدید و قوی تنظیم کنید.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {tokenOk === null && (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {tokenOk === false && (
            <div className="space-y-4 text-center py-2">
              <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">
                این لینک نامعتبر یا منقضی شده است.
              </p>
              <Button asChild className="w-full h-11">
                <Link to="/forgot-password">درخواست لینک جدید</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full h-10 text-sm">
                <Link to="/login">
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  بازگشت به ورود
                </Link>
              </Button>
            </div>
          )}

          {tokenOk === true && (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <PasswordField
                id="rp-pass"
                label="رمز عبور جدید"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                error={errors.password}
                disabled={loading}
                showCapsLockWarning
              />
              <PasswordStrengthMeter password={password} />
              <PasswordField
                id="rp-pass2"
                label="تأیید رمز عبور"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
                }}
                error={errors.confirm}
                disabled={loading}
              />
              {confirm && !errors.confirm && password === confirm && (
                <p className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  رمز عبور مطابقت دارد
                </p>
              )}
              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold shadow-glow">
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ذخیره…
                  </>
                ) : (
                  "ذخیره رمز عبور"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
