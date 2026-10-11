import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const commonPasswords = new Set([
  'password', 'password123', 'password123!', 'p@ssw0rd123!',
  'qwerty12345!', 'qwertyuiop123A!', 'letmein12345!', 'welcome12345!',
  'welcome2024Aa!', 'admin123456!', 'admin123456A!', 'iloveyou123A!',
  '1234567890Aa!', 'afghanistan123A!', 'kabul123456Aa!',
].map((password) => password.toLowerCase()));
const passwordHistoryLimit = 5;
const pbkdf2Iterations = 210000;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeHex(value: string): Uint8Array {
  return new Uint8Array(value.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}

async function derivePasswordHash(password: string, salt: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: decodeHex(salt), iterations: pbkdf2Iterations },
    keyMaterial,
    256,
  );
  return encodeHex(new Uint8Array(bits));
}

function secureEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function passwordIsWeak(password: string): boolean {
  const normalized = password.normalize('NFKC').toLowerCase();
  return [...password].length < 12
    || !/[a-z]/.test(password)
    || !/[A-Z]/.test(password)
    || !/[0-9]/.test(password)
    || !/[^A-Za-z0-9]/.test(password)
    || commonPasswords.has(normalized)
    || /^(.)\1{5,}$/.test(normalized);
}

async function isBreachedPassword(password: string): Promise<boolean> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password)));
  const hash = encodeHex(digest).toUpperCase();
  const response = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, {
    headers: { 'Add-Padding': 'true' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('breach_check_unavailable');

  const suffix = hash.slice(5);
  const entries = (await response.text()).split('\n');
  return entries.some((entry) => {
    const [entryHash, count] = entry.trim().split(':');
    return entryHash?.toUpperCase() === suffix && Number(count) > 0;
  });
}

function isSecureRequest(request: Request): boolean {
  const url = new URL(request.url);
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  return url.protocol === 'https:'
    || forwardedProtocol === 'https'
    || url.hostname === 'localhost'
    || url.hostname === '127.0.0.1';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { code: 'METHOD_NOT_ALLOWED' });
  if (!isSecureRequest(request)) return json(400, { code: 'HTTPS_REQUIRED' });

  const authorization = request.headers.get('Authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return json(401, { code: 'UNAUTHENTICATED' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(503, { code: 'SERVICE_UNAVAILABLE' });

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !user?.email) return json(401, { code: 'UNAUTHENTICATED' });

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { code: 'INVALID_REQUEST' });
  }

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!currentPassword || !newPassword || currentPassword.length > 1024 || newPassword.length > 1024) {
    return json(400, { code: 'INVALID_REQUEST' });
  }
  if (passwordIsWeak(newPassword)) return json(400, { code: 'PASSWORD_TOO_WEAK' });
  if (currentPassword === newPassword) return json(400, { code: 'PASSWORD_REUSED' });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: lockRows, error: lockError } = await admin.rpc('password_change_lock_status', {
    target_user_id: user.id,
  });
  if (lockError) return json(503, { code: 'SERVICE_UNAVAILABLE' });
  const lockState = lockRows?.[0];
  if (lockState?.is_locked) {
    return json(429, { code: 'RATE_LIMITED', retryAfter: lockState.retry_after_seconds });
  }

  const verifier = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: verified, error: verificationError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verificationError || verified.user?.id !== user.id) {
    if (verificationError?.status && verificationError.status !== 400 && verificationError.status !== 401) {
      return json(503, { code: 'SERVICE_UNAVAILABLE' });
    }
    const { data: failures } = await admin.rpc('record_password_change_failure', {
      target_user_id: user.id,
    });
    if (typeof failures === 'number' && failures >= 5) {
      return json(429, { code: 'RATE_LIMITED', retryAfter: 900 });
    }
    return json(400, { code: 'CURRENT_PASSWORD_INCORRECT' });
  }

  if (verified.session) {
    const { error: verifierSessionError } = await admin.auth.admin.signOut(
      verified.session.access_token,
      'local',
    );
    if (verifierSessionError) return json(503, { code: 'SERVICE_UNAVAILABLE' });
  }

  await admin.rpc('clear_password_change_failures', { target_user_id: user.id });

  let breached: boolean;
  try {
    breached = await isBreachedPassword(newPassword);
  } catch {
    return json(503, { code: 'PASSWORD_CHECK_UNAVAILABLE' });
  }
  if (breached) return json(400, { code: 'PASSWORD_BREACHED' });

  const { data: history, error: historyError } = await admin
    .from('password_history')
    .select('password_hash, salt')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(passwordHistoryLimit);
  if (historyError) return json(503, { code: 'SERVICE_UNAVAILABLE' });

  for (const previous of history ?? []) {
    const candidateHash = await derivePasswordHash(newPassword, previous.salt);
    if (secureEquals(candidateHash, previous.password_hash)) return json(400, { code: 'PASSWORD_REUSED' });
  }

  const salt = encodeHex(crypto.getRandomValues(new Uint8Array(16)));
  const currentPasswordHash = await derivePasswordHash(currentPassword, salt);
  const { error: historyInsertError } = await admin.rpc('append_password_history', {
    target_user_id: user.id,
    encoded_hash: currentPasswordHash,
    encoded_salt: salt,
  });
  if (historyInsertError) return json(503, { code: 'SERVICE_UNAVAILABLE' });

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (updateError) {
    await admin.from('password_history').delete().eq('user_id', user.id).eq('salt', salt);
    return json(400, { code: 'PASSWORD_UPDATE_FAILED' });
  }

  const { error: revokeError } = await admin.auth.admin.signOut(accessToken, 'others');
  if (revokeError) {
    await admin.auth.admin.signOut(accessToken, 'global');
    return json(200, { success: true, reauthenticate: true });
  }

  return json(200, { success: true, reauthenticate: false });
});
