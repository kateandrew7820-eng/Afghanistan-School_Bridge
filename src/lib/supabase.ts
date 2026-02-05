import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type UserRole = 'admin' | 'school';

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return data.role as UserRole;
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
