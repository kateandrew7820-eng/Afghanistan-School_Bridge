import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getUserRole, getUserProfile, UserRole, getRoleTier, getRoleDefaultRoute } from '@/lib/supabase';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  school_id: string | null;
  district: string | null;
  province: string | null;
  school_name?: string | null;
  role?: string | null;
  phone_number?: string | null;
  status?: string;
  verified_by_user_id?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  schools?: {
    id: string;
    name: string;
    code: string | null;
    province: string | null;
    district: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  profileLoading: boolean;
  role: UserRole | null;
  roleTier: 'school' | 'district' | 'province' | 'ministry' | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  defaultRoute: string;
  isDemoMode: boolean;
  setDemoMode: (role: UserRole, tier: 'school' | 'district' | 'province' | 'ministry') => void;
  exitDemoMode: () => void;
  isDevQuickMode: boolean;
  setDevQuickMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [demoTier, setDemoTier] = useState<'school' | 'district' | 'province' | 'ministry' | null>(null);

  // Dev quick mode state
  const [isDevQuickMode, setIsDevQuickModeState] = useState(false);
  const [devQuickProfile, setDevQuickProfile] = useState<Profile | null>(null);

  // Prevent concurrent loadUserData calls
  const loadingRef = useRef(false);

  const effectiveRole = isDemoMode ? demoRole : (isDevQuickMode ? 'teacher' : role);
  const effectiveTier = isDemoMode ? demoTier : (isDevQuickMode ? 'school' : getRoleTier(role));
  const roleTier = effectiveTier;

  /**
   * Load user role and profile from database
   * Uses a ref guard to prevent concurrent calls
   */
  const loadUserData = useCallback(async (userId: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setProfileLoading(true);
    try {
      const [roleResult, profileResult] = await Promise.all([
        getUserRole(userId),
        getUserProfile(userId),
      ]);

      if (roleResult.error) {
        console.warn('[Auth] Role fetch failed, using default:', roleResult.error.message);
        setRole('school');
      } else {
        setRole(roleResult.role);
      }

      if (profileResult.error) {
        console.warn('[Auth] Profile fetch failed:', profileResult.error.message);
      }
      setProfile(profileResult.profile);
    } catch (err) {
      console.error('[Auth] loadUserData failed:', err);
      setRole('school');
      setProfile(null);
    } finally {
      loadingRef.current = false;
      setProfileLoading(false);
    }
  }, []);

  /**
   * Initialize auth state
   * 1. Restore session from storage via getSession()
   * 2. Subscribe to auth changes (NO async inside callback — fire-and-forget)
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (currentSession?.user) {
          setUser(currentSession.user);
          setSession(currentSession);
          await loadUserData(currentSession.user.id);
        } else {
          setUser(null);
          setSession(null);
          setRole(null);
          setProfile(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize auth'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Subscribe BEFORE getSession to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        // Only react to meaningful events
        if (event === 'INITIAL_SESSION') return;
        
        console.log('[Auth] onAuthStateChange:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            loadUserData(newSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setRole(null);
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [loadUserData]);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        let message = signInError.message;
        if (message.includes('Invalid login credentials')) {
          message = 'ایمیل یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.';
        } else if (message.includes('Email not confirmed')) {
          message = 'لطفاً ابتدا ایمیل خود را تأیید کنید.';
        }
        const error = new Error(message);
        setError(error);
        return { error };
      }

      setError(null);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      return { error };
    }
  };

  /**
   * Sign up with email, password, and full name
   * Account is created → email confirmation required → no auto-login
   */
  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: Error | null }> => {
    try {
      setError(null);

      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (signUpError) {
        let message = signUpError.message;
        if (message.includes('already registered')) {
          message = 'این ایمیل قبلاً ثبت شده است. لطفاً با حساب موجود وارد شوید.';
        } else if (message.includes('password') && message.includes('characters')) {
          message = 'رمز عبور باید حداقل ۶ حرف باشد.';
        }
        const error = new Error(message);
        setError(error);
        return { error };
      }

      if (!newUser) {
        const error = new Error('ایجاد حساب ناموفق بود. لطفاً دوباره تلاش کنید.');
        setError(error);
        return { error };
      }

      // If user was auto-confirmed (e.g. auto_confirm is on), identities will exist
      // If email confirmation is required, identities array may be empty or user won't have a session
      if (newUser.identities && newUser.identities.length === 0) {
        // This means the email is already registered
        const error = new Error('این ایمیل قبلاً ثبت شده است. لطفاً با حساب موجود وارد شوید.');
        setError(error);
        return { error };
      }

      setError(null);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setError(null);
      setIsDemoMode(false);
      setDemoRole(null);
      setDemoTier(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err : new Error('Sign out failed'));
    }
  };

  const setDemoModeFunc = (role: UserRole, tier: 'school' | 'district' | 'province' | 'ministry') => {
    setDemoRole(role);
    setDemoTier(tier);
    setIsDemoMode(true);
    setLoading(false);
    setUser({ id: 'demo-user', email: 'demo@example.com' } as any);
  };

  const exitDemoModeFunc = () => {
    setIsDemoMode(false);
    setDemoRole(null);
    setDemoTier(null);
    setUser(null);
    setRole(null);
  };

  const setDevQuickModeFunc = () => {
    if (import.meta.env.MODE !== 'development') return;
    
    const mockDevUser = {
      id: 'dev-quick-user-' + Date.now(),
      email: 'developer@test.local',
      user_metadata: { full_name: 'سازنده' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any;

    const mockDevProfile: Profile = {
      id: 'dev-profile-' + Date.now(),
      user_id: mockDevUser.id,
      full_name: 'سازنده',
      school_id: null,
      district: 'ولسوالی توسعه',
      province: 'کابل',
      school_name: 'مکتب توسعه',
      role: 'teacher',
      phone_number: '+93 700 000 000',
      status: 'verified',
      verified_by_user_id: null,
      verified_at: new Date().toISOString(),
      rejection_reason: null,
      schools: null,
    };

    setUser(mockDevUser);
    setProfile(mockDevProfile);
    setRole('teacher');
    setIsDevQuickModeState(true);
    setDevQuickProfile(mockDevProfile);
    setLoading(false);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile: isDevQuickMode ? devQuickProfile : profile,
      profileLoading: isDevQuickMode || isDemoMode ? false : profileLoading,
      role: effectiveRole,
      roleTier,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      defaultRoute: isDemoMode ? (demoTier === 'school' ? '/school' : `/${demoTier}`) : (isDevQuickMode ? '/setup-profile?quickMode=true' : getRoleDefaultRoute(role)),
      isDemoMode,
      setDemoMode: setDemoModeFunc,
      exitDemoMode: exitDemoModeFunc,
      isDevQuickMode,
      setDevQuickMode: setDevQuickModeFunc,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
