import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

describe('supabase client bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('falls back gracefully when Supabase env values are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { supabase } = await import('./client');

    const sessionResult = await supabase.auth.getSession();
    expect(sessionResult.data.session).toBeNull();
    expect(sessionResult.error).toBeNull();
  });
});
