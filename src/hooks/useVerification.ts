import { useAuth } from '@/contexts/AuthContext';

export interface VerificationStatus {
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  rejectionReason: string | null;
  verifiedAt: string | null;
  canAccessDashboard: boolean; // isVerified OR isDemoMode
  needsSetup: boolean; // User exists but hasn't filled setup profile yet
}

/**
 * Hook to check user's verification status
 * Returns status information and whether user can access their dashboard
 * 
 * In demo mode, users bypass all verification checks
 */
export function useVerification(): VerificationStatus {
  const { profile, isDemoMode } = useAuth();

  // Demo mode bypasses all verification
  if (isDemoMode) {
    return {
      isVerified: true,
      isPending: false,
      isRejected: false,
      rejectionReason: null,
      verifiedAt: null,
      canAccessDashboard: true,
      needsSetup: false,
    };
  }

  // Check if user needs to complete setup (no status field yet)
  if (!profile?.status) {
    return {
      isVerified: false,
      isPending: false,
      isRejected: false,
      rejectionReason: null,
      verifiedAt: null,
      canAccessDashboard: false,
      needsSetup: true,
    };
  }

  return {
    isVerified: profile.status === 'verified',
    isPending: profile.status === 'pending_verification',
    isRejected: profile.status === 'rejected',
    rejectionReason: profile.rejection_reason || null,
    verifiedAt: profile.verified_at || null,
    canAccessDashboard: profile.status === 'verified',
    needsSetup: !profile.status,
  };
}
