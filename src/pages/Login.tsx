import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { School, Building2, Loader2, AlertCircle, Zap, CheckCircle2, Eye, EyeOff, ArrowLeft, Lock, Mail, User, Play } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SignupProgress from '@/components/SignupProgress';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const validateEmail = (email: string, t: any): { valid: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, message: t('auth.invalidEmail') };
  }
  return { valid: true };
};

const validatePassword = (password: string, minLength: number = 6, t: any): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: false, message: t('auth.passwordRequired') };
  }
  if (password.length < minLength) {
    return { valid: false, message: t('auth.passwordMin', { minLength }) };
  }
  return { valid: true };
};

const validateFullName = (fullName: string, t: any): { valid: boolean; message?: string } => {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { valid: false, message: t('auth.fullNameRequired') };
  }
  if (trimmed.split(' ').length < 2) {
    return { valid: false, message: t('auth.firstAndLastName') };
  }
  return { valid: true };
};

// ============================================================================
// MAIN LOGIN COMPONENT
// ============================================================================

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInErrors, setSignInErrors] = useState<{ email?: string; password?: string }>({});
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up State
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpErrors, setSignUpErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading and UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('signin');
  const [signupStep, setSignupStep] = useState(0);

  const { signIn, signUp, error: authError, loading: authLoading, setDevQuickMode } = useAuth();
  const { toast } = useToast();

  // Check URL params for initial tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setCurrentTab('signup');
    }
  }, [searchParams]);

  // ============================================================================
  // SIGN IN HANDLER
  // ============================================================================

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = signInEmail.trim();

    const emailValidation = validateEmail(email, t);
    const passwordValidation = validatePassword(signInPassword, 6, t);

    const errors: any = {};
    if (!emailValidation.valid) errors.email = emailValidation.message;
    if (!passwordValidation.valid) errors.password = passwordValidation.message;

    if (Object.keys(errors).length) {
      setSignInErrors(errors);
      return;
    }

    setIsLoading(true);
    setSignInErrors({});

    const { error } = await signIn(email, signInPassword);

    setIsLoading(false);

    if (error) {
      toast({
        title: t('auth.signInFailed'),
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Welcome back 🚀",
      description: "Redirecting...",
    });

    navigate("/"); // clean success flow
  };

// ============================================================================
  // SIGN UP HANDLER
  // ============================================================================

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = signUpEmail.trim();
  
    const errors: any = {};
    const nameValidation = validateFullName(signUpFullName, t);
    const emailValidation = validateEmail(email, t);
    const passwordValidation = validatePassword(signUpPassword, 6, t);

    if (!nameValidation.valid) errors.name = nameValidation.message;
    if (!emailValidation.valid) errors.email = emailValidation.message;
    if (!passwordValidation.valid) errors.password = passwordValidation.message;

    if (signUpPassword !== signUpConfirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length) {
      setSignUpErrors(errors);
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, signUpPassword, signUpFullName);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Account created 🎉",
      description: "Setting up your profile...",
    });

   // 🚀 FIX: NO SIGNIN REDIRECT
    navigate("/setup-profile");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10" dir="rtl">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo/Branding */}
          <div className="text-center space-y-3 animate-fade-in">
            <div className="flex justify-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <School className="h-8 w-8 text-primary" />
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10">
                <Building2 className="h-8 w-8 text-secondary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
              <p className="text-muted-foreground mt-1">{t('app.description')}</p>
            </div>
          </div>

          {/* Main Card */}
          <Card className="border-white/10 shadow-xl animate-slide-up">
            <CardHeader className="space-y-1 border-b border-white/10">
              <CardTitle className="text-2xl">
                {currentTab === 'signin' ? 'خوش آمدید' : t('auth.createAccount')}
              </CardTitle>
              <CardDescription>
                {currentTab === 'signin'
                  ? 'برای دسترسی به صفحه اصلی وارد شوید'
                  : 'حساب جدید بسازید و به سیستم بپیوندید'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Global Error Alert */}
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError.message}</AlertDescription>
                </Alert>
              )}

              {/* Dev Quick Enter - Dev Only */}
              {import.meta.env.MODE === 'development' && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      <h3 className="font-bold text-amber-900 dark:text-amber-100">ورود سریع توسعه‌دهنده</h3>
                    </div>
                    <Button
                      onClick={() => {
                        setDevQuickMode();
                        setTimeout(() => navigate('/setup-profile?quickMode=true'), 100);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-primary-foreground font-semibold"
                    >
                      <Zap className="ml-2 h-4 w-4" />
                      ورود سریع
                    </Button>
                  </div>
                </div>
              )}

              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-1">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-background">
                    {t('auth.signIn')}
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-background">
                    {t('auth.signUp')}
                  </TabsTrigger>
                </TabsList>

                {/* ========== SIGN IN TAB ========== */}
                <TabsContent value="signin" className="space-y-4 animate-fade-in">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {t('auth.email')}
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@school.com"
                        value={signInEmail}
                        onChange={(e) => {
                          setSignInEmail(e.target.value);
                          if (signInErrors.email) setSignInErrors({ ...signInErrors, email: undefined });
                        }}
                        disabled={isLoading || authLoading}
                        className={`${signInErrors.email ? 'border-destructive' : ''} h-10`}
                        dir="ltr"
                      />
                      {signInErrors.email && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {signInErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        {t('auth.password')}
                      </Label>

                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showSignInPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={signInPassword}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSignInPassword(value);
                            setSignInErrors((prev) => ({ ...prev, password: undefined }));
                          }}
                          disabled={isLoading || authLoading}
                          className={`h-10 pl-10 ${
                            signInErrors.password ? 'border-destructive' : ''
                          }`}
                          dir="ltr"
                          autoComplete="current-password"
                        />

                        <button
                          type="button"
                          onClick={() => setShowSignInPassword((prev) => !prev)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                          disabled={isLoading || authLoading}
                        >
                          {showSignInPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {signInErrors.password && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {signInErrors.password}
                        </p>
                      )}
                    </div>
                    {/* Submit */}
                    <Button
                      type="submit"
                      className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 font-semibold"
                      disabled={isLoading || authLoading}
                    >
                      {isLoading || authLoading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          در حال ورود...
                        </>
                      ) : (
                        <>
                          {t('auth.signIn')}
                          <ArrowLeft className="mr-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t('auth.noAccount')}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setCurrentTab('signup')}
                    variant="outline"
                    className="w-full h-10"
                  >
                    {t('auth.createAccount')}
                  </Button>

                  {/* Try Demo */}
                  <Button
                    type="button"
                    onClick={() => navigate('/demo')}
                    variant="secondary"
                    className="w-full h-10 mt-2"
                  >
                    <Play className="ml-2 h-4 w-4" />
                    حالت نمایشی
                  </Button>
                </TabsContent>

                {/* ========== SIGN UP TAB ========== */}
                <TabsContent value="signup" className="space-y-4 animate-fade-in">
                  {signupStep === 0 ? (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {t('auth.fullName')}
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="محمد احمدی"
                          value={signUpFullName}
                          onChange={(e) => {
                            setSignUpFullName(e.target.value);
                            if (signUpErrors.name) setSignUpErrors({ ...signUpErrors, name: undefined });
                          }}
                          disabled={isLoading || authLoading}
                          className={`${signUpErrors.name ? 'border-destructive' : ''} h-10`}
                        />
                        {signUpErrors.name && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {signUpErrors.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{t('auth.firstAndLastName')}</p>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {t('auth.email')}
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@school.com"
                          value={signUpEmail}
                          onChange={(e) => {
                            setSignUpEmail(e.target.value);
                            if (signUpErrors.email) setSignUpErrors({ ...signUpErrors, email: undefined });
                          }}
                          disabled={isLoading || authLoading}
                          className={`${signUpErrors.email ? 'border-destructive' : ''} h-10`}
                          dir="ltr"
                        />
                        {signUpErrors.email && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {signUpErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          {t('auth.password')}
                        </Label>

                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showSignUpPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={signUpPassword}
                            onChange={(e) => {
                              setSignUpPassword(e.target.value);
                              if (signUpErrors.password) {
                                setSignUpErrors({ ...signUpErrors, password: undefined });
                              }
                            }}
                            disabled={isLoading || authLoading}
                            className={`h-10 pl-10 ${signUpErrors.password ? 'border-destructive' : ''}`}
                            dir="ltr"
                          />

                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            disabled={isLoading || authLoading}
                          >
                            {showSignUpPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {signUpErrors.password && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {signUpErrors.password}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          حداقل ۶ حرف
                        </p>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          {t('auth.confirmPassword')}
                        </Label>

                        <div className="relative">
                          <Input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={signUpConfirmPassword}
                            onChange={(e) => {
                              setSignUpConfirmPassword(e.target.value);
                              if (signUpErrors.confirmPassword) {
                                setSignUpErrors({ ...signUpErrors, confirmPassword: undefined });
                              }
                            }}
                            disabled={isLoading || authLoading}
                            className={`h-10 pl-10 ${signUpErrors.confirmPassword ? 'border-destructive' : ''}`}
                            dir="ltr"
                          />

                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                            disabled={isLoading || authLoading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {signUpErrors.confirmPassword && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {signUpErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                      
                      {/* Submit */}
                      <Button
                        type="submit"
                        className="w-full h-10 bg-gradient-to-r from-accent to-accent/80 hover:shadow-lg hover:shadow-accent/30 font-semibold text-accent-foreground"
                        disabled={isLoading || authLoading}
                      >
                        {isLoading || authLoading ? (
                          <>
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            در حال ایجاد حساب...
                          </>
                        ) : (
                          <>
                            {t('auth.createAccount')}
                            <ArrowLeft className="mr-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  ) : signupStep === 1 ? (
                    <div className="py-8 space-y-6">
                      <SignupProgress
                        steps={[
                          { title: 'ایجاد حساب', description: 'بررسی معلومات و ایجاد حساب', status: 'loading' },
                          { title: 'آماده‌سازی پروفایل', description: 'تنظیم صفحه اصلی و دسترسی‌ها', status: 'pending' },
                          { title: 'تکمیل', description: 'انتقال به صفحه اصلی', status: 'pending' }
                        ]}
                        currentStep={1}
                      />
                      <p className="text-center text-sm text-muted-foreground">چند ثانیه صبر کنید...</p>
                    </div>
                  ) : (
                    <div className="py-8 space-y-4 text-center animate-fade-in">
                      <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-accent/20 animate-pulse">
                          <CheckCircle2 className="h-12 w-12 text-accent" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-accent">حساب ایجاد شد!</h3>
                        <p className="text-muted-foreground mt-1">در حال انتقال...</p>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t('auth.haveAccount')}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setCurrentTab('signin')}
                    variant="outline"
                    className="w-full h-10"
                    disabled={signupStep !== 0}
                  >
                    {t('auth.signIn')}
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Terms */}
              <p className="text-center text-xs text-muted-foreground mt-6">
                با ورود، شما با{' '}
                <a href="#" className="hover:text-primary transition">شرایط استفاده</a> و{' '}
                <a href="#" className="hover:text-primary transition">حریم خصوصی</a> موافقت می‌کنید.
              </p>
            </CardContent>
          </Card>

          {/* Footer Stats */}
          <div className="grid grid-cols-3 gap-4 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">20000+</div>
              <div className="text-xs text-muted-foreground">مکتب</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-secondary">34</div>
              <div className="text-xs text-muted-foreground">ولایت</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-accent">11.7M+</div>
              <div className="text-xs text-muted-foreground">شاگرد</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}