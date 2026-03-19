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

  // Use demo role/tier if in demo mode, otherwise use actual role
  const effectiveRole = isDemoMode ? demoRole : role;
  const effectiveTier = isDemoMode ? demoTier : getRoleTier(role);
  const roleTier = effectiveTier;
  const defaultRoute = getRoleDefaultRoute(role);

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
        console.warn('Failed to fetch user role:', roleResult.error);
        // Don't break auth on role fetch failure - use default
        setRole('school');
      } else {
        setRole(roleResult.role);
      }

      // Set profile (nice to have, not critical)
      if (profileResult.error) {
        console.warn('Failed to fetch user profile:', profileResult.error);
        // Profile may not exist yet on new signup - that's ok
      }
      setProfile(profileResult.profile);
    } catch (err) {
      console.error('Error loading user data:', err);
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
          console.error('Auth initialization error:', authError);
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
      console.error('Sign in error:', error);
      return { error };
    }
  };

  /**
   * Sign up with email, password, and full name
   * Creates account and automatically logs user in (modern UX pattern)
   * Database triggers create profile and role automatically
   * 
   * FIX: Properly propagates auto-login errors back to caller
   */
  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: Error | null }> => {
    try {
      setError(null);

      // Step 1: Sign up the user
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
          message = 'This email is already registered. Please sign in instead.';
        }
        const error = new Error(message);
        setError(error);
        console.error('Sign up error:', error);
        return { error };
      }

      if (!newUser) {
        const error = new Error('Failed to create account. Please try again.');
        setError(error);
        console.error('Sign up error:', error);
        return { error };
      }

      console.log('Account created, userId:', newUser.id);

      // Step 2: Wait for database triggers to create profile/role
      // OPTIMIZED: Minimal delay (200ms instead of 1000ms)
      // Database triggers start immediately and don't block auth flow
      // Role/profile load in parallel in background via auth listener
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 3: Auto-login - creates session and triggers onAuthStateChange listener
      // CRITICAL FIX: If auto-login fails, PROPAGATE THE ERROR back to caller
      // Don't silently swallow the error - user needs to know signup failed
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        const message = `Account created but auto-login failed: ${signInError.message}. Please try signing in manually.`;
        const error = new Error(message);
        setError(error);
        console.error('Auto-login after signup failed:', error);
        // FIX: Return the error so Login component can show it
        // User created account successfully but needs to manually sign in
        return { error };
      }

      // Success! Auto-login worked
      // Auth listener will fire and update state automatically
      setError(null);
      console.log('Auto-login successful after signup');
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      console.error('Sign up error:', error);
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

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role: effectiveRole,
      roleTier,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      defaultRoute: isDemoMode ? (demoTier === 'school' ? '/school' : `/${demoTier}`) : getRoleDefaultRoute(role),
      isDemoMode,
      setDemoMode: setDemoModeFunc,
      exitDemoMode: exitDemoModeFunc,
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
