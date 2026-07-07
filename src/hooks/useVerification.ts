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

interface VerificationProfileLike {
  status?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  role?: string | null;
  full_name?: string | null;
  school_id?: string | null;
  school_name?: string | null;
  district?: string | null;
  province?: string | null;
  user_id?: string | null;
}

export function getVerificationStatus(
  profile: VerificationProfileLike | null,
  role: string | null | undefined,
  isDemoMode: boolean,
  profileLoading: boolean
): VerificationStatus {
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

  if (profileLoading) {
    return {
      isVerified: false,
      isPending: false,
      isRejected: false,
      rejectionReason: null,
      verifiedAt: null,
      canAccessDashboard: false,
      needsSetup: false,
    };
  }

  const normalizedRole = typeof role === 'string' ? role : null;
  const hasExistingProfile = !!profile && (
    profile.role != null ||
    profile.full_name != null ||
    profile.school_id != null ||
    profile.school_name != null ||
    profile.district != null ||
    profile.province != null ||
    profile.verified_at != null ||
    profile.user_id != null
  );
  const hasRecognizedRole = !!normalizedRole && normalizedRole !== 'school';

  const status = profile?.status;

  if (status === 'verified' || status === 'approved') {
    return {
      isVerified: true,
      isPending: false,
      isRejected: false,
      rejectionReason: null,
      verifiedAt: profile?.verified_at || null,
      canAccessDashboard: true,
      needsSetup: false,
    };
  }

  if (status === 'pending_verification' || status === 'pending') {
    return {
      isVerified: false,
      isPending: true,
      isRejected: false,
      rejectionReason: null,
      verifiedAt: profile?.verified_at || null,
      canAccessDashboard: false,
      needsSetup: false,
    };
  }

  if (status === 'rejected' || status === 'denied') {
    return {
      isVerified: false,
      isPending: false,
      isRejected: true,
      rejectionReason: profile?.rejection_reason || null,
      verifiedAt: profile?.verified_at || null,
      canAccessDashboard: false,
      needsSetup: false,
    };
  }

  if (hasExistingProfile || hasRecognizedRole) {
    return {
      isVerified: true,
      isPending: false,
      isRejected: false,
      rejectionReason: null,
      verifiedAt: profile?.verified_at || null,
      canAccessDashboard: true,
      needsSetup: false,
    };
  }

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

/**
 * Hook to check user's verification status.
 * Respects profileLoading to avoid false redirects.
 */
export function useVerification(): VerificationStatus {
  const { profile, role, isDemoMode, profileLoading } = useAuth();
  return getVerificationStatus(profile, role, isDemoMode, profileLoading);
}
