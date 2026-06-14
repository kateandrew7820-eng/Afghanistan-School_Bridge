import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, Mail, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/sanitizeError";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user, roleTier, setDevQuickMode } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const submitGuard = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && roleTier) {
      navigate(`/${roleTier === "school" ? "school" : roleTier}`, { replace: true });
    }
  }, [user, roleTier, navigate]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitGuard.current) return;

      const next: typeof errors = {};
      const em = email.trim();
      if (!em || !emailRe.test(em)) next.email = "لطفاً یک ایمیل معتبر وارد کنید";
      if (!password) next.password = "رمز عبور لازم است";
      else if (password.length < 6) next.password = "رمز عبور حداقل ۶ حرف باشد";
      if (Object.keys(next).length) {
        setErrors(next);
        if (next.email) emailRef.current?.focus();
        return;
      }

      submitGuard.current = true;
      setLoading(true);
      setErrors({});

      const { error } = await signIn(em, password);

      setLoading(false);
      submitGuard.current = false;

      if (error) {
        const msg = sanitizeError(error);
        if (/تأیید/.test(msg) || /confirm/i.test(error.message)) {
          navigate(`/verify-email?email=${encodeURIComponent(em)}`);
          return;
        }
        setErrors({ form: msg });
        return;
      }

      toast({ title: "خوش آمدید 🎉", description: "در حال انتقال به داشبورد…" });
      navigate("/", { replace: true });
    },
    [email, password, signIn, navigate, toast]
  );

  return (
    <AuthShell
      title="ورود"
      description="ورود به پورتال داده‌های مکاتب افغانستان"
      showStats
    >
      <Card className="border-border/60 shadow-elegant backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">خوش آمدید</CardTitle>
          <CardDescription>برای دسترسی به داشبورد وارد شوید</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errors.form && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                ایمیل
              </Label>
              <Input
                ref={emailRef}
                id="signin-email"
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
                disabled={loading}
                className={`h-11 ${errors.email ? "border-destructive" : ""}`}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <PasswordField
              id="signin-password"
              label="رمز عبور"
              placeholder="••••••••"
              autoComplete="current-password"
              showCapsLockWarning
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              disabled={loading}
              error={errors.password}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition"
              >
                رمز عبور را فراموش کرده‌اید؟
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال ورود…
                </>
              ) : (
                <>
                  ورود
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">حساب ندارید؟</span>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full h-11">
            <Link to="/signup">ایجاد حساب جدید</Link>
          </Button>

          {import.meta.env.DEV && (
            <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setDevQuickMode();
                  setTimeout(() => navigate("/setup-profile?quickMode=true"), 100);
                }}
                className="hover:text-warning transition"
              >
                ⚡ ورود سریع توسعه‌دهنده
              </button>
              <button
                type="button"
                onClick={() => navigate("/demo")}
                className="hover:text-primary transition inline-flex items-center gap-1"
              >
                <Play className="h-3 w-3" />
                حالت نمایشی
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-muted-foreground">
        با ورود، شما با{" "}
        <a href="#" className="hover:text-primary transition">شرایط استفاده</a>
        {" "}و{" "}
        <a href="#" className="hover:text-primary transition">حریم خصوصی</a>
        {" "}موافقت می‌کنید.
      </p>
    </AuthShell>
  );
}
