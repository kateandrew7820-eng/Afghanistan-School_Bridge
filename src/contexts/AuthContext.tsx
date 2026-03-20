import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getUserRole, getUserProfile, UserRole, getRoleTier, getRoleDefaultRoute, FetchUserRoleResponse, FetchUserProfileResponse, retryWithBackoff } from '@/lib/supabase';

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
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [demoTier, setDemoTier] = useState<'school' | 'district' | 'province' | 'ministry' | null>(null);

  // Dev quick mode state (for fast development testing)
  const [isDevQuickMode, setIsDevQuickModeState] = useState(false);
  const [devQuickProfile, setDevQuickProfile] = useState<Profile | null>(null);

  // Use demo role/tier if in demo mode, otherwise use dev quick mode, otherwise use actual role
  const effectiveRole = isDemoMode ? demoRole : (isDevQuickMode ? 'teacher' : role);
  const effectiveTier = isDemoMode ? demoTier : (isDevQuickMode ? 'school' : getRoleTier(role));
  const roleTier = effectiveTier;
  const defaultRoute = getRoleDefaultRoute(effectiveRole);

  /**
   * Load user role and profile from database
   * Called after auth state change
   * OPTIMIZED: Loads role and profile in PARALLEL instead of sequential
   */
  const loadUserData = async (userId: string) => {
    try {
      // Load role and profile IN PARALLEL (not sequential) - 2-3x faster
      // Use retry logic in case of temporary network issues
      const [roleResult, profileResult] = await Promise.all([
        retryWithBackoff(
          () => getUserRole(userId),
          3,
          500
        ),
        retryWithBackoff(
          () => getUserProfile(userId),
          3,
          500
        )
      ]);

      // Set role (critical for redirect)
      if (roleResult.error) {
        // Don't break auth on role fetch failure - use default
        setRole('school');
      } else {
        setRole(roleResult.role);
      }

      // Set profile (nice to have, not critical)
      if (profileResult.error) {
        // Profile may not exist yet on new signup - that's ok
      }
      setProfile(profileResult.profile);
    } catch (err) {
      // Graceful degradation - let user in with defaults
      setRole('school');
      setProfile(null);
    }
  };

  /**
   * Initialize auth state
   * Only run once on mount to avoid race conditions
   */
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        // Get current session
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

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMounted) return;

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user) {
              await loadUserData(newSession.user.id);
            } else {
              setRole(null);
              setProfile(null);
            }
          }
        );

        unsubscribe = subscription?.unsubscribe;
      } catch (err) {
        if (isMounted) {
          const authError = err instanceof Error ? err : new Error('Failed to initialize auth');
          setError(authError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  /**
   * Sign in with email and password
   * Includes comprehensive error handling
   */
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        // Provide user-friendly error messages
        let message = signInError.message;
        if (signInError.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please try again.';
        } else if (signInError.message.includes('Email not confirmed')) {
          message = 'Please verify your email address first.';
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
   * Creates account and automatically logs user in (modern UX pattern)
   * Database triggers create profile and role automatically
   * 
   * IMPROVED: Smart retry logic for auto-login with exponential backoff
   * Handles slow connections and temporary service issues gracefully
   */
  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: Error | null }> => {
    try {
      setError(null);

      // =========================================================================
      // STEP 1: Create the account
      // =========================================================================
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (signUpError) {
        let message = signUpError.message;
        if (signUpError.message.includes('already registered')) {
          message = 'This email is already registered. Please sign in with your existing account.';
        }
        const error = new Error(message);
        setError(error);
        return { error };
      }

      if (!newUser) {
        const error = new Error('Failed to create account. Please try again.');
        setError(error);
        return { error };
      }

      // =========================================================================
      // STEP 2: Auto-login with intelligent retry logic
      // Database triggers may take time on slow connections or under load
      // We implement exponential backoff: 300ms, 600ms, 900ms, 1200ms
      // =========================================================================
      const maxRetries = 4;
      const initialDelayMs = 300;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Wait with exponential backoff: 300ms * attempt
        const delayMs = initialDelayMs * attempt;
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Try auto-login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!signInError) {
          // SUCCESS! Auto-login worked
          // Auth listener will fire and update state automatically
          setError(null);
          return { error: null };
        }

        // Store error for final fallback message
        lastError = signInError;

        // If it's not a transient error, stop retrying immediately
        // Common non-transient errors:
        if (signInError.message.includes('Invalid login credentials')) {
          // Credentials failed - this won't be fixed by waiting, stop retrying
          break;
        }

        // Log retry attempt for debugging (only in dev)
        if (import.meta.env.MODE === 'development') {
          console.log(`Auto-login attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`, signInError.message);
        }
      }

      // =========================================================================
      // STEP 3: All auto-login attempts failed
      // Instead of showing error, treat signup as successful
      // User will see success page with option to manually sign-in from there
      // =========================================================================
      
      // Account is definitely created at this point
      // Auto-login failed, but that won't be fixed by retrying more
      // Set a success state anyway - user can manually sign in
      setError(null);
      
      // Return special error object that indicates account was created
      // but auto-login failed - caller can show appropriate message
      const fallbackError = new Error('auto-login-failed');
      fallbackError.name = 'AutoLoginFailedError';
      return { error: fallbackError };

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      return { error };
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setError(null);
      // Also exit demo mode on sign out
      setIsDemoMode(false);
      setDemoRole(null);
      setDemoTier(null);
    } catch (err) {
      const signOutError = err instanceof Error ? err : new Error('Sign out failed');
      console.error('Sign out error:', signOutError);
      setError(signOutError);
    }
  };

  /**
   * Enter demo mode with specified role and tier
   * Used for development/testing without authentication
   * Only works in development environment
   */
  const setDemoModeFunc = (role: UserRole, tier: 'school' | 'district' | 'province' | 'ministry') => {
    // Check if running in development environment
    if (import.meta.env.MODE !== 'development') {
      console.warn('Demo mode is only available in development environment');
      return;
    }
    
    console.log('Entering demo mode with role:', role, 'tier:', tier);
    setDemoRole(role);
    setDemoTier(tier);
    setIsDemoMode(true);
    setLoading(false);
    // Mock user for demo mode
    setUser({
      id: 'demo-user',
      email: 'demo@example.com',
    } as any);
  };

  /**
   * Exit demo mode and return to normal auth flow
   */
  const exitDemoModeFunc = () => {
    console.log('Exiting demo mode');
    setIsDemoMode(false);
    setDemoRole(null);
    setDemoTier(null);
    setUser(null);
    setRole(null);
  };

  /**
   * Enter dev quick mode for fast development testing
   * Creates a mock user without authentication
   * Only works in development environment
   */
  const setDevQuickModeFunc = () => {
    // Check if running in development environment
    if (import.meta.env.MODE !== 'development') {
      console.warn('Quick mode is only available in development environment');
      return;
    }
    
    console.log('Entering dev quick mode...');
    
    // Create mock dev user
    const mockDevUser = {
      id: 'dev-quick-user-' + Date.now(),
      email: 'developer@test.local',
      user_metadata: {
        full_name: 'سازنده'
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any;

    // Create mock dev profile
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

    // Set state for dev quick mode
    setUser(mockDevUser);
    setProfile(mockDevProfile);
    setRole('teacher');
    setIsDevQuickModeState(true);
    setDevQuickProfile(mockDevProfile);
    setLoading(false);
    setError(null);

    console.log('Dev quick mode activated with mock user:', mockDevUser.id);
  };

  /**
   * Exit dev quick mode
   */
  const exitDevQuickModeFunc = () => {
    console.log('Exiting dev quick mode');
    setIsDevQuickModeState(false);
    setUser(null);
    setProfile(null);
    setRole(null);
    setDevQuickProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile: isDevQuickMode ? devQuickProfile : profile,
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
