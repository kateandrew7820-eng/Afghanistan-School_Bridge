import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type UserRole = 'teacher' | 'principal' | 'district_admin' | 'province_admin' | 'ministry_admin' | 'admin' | 'school';

// Map legacy roles to new roles
function mapRole(role: string): UserRole {
  if (role === 'admin') return 'ministry_admin';
  if (role === 'school') return 'teacher';
  return role as UserRole;
}

// Helper to check role tier
export function getRoleTier(role: UserRole): 'school' | 'district' | 'province' | 'ministry' {
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

export function getRoleDefaultRoute(role: UserRole): string {
  const tier = getRoleTier(role);
  switch (tier) {
    case 'school': return '/school';
    case 'district': return '/district';
    case 'province': return '/province';
    case 'ministry': return '/ministry';
    default: return '/school';
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return mapRole(data.role as string);
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, schools(*)')
    .eq('user_id', userId)
    .single();
  
  if (error) return null;
  return data;
}
