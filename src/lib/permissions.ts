import { UserRole } from '@/lib/supabase';

export interface RolePermissions {
  canSubmitStatistics: boolean;
  canSubmitReports: boolean;
  canSubmitForms: boolean;
  canApproveSubmissions: boolean;
  canRejectSubmissions: boolean;
  canViewAnalytics: boolean;
  canViewAllSubmissions: boolean;
  canApproveVerification: boolean;
  canManageSchools: boolean;
  canSendAnnouncements: boolean;
  canSetفرصت‌‌ها: boolean;
  canViewNationalStats: boolean;
  canExportReports: boolean;
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: UserRole | null): RolePermissions {
  const basePermissions: RolePermissions = {
    canSubmitStatistics: false,
    canSubmitReports: false,
    canSubmitForms: false,
    canApproveSubmissions: false,
    canRejectSubmissions: false,
    canViewAnalytics: false,
    canViewAllSubmissions: false,
    canApproveVerification: false,
    canManageSchools: false,
    canSendAnnouncements: false,
    canSetفرصت‌‌ها: false,
    canViewNationalStats: false,
    canExportReports: false,
  };

  if (!role) return basePermissions;

  switch (role) {
    case 'school':
    case 'teacher':
    case 'principal':
      return {
        ...basePermissions,
        canSubmitStatistics: role === 'principal',
        canSubmitReports: true,
        canSubmitForms: true,
        canViewAnalytics: role === 'principal',
      };

    case 'district_admin':
      return {
        ...basePermissions,
        canApproveSubmissions: true,
        canRejectSubmissions: true,
        canViewAnalytics: true,
        canViewAllSubmissions: true,
        canSendAnnouncements: true,
        canSetفرصت‌‌ها: true,
        canExportReports: true,
      };

    case 'province_admin':
      return {
        ...basePermissions,
        canApproveSubmissions: true,
        canRejectSubmissions: true,
        canViewAnalytics: true,
        canViewAllSubmissions: true,
        canViewNationalStats: true,
        canApproveVerification: true,
        canSendAnnouncements: true,
        canSetفرصت‌‌ها: true,
        canExportReports: true,
      };

    case 'ministry_admin':
    case 'admin':
      return {
        ...basePermissions,
        canSubmitStatistics: true,
        canSubmitReports: true,
        canSubmitForms: true,
        canApproveSubmissions: true,
        canRejectSubmissions: true,
        canViewAnalytics: true,
        canViewAllSubmissions: true,
        canApproveVerification: true,
        canManageSchools: true,
        canSendAnnouncements: true,
        canSetفرصت‌‌ها: true,
        canViewNationalStats: true,
        canExportReports: true,
      };

    default:
      return basePermissions;
  }
}

/**
 * Check if a specific action is allowed for a role
 */
export function canPerformAction(
  role: UserRole | null,
  action: keyof RolePermissions
): boolean {
  const permissions = getRolePermissions(role);
  return permissions[action];
}

/**
 * Get role-specific dashboard route
 */
export function getRoleDashboardRoute(role: UserRole | null): string {
  switch (role) {
    case 'school':
    case 'teacher':
    case 'principal':
      return '/school';
    case 'district_admin':
      return '/district';
    case 'province_admin':
      return '/province';
    case 'ministry_admin':
    case 'admin':
      return '/ministry';
    default:
      return '/';
  }
}

/**
 * Get role-specific submission approval view
 */
export function getApprovalViewRoute(role: UserRole | null): string {
  switch (role) {
    case 'district_admin':
      return '/admin/submissions?view=district';
    case 'province_admin':
      return '/admin/submissions?view=province';
    case 'ministry_admin':
    case 'admin':
      return '/admin/submissions?view=national';
    default:
      return '/admin/submissions';
  }
}

/**
 * Formatrole name in Persian
 */
export function getRoleLabelFA(role: UserRole | null): string {
  switch (role) {
    case 'principal':
      return 'مدیر مکتب';
    case 'teacher':
      return 'معلم';
    case 'school':
      return 'کاربر مکتب';
    case 'district_admin':
      return 'مدیر ولسوالی';
    case 'province_admin':
      return 'مدیر ولایت';
    case 'ministry_admin':
    case 'admin':
      return 'مدیر وزارت';
    default:
      return 'کاربر';
  }
}
