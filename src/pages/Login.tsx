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
import { School, Building2, Loader2, AlertCircle, Zap, CheckCircle2, Eye, EyeOff, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const [signupStep, setSignupStep] = useState(0); // 0 = form, 1 = loading, 2 = success

  const { signIn, signUp, error: authError, loading: authLoading, setDevQuickMode } = useAuth();
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
      title: 'Success! ✓',
      description: 'Welcome back! Loading your dashboard...'
    });

    setIsLoading(false);
    // Auth context will handle navigation based on role
  };

  // ============================================================================
  // SIGN UP HANDLER - IMPROVED WITH PROGRESS STEPS
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

    // Start signup process - show progress
    setIsLoading(true);
    setSignupStep(1);
    setSignUpErrors({});

    toast({
      title: 'Creating your account...',
      description: 'Please wait while we set up everything. This may take a moment.'
    });

    const { error } = await signUp(signUpEmail, signUpPassword, signUpFullName);
    
    if (error) {
      // Check if this is the special "auto-login-failed" error
      // In this case, account WAS created successfully
      if (error.name === 'AutoLoginFailedError') {
        // Account was created, but auto-login had issues (temporary service problem)
        // This is actually OK - user can manually sign in
        
        toast({
          title: 'Account Created! ✓',
          description: 'Your account is ready. Sign in with your credentials below.',
          variant: "default"
        });

        setSignupStep(2); // Show success screen then switch to signin

        // Switch to sign-in tab after 1 second
        setTimeout(() => {
          setCurrentTab('signin');
          setSignInEmail(signUpEmail);
          setSignInPassword(signUpPassword);
          
          // Clear signup form
          setSignUpEmail('');
          setSignUpPassword('');
          setSignUpConfirmPassword('');
          setSignUpFullName('');
          setSignupStep(0);
        }, 1500);

        setIsLoading(false);
        return;
      }

      // Real error - show it
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: "destructive"
      });
      setSignupStep(0);
      setIsLoading(false);
      return;
    }

    // Success! Account created and auto-login successful
    setSignupStep(2);
    toast({
      title: 'Account created! ✓',
      description: 'Welcome! Setting up your profile...',
    });

    // Wait a moment to ensure auth state is updated, then redirect
    setTimeout(() => {
      navigate('/setup-profile');
    }, 1000);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl"></div>
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
              <p className="text-muted-foreground mt-1">Connect and manage school data seamlessly</p>
            </div>
          </div>

          {/* Main Card */}
          <Card className="border-white/10 shadow-xl animate-slide-up">
            <CardHeader className="space-y-1 border-b border-white/10">
              <CardTitle className="text-2xl">
                {currentTab === 'signin' ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription>
                {currentTab === 'signin' 
                  ? 'Sign in to access your school dashboard'
                  : 'Join thousands of schools using SchoolBridge'}
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

              {/* Dev Quick Enter Button - Dev Only */}
              {import.meta.env.MODE === 'development' && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      <h3 className="font-bold text-amber-900 dark:text-amber-100">Developer Quick Access</h3>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      One-click entry to test the dashboard as a teacher
                    </p>
                    <Button
                      onClick={() => {
                        setDevQuickMode();
                        setTimeout(() => {
                          navigate('/setup-profile?quickMode=true');
                        }, 100);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Developer Quick Access
                    </Button>
                  </div>
                </div>
              )}

              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-1">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-background">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-background">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* ========== SIGN IN TAB ========== */}
                <TabsContent value="signin" className="space-y-4 animate-fade-in">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email Address
                      </Label>
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
                        className={`${signInErrors.email ? 'border-red-500' : ''} h-10`}
                      />
                      {signInErrors.email && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {signInErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showSignInPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={signInPassword}
                          onChange={(e) => {
                            setSignInPassword(e.target.value);
                            if (signInErrors.password) {
                              setSignInErrors({ ...signInErrors, password: undefined });
                            }
                          }}
                          disabled={isLoading || authLoading}
                          className={`${signInErrors.password ? 'border-red-500' : ''} h-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
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
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {signInErrors.password}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 font-semibold"
                      disabled={isLoading || authLoading}
                    >
                      {isLoading || authLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
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
                      <span className="bg-background px-2 text-muted-foreground">New to SchoolBridge?</span>
                    </div>
                  </div>

                  {/* Sign Up Link */}
                  <Button
                    type="button"
                    onClick={() => setCurrentTab('signup')}
                    variant="outline"
                    className="w-full h-10"
                  >
                    Create an account
                  </Button>
                </TabsContent>

                {/* ========== SIGN UP TAB ========== */}
                <TabsContent value="signup" className="space-y-4 animate-fade-in">
                  {signupStep === 0 ? (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      {/* Full Name Field */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Full Name
                        </Label>
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
                          className={`${signUpErrors.name ? 'border-red-500' : ''} h-10`}
                        />
                        {signUpErrors.name && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {signUpErrors.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">First and last name required</p>
                      </div>

                      {/* Email Field */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email Address
                        </Label>
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
                          className={`${signUpErrors.email ? 'border-red-500' : ''} h-10`}
                        />
                        {signUpErrors.email && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {signUpErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Password Field */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          Password
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
                            className={`${signUpErrors.password ? 'border-red-500' : ''} h-10 pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
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
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {signUpErrors.password}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          Confirm Password
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
                            className={`${signUpErrors.confirmPassword ? 'border-red-500' : ''} h-10 pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
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
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {signUpErrors.confirmPassword}
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full h-10 bg-gradient-to-r from-secondary to-secondary/80 hover:shadow-lg hover:shadow-secondary/30 font-semibold text-white"
                        disabled={isLoading || authLoading}
                      >
                        {isLoading || authLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  ) : signupStep === 1 ? (
                    // Loading State
                    <div className="py-8 space-y-6">
                      <SignupProgress
                        steps={[
                          {
                            title: 'Creating Account',
                            description: 'Validating credentials and setting up your account',
                            status: 'loading'
                          },
                          {
                            title: 'Setting Up Profile',
                            description: 'Preparing your dashboard and permissions',
                            status: 'pending'
                          },
                          {
                            title: 'Completing Setup',
                            description: 'Finalizing and redirecting to dashboard',
                            status: 'pending'
                          }
                        ]}
                        currentStep={1}
                      />
                      <p className="text-center text-sm text-muted-foreground">
                        This usually takes a few seconds...
                      </p>
                    </div>
                  ) : (
                    // Success State
                    <div className="py-8 space-y-4 text-center animate-fade-in">
                      <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-600/20 animate-pulse">
                          <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-600">Account Created!</h3>
                        <p className="text-muted-foreground mt-1">
                          Redirecting to sign-in...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
                    </div>
                  </div>

                  {/* Sign In Link */}
                  <Button
                    type="button"
                    onClick={() => setCurrentTab('signin')}
                    variant="outline"
                    className="w-full h-10"
                    disabled={signupStep !== 0}
                  >
                    Sign in instead
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Terms */}
              <p className="text-center text-xs text-muted-foreground mt-6">
                By signing in, you agree to our{' '}
                <a href="#" className="hover:text-primary transition">Terms of Service</a> and{' '}
                <a href="#" className="hover:text-primary transition">Privacy Policy</a>
              </p>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="grid grid-cols-3 gap-4 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">8000+</div>
              <div className="text-xs text-muted-foreground">Schools</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-secondary">34+</div>
              <div className="text-xs text-muted-foreground">Provinces</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-accent">2.5M+</div>
              <div className="text-xs text-muted-foreground">Students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

