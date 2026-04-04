import { useAuth } from '@/contexts/AuthContext';

export interface VerificationStatus {
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  rejectionReason: string | null;
  verifiedAt: string | null;
  canAccessDashboard: boolean;
  needsSetup: boolean;
}

/**
 * Hook to check user's verification status.
 * Respects profileLoading to avoid false redirects.
 */
export function useVerification(): VerificationStatus {
  const { profile, isDemoMode, profileLoading } = useAuth();

  if (isDemoMode) {
    return {
      isVerified: true, isPending: false, isRejected: false,
      rejectionReason: null, verifiedAt: null,
      canAccessDashboard: true, needsSetup: false,
    };
  }

  // While profile is still loading, don't trigger needsSetup
  if (profileLoading) {
    return {
      isVerified: false, isPending: false, isRejected: false,
      rejectionReason: null, verifiedAt: null,
      canAccessDashboard: false, needsSetup: false,
    };
  }

  if (!profile?.status) {
    return {
      isVerified: false, isPending: false, isRejected: false,
      rejectionReason: null, verifiedAt: null,
      canAccessDashboard: false, needsSetup: true,
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
