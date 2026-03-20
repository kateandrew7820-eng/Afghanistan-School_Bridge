import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type UserRole = 'teacher' | 'principal' | 'district_admin' | 'province_admin' | 'ministry_admin' | 'admin' | 'school';

// ============================================================================
// ROLE & TIER MANAGEMENT
// ============================================================================

// Map legacy roles to new roles (handle backward compatibility)
function mapRole(role: string): UserRole {
  const validRoles: UserRole[] = ['school', 'teacher', 'principal', 'district_admin', 'province_admin', 'ministry_admin', 'admin'];
  if (validRoles.includes(role as UserRole)) {
    return role as UserRole;
  }
  // Default fallback
  return 'school';
}

// Helper to check role tier
export function getRoleTier(role: UserRole | null): 'school' | 'district' | 'province' | 'ministry' | null {
  if (!role) return null;
  switch (role) {
    case 'teacher':
    case 'principal':
    case 'school':
      return 'school';
    case 'district_admin':
      return 'district';
    case 'province_admin':
      return 'province';
    case 'ministry_admin':
    case 'admin':
      return 'ministry';
    default:
      return 'school';
  }
}

export function getRoleDefaultRoute(role: UserRole | null): string {
  const tier = getRoleTier(role);
  switch (tier) {
    case 'school': return '/school';
    case 'district': return '/district';
    case 'province': return '/province';
    case 'ministry': return '/ministry';
    case null: return '/login';
    default: return '/school';
  }
}

// ============================================================================
// USER DATA FETCHING WITH PROPER ERROR HANDLING
// ============================================================================

export interface FetchUserRoleResponse {
  role: UserRole | null;
  error: Error | null;
}

/**
 * Fetch user role with comprehensive error handling
 * Returns object with both role and error for caller to decide how to handle
 */
export async function getUserRole(userId: string): Promise<FetchUserRoleResponse> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    // Handle not found (new user case)
    if (error?.code === 'PGRST116') {
      return { role: 'school', error: null }; // Default new users to school role
    }
    
    // Handle RLS or permission errors
    if (error?.code === '42501') {
      return { role: null, error: new Error('Permission denied accessing user roles') };
    }
    
    // Handle other unexpected errors
    if (error) {
      return { role: null, error };
    }
    
    if (!data) {
      return { role: 'school', error: null }; // Default to school
    }
    
    return { role: mapRole(data.role as string), error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to fetch user role');
    return { role: null, error };
  }
}

export interface FetchUserProfileResponse {
  profile: any | null;
  error: Error | null;
}

/**
 * Fetch user profile with comprehensive error handling
 * Returns object with both profile and error for caller to decide how to handle
 * OPTIMIZED: Removed schools relationship for faster initial load
 */
export async function getUserProfile(userId: string): Promise<FetchUserProfileResponse> {
  try {
    // OPTIMIZED: Don't fetch schools relationship on initial load - defer that to dashboard
    // Reduces query time and allows faster redirect to dashboard
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, school_id, district, province')
      .eq('user_id', userId)
      .single();
    
    // Handle not found (new user, profile being created)
    if (error?.code === 'PGRST116') {
      return { profile: null, error: null }; // Null profile is ok (loading state)
    }
    
    // Handle RLS or permission errors
    if (error?.code === '42501') {
      return { profile: null, error: new Error('Permission denied accessing profile') };
    }
    
    // Handle other unexpected errors
    if (error) {
      return { profile: null, error };
    }
    
    return { profile: data || null, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to fetch user profile');
    return { profile: null, error };
  }
}

// ============================================================================
// RETRY LOGIC FOR FAILED OPERATIONS
// ============================================================================

/**
 * Retry a promise-returning function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < maxRetries - 1) {
        // Wait with exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError || new Error('All retries exhausted');
}
