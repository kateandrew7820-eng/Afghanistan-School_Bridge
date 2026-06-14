import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/sanitizeError";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/auth/PasswordStrengthMeter";
import { useCooldown } from "@/hooks/useCooldown";
import { supabase } from "@/integrations/supabase/client";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 0 | 1 | 2;

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const guard = useRef(false);

  const [step, setStep] = useState<Step>(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);

  const resend = useCooldown(60);

  const validateStep0 = () => {
    const e: typeof errors = {};
    const name = fullName.trim();
    if (!name) e.name = "نام مکمل لازم است";
    else if (name.split(/\s+/).length < 2) e.name = "نام و تخلص خود را وارد کنید";
    const em = email.trim();
    if (!em || !emailRe.test(em)) e.email = "لطفاً یک ایمیل معتبر وارد کنید";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (password.length < 6) e.password = "رمز عبور حداقل ۶ حرف باشد";
    else if (getPasswordStrength(password).score < 2) e.password = "رمز عبور بسیار ضعیف است";
    if (password !== confirm) e.confirm = "رمز عبور مطابقت ندارد";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (validateStep0()) setStep(1);
  };

  const submit = useCallback(async () => {
    if (guard.current) return;
    if (!validateStep1()) return;
    guard.current = true;
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    guard.current = false;
    if (error) {
      const msg = sanitizeError(error);
      if (/ثبت شده/.test(msg)) {
        setStep(0);
        setErrors({ email: msg });
        return;
      }
      toast({ title: "ثبت‌نام ناموفق", description: msg, variant: "destructive" });
      return;
    }
    resend.start();
    setStep(2);
  }, [email, password, fullName, signUp, toast, resend]);

  const onResend = async () => {
    if (resend.isActive) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
      return;
    }
    resend.start();
    toast({ title: "ایمیل تأیید دوباره ارسال شد" });
  };

  return (
    <AuthShell title="ایجاد حساب" description="ساخت حساب جدید در پورتال مکاتب" showStats={step === 0}>
      <Card className="border-border/60 shadow-elegant backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardHeader className="space-y-3">
          <Steps current={step} />
          <CardTitle className="text-2xl">
            {step === 0 ? "حساب جدید" : step === 1 ? "ایمنی حساب" : "ایمیل خود را بررسی کنید"}
          </CardTitle>
          <CardDescription>
            {step === 0
              ? "نام و ایمیل خود را وارد کنید"
              : step === 1
              ? "یک رمز عبور قوی انتخاب کنید"
              : "لینک تأیید به ایمیل شما ارسال شد"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                goNext();
              }}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="su-name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  نام مکمل
                </Label>
                <Input
                  id="su-name"
                  placeholder="محمد احمدی"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  className={`h-11 ${errors.name ? "border-destructive" : ""}`}
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="su-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  ایمیل
                </Label>
                <Input
                  id="su-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  placeholder="you@school.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={`h-11 ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 font-semibold shadow-glow">
                ادامه
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>

              <Button asChild type="button" variant="ghost" className="w-full h-10 text-sm">
                <Link to="/login">
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  بازگشت به ورود
                </Link>
              </Button>
            </form>
          )}

          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="space-y-4"
              noValidate
            >
              <PasswordField
                id="su-pass"
                label="رمز عبور"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                error={errors.password}
                hint="حداقل ۶ حرف، بهتر است شامل حروف بزرگ، اعداد و علامت باشد"
                showCapsLockWarning
                disabled={loading}
              />

              <PasswordStrengthMeter password={password} />

              <PasswordField
                id="su-pass2"
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
                    در حال ایجاد حساب…
                  </>
                ) : (
                  "ایجاد حساب"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full h-10 text-sm"
                onClick={() => setStep(0)}
                disabled={loading}
              >
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
                مرحله قبل
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="py-4 space-y-5 text-center">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  یک لینک تأیید به{" "}
                  <strong dir="ltr" className="text-foreground">{email}</strong> ارسال شد.
                  لطفاً روی لینک کلیک کنید تا حساب شما فعال شود.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-[11px] text-muted-foreground space-y-1 text-right">
                <p>• ایمیل ممکن است در پوشه Spam باشد</p>
                <p>• لینک تأیید تا ۲۴ ساعت معتبر است</p>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={onResend}
                  disabled={resend.isActive}
                  className="h-11"
                >
                  {resend.isActive ? `ارسال مجدد در ${resend.remaining}s` : "ارسال مجدد لینک"}
                </Button>
                <Button asChild variant="ghost" className="h-10 text-sm">
                  <Link to="/login">بازگشت به ورود</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

function Steps({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label="پیشرفت ثبت‌نام">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current ? "w-8 bg-primary" : i < current ? "w-6 bg-primary/60" : "w-6 bg-muted"
          }`}
        />
      ))}
    </div>
  );
}
