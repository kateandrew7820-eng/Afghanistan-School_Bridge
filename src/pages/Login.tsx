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

// =======================================
// VALIDATION HELPERS
// =======================================
const validateEmail = (email: string, t: any) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) return { valid: false, message: t('auth.invalidEmail') };
  return { valid: true };
};

const validatePassword = (password: string, minLength: number = 6, t: any) => {
  if (!password) return { valid: false, message: t('auth.passwordRequired') };
  if (password.length < minLength) return { valid: false, message: t('auth.passwordMin', { minLength }) };
  return { valid: true };
};

const validateFullName = (fullName: string, t: any) => {
  const trimmed = fullName.trim();
  if (!trimmed) return { valid: false, message: t('auth.fullNameRequired') };
  if (trimmed.split(' ').length < 2) return { valid: false, message: t('auth.firstAndLastName') };
  return { valid: true };
};

// =======================================
// MAIN COMPONENT
// =======================================
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, error: authError, loading: authLoading, setDevQuickMode } = useAuth();
  const { toast } = useToast();

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

  // Loading/UI
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('signin');
  const [signupStep, setSignupStep] = useState(0);

  // =======================================
  // HANDLE SIGN IN
  // =======================================
  const handleSignIn = async (
    e: React.FormEvent,
    demoEmail?: string,
    demoPassword?: string
  ) => {
    e.preventDefault();

    const emailToUse = demoEmail || signInEmail;
    const passwordToUse = demoPassword || signInPassword;

    const errors: typeof signInErrors = {};
    const emailValidation = validateEmail(emailToUse, t);
    const passwordValidation = validatePassword(passwordToUse, 6, t);
    if (!emailValidation.valid) errors.email = emailValidation.message;
    if (!passwordValidation.valid) errors.password = passwordValidation.message;
    if (Object.keys(errors).length > 0) {
      setSignInErrors(errors);
      return;
    }

    setIsLoading(true);
    setSignInErrors({});

    const { error } = await signIn(emailToUse, passwordToUse);
    if (error) {
      toast({ title: t('auth.signInFailed'), description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    toast({ title: 'Success! ✓', description: 'Welcome back! Loading your dashboard...' });
    setIsLoading(false);
  };

  // =======================================
  // HANDLE SIGN UP (UNCHANGED)
  // =======================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... keep your current signup logic intact
  };

  // =======================================
  // RENDER
  // =======================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{t('app.title')}</h1>
              <p className="text-muted-foreground mt-1">Connect and manage school data seamlessly</p>
            </div>
          </div>

          <Card className="border-white/10 shadow-xl animate-slide-up">
            <CardHeader className="space-y-1 border-b border-white/10">
              <CardTitle className="text-2xl">{currentTab === 'signin' ? 'Welcome Back' : 'Create Account'}</CardTitle>
              <CardDescription>{currentTab === 'signin' ? 'Sign in to access your school dashboard' : 'Join thousands of schools using SchoolBridge'}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError.message}</AlertDescription>
                </Alert>
              )}

              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-1">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-background">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-background">Sign Up</TabsTrigger>
                </TabsList>

                {/* SIGN IN TAB */}
                <TabsContent value="signin" className="space-y-4 animate-fade-in">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="you@school.com" value={signInEmail} onChange={(e)=>setSignInEmail(e.target.value)} />
                    <Label>Password</Label>
                    <Input type="password" placeholder="••••••" value={signInPassword} onChange={(e)=>setSignInPassword(e.target.value)} />
                    <Button type="submit" className="w-full">Sign In</Button>
                  </form>

                  {/* DEMO LOGIN BUTTON */}
                  <Button
                    type="button"
                    onClick={(e) => handleSignIn(e, 'forlovablec@gmail.com', 'Administrator')}
                    className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white"
                  >
                    Demo Login
                  </Button>
                </TabsContent>

                {/* SIGN UP TAB */}
                <TabsContent value="signup" className="space-y-4 animate-fade-in">
                  {/* keep your full signup form as is */}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
