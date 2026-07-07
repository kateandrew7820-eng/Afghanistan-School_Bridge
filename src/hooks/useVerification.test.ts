import { describe, expect, it } from 'vitest';
import { getVerificationStatus } from './useVerification';

describe('getVerificationStatus', () => {
  it('treats legacy verified profiles as verified even when status is missing', () => {
    const status = getVerificationStatus(
      {
        role: 'teacher',
        verified_at: '2024-01-01T00:00:00.000Z',
      } as any,
      'teacher',
      false,
      false
    );

    expect(status.isVerified).toBe(true);
    expect(status.canAccessDashboard).toBe(true);
    expect(status.needsSetup).toBe(false);
  });

  it('does not force setup for recognized users who already have a profile and role', () => {
    const status = getVerificationStatus(
      {
        role: 'principal',
        full_name: 'Principal User',
      } as any,
      'principal',
      false,
      false
    );

    expect(status.needsSetup).toBe(false);
    expect(status.canAccessDashboard).toBe(true);
  });
});
