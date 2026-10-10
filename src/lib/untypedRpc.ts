import { supabase } from '@/integrations/supabase/client';

/** Calls database functions that are not yet in the generated types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RpcResult = Promise<{ data: any; error: { message: string } | null }>;
export function untypedRpc(fn: string, args?: Record<string, unknown>): RpcResult {
  return (supabase.rpc as unknown as (f: string, a?: Record<string, unknown>) => RpcResult)(fn, args);
}
