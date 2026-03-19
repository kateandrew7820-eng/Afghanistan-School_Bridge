import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { School, Building2, Loader2, AlertCircle } from 'lucide-react';

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

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInErrors, setSignInErrors] = useState<{ email?: string; password?: string }>({});

  // Sign Up State
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpErrors, setSignUpErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  // Loading and UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('signin');

  const { signIn, signUp, error: authError, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // ============================================================================
  // SIGN IN HANDLER
  // ============================================================================

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const errors: typeof signInErrors = {};
    const emailValidation = validateEmail(signInEmail, t);
    const passwordValidation = validatePassword(signInPassword, 6, t);

    if (!emailValidation.valid) errors.email = emailValidation.message;
    if (!passwordValidation.valid) errors.password = passwordValidation.message;

    if (Object.keys(errors).length > 0) {
      setSignInErrors(errors);
      return;
    }

    setIsLoading(true);
    setSignInErrors({});

    const { error } = await signIn(signInEmail, signInPassword);
    
    if (error) {
      toast({
        title: t('auth.signInFailed'),
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: t('common.success'),
      description: t('auth.loadingAuth')
    });

    setIsLoading(false);
    // Auth context will handle navigation based on role
  };

  // ============================================================================
  // SIGN UP HANDLER
  // ============================================================================

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all inputs
    const errors: typeof signUpErrors = {};
    const nameValidation = validateFullName(signUpFullName, t);
    const emailValidation = validateEmail(signUpEmail, t);
    const passwordValidation = validatePassword(signUpPassword, 6, t);

    if (!nameValidation.valid) errors.name = nameValidation.message;
    if (!emailValidation.valid) errors.email = emailValidation.message;
    if (!passwordValidation.valid) errors.password = passwordValidation.message;

    // Check password match
    if (signUpPassword !== signUpConfirmPassword) {
      errors.confirmPassword = t('auth.passwordNotMatch');
    }

    if (Object.keys(errors).length > 0) {
      setSignUpErrors(errors);
      return;
    }

    setIsLoading(true);
    setSignUpErrors({});

    const { error } = await signUp(signUpEmail, signUpPassword, signUpFullName);
    
    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // FIX: Success! Auth context will automatically update and redirect to dashboard
    // Because signUp() now includes auto-login, the auth state listener will:
    // 1. Receive the new session (onAuthStateChange)
    // 2. Load user data and role (automatically via useAuth hook)
    // 3. App.tsx will detect user && roleTier and redirect to correct dashboard
    
    toast({
      title: t('common.success'),
      description: 'Creating your account and signing you in...',
    });

    // FIX: Add safety timeout to prevent infinite loading
    // If auth state doesn't update within 5 seconds, something went wrong
    // Reset loading state so user can see error or try again
    const timeoutId = setTimeout(() => {
      console.error('Signup: Auth state did not update within 5 seconds - possible network or backend issue');
      setIsLoading(false);
      toast({
        title: t('common.error'),
        description: 'Account created but automatic login took too long. Please try signing in manually.',
        variant: "destructive"
      });
    }, 5000);

    // Return cleanup function to clear timeout if component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-2">
            <School className="h-10 w-10 text-primary" />
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">{t('app.title')}</h1>
          <p className="text-muted-foreground">{t('app.description')}</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{t('app.title')}</CardTitle>
            <CardDescription>
              {t('auth.noAccount')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Global Error Alert */}
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError.message}</AlertDescription>
              </Alert>
            )}

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
              </TabsList>

              {/* ========== SIGN IN TAB ========== */}
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('auth.email')}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@school.com"
                      value={signInEmail}
                      onChange={(e) => {
                        setSignInEmail(e.target.value);
                        if (signInErrors.email) {
                          setSignInErrors({ ...signInErrors, email: undefined });
                        }
                      }}
                      disabled={isLoading || authLoading}
                      className={signInErrors.email ? 'border-red-500' : ''}
                    />
                    {signInErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{signInErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => {
                        setSignInPassword(e.target.value);
                        if (signInErrors.password) {
                          setSignInErrors({ ...signInErrors, password: undefined });
                        }
                      }}
                      disabled={isLoading || authLoading}
                      className={signInErrors.password ? 'border-red-500' : ''}
                    />
                    {signInErrors.password && (
                      <p className="text-sm text-red-500 mt-1">{signInErrors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || authLoading}
                  >
                    {isLoading || authLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('auth.signIn')
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* ========== SIGN UP TAB ========== */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="محمد احمد"
                      value={signUpFullName}
                      onChange={(e) => {
                        setSignUpFullName(e.target.value);
                        if (signUpErrors.name) {
                          setSignUpErrors({ ...signUpErrors, name: undefined });
                        }
                      }}
                      disabled={isLoading || authLoading}
                      className={signUpErrors.name ? 'border-red-500' : ''}
                    />
                    {signUpErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{signUpErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.email')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@school.com"
                      value={signUpEmail}
                      onChange={(e) => {
                        setSignUpEmail(e.target.value);
                        if (signUpErrors.email) {
                          setSignUpErrors({ ...signUpErrors, email: undefined });
                        }
                      }}
                      disabled={isLoading || authLoading}
                      className={signUpErrors.email ? 'border-red-500' : ''}
                    />
                    {signUpErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{signUpErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        if (signUpErrors.password) {
                          setSignUpErrors({ ...signUpErrors, password: undefined });
                        }
                      }}
                      disabled={isLoading || authLoading}
                      className={signUpErrors.password ? 'border-red-500' : ''}
                    />
                    {signUpErrors.password && (
                      <p className="text-sm text-red-500 mt-1">{signUpErrors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{t('auth.passwordMin', { minLength: 6 })}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">{t('auth.confirmPassword')}</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpConfirmPassword}
                      onChange={(e) => {
                        setSignUpConfirmPassword(e.target.value);
                        if (signUpErrors.confirmPassword) {
                          setSignUpErrors({ ...signUpErrors, confirmPassword: undefined });
                        }
                      }}
                      disabled={isLoading || authLoading}
                      className={signUpErrors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {signUpErrors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{signUpErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || authLoading}
                  >
                    {isLoading || authLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('auth.signUp')
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-muted-foreground mt-4">
              {t('common.success')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
