import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { School, Building2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const validateEmail = (email: string): { valid: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true };
};

const validatePassword = (password: string, minLength: number = 6): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters` };
  }
  return { valid: true };
};

const validateFullName = (fullName: string): { valid: boolean; message?: string } => {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { valid: false, message: 'Full name is required' };
  }
  if (trimmed.split(' ').length < 2) {
    return { valid: false, message: 'Please enter your first and last name' };
  }
  return { valid: true };
};

// ============================================================================
// MAIN LOGIN COMPONENT
// ============================================================================

export default function Login() {
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
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  // Loading and UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('signin');

  const { signIn, signUp, error: authError, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ============================================================================
  // SIGN IN HANDLER
  // ============================================================================

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const errors: typeof signInErrors = {};
    const emailValidation = validateEmail(signInEmail);
    const passwordValidation = validatePassword(signInPassword);

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
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Success!",
      description: "You have been signed in. Redirecting..."
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
    const nameValidation = validateFullName(signUpFullName);
    const emailValidation = validateEmail(signUpEmail);
    const passwordValidation = validatePassword(signUpPassword);

    if (!nameValidation.valid) errors.name = nameValidation.message;
    if (!emailValidation.valid) errors.email = emailValidation.message;
    if (!passwordValidation.valid) errors.password = passwordValidation.message;

    // Check password match
    if (signUpPassword !== signUpConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
        title: "Account Creation Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Show success message and switch to signin tab
    setShowSignupSuccess(true);
    setSignUpFullName('');
    setSignUpPassword('');
    setSignUpConfirmPassword('');
    
    toast({
      title: "Account Created!",
      description: "Your account has been created successfully. Please sign in with your credentials.",
    });

    // Auto-switch to sign in tab after 2 seconds
    setTimeout(() => {
      setCurrentTab('signin');
      setSignInEmail(signUpEmail);
      setShowSignupSuccess(false);
    }, 2000);

    setIsLoading(false);
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
          <h1 className="text-2xl font-heading font-bold text-foreground">SchoolBridge Afghanistan</h1>
          <p className="text-muted-foreground">پورتال مکاتب افغانستان</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome to SchoolBridge</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started
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

            {/* Success Alert after signup */}
            {showSignupSuccess && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Account created successfully! Switching to sign in...
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              {/* ========== SIGN IN TAB ========== */}
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email Address</Label>
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
                    <Label htmlFor="signin-password">Password</Label>
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
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* ========== SIGN UP TAB ========== */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
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
                    <Label htmlFor="signup-email">Email Address</Label>
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
                    <Label htmlFor="signup-password">Password</Label>
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
                    <p className="text-xs text-muted-foreground">At least 6 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
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
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-muted-foreground mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
