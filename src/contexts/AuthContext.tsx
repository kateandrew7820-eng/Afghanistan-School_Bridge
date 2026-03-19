import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getUserRole, getUserProfile, UserRole, getRoleTier, getRoleDefaultRoute } from '@/lib/supabase';

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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  defaultRoute: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const roleTier = role ? getRoleTier(role) : null;
  const defaultRoute = role ? getRoleDefaultRoute(role) : '/login';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const [userRole, userProfile] = await Promise.all([
            getUserRole(session.user.id),
            getUserProfile(session.user.id)
          ]);
          setRole(userRole);
          setProfile(userProfile as Profile | null);
        } else {
          setRole(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const [userRole, userProfile] = await Promise.all([
          getUserRole(session.user.id),
          getUserProfile(session.user.id)
        ]);
        setRole(userRole);
        setProfile(userProfile as Profile | null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Sign up the user - profile and role will be created automatically by database triggers
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (signUpError) return { error: signUpError };
      if (!newUser) return { error: new Error('Failed to create user') };

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Signup failed') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, roleTier, loading, signIn, signUp, signOut, defaultRoute }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
