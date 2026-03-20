/**
 * Verification Hierarchy System
 * 
 * Defines who can approve whom based on the education system structure:
 * Student → approved by Teacher
 * Teacher → approved by Principal
 * Principal → approved by District Admin
 * District Admin → approved by Province Admin
 * Province Admin → approved by Ministry Admin (Kabul)
 */

export type Role = 
  | 'student'
  | 'teacher'
  | 'principal'
  | 'district_admin'
  | 'province_admin'
  | 'ministry_admin';

export type ApprovalRole = 'teacher' | 'principal' | 'district_admin' | 'province_admin' | 'ministry_admin';

/**
 * Get the role(s) that can approve a given role
 * @param role The role being verified
 * @returns The role(s) that can approve this role, or null if self-approved/no approval needed
 */
export function getApprovingRole(role: Role | string): ApprovalRole | null {
  const approvalMap: Record<string, ApprovalRole> = {
    'student': 'teacher',
    'teacher': 'principal',
    'principal': 'district_admin',
    'district_admin': 'province_admin',
    'province_admin': 'ministry_admin',
    'ministry_admin': 'ministry_admin', // Self-approval for ministry admin
  };

  return approvalMap[role as Role] || null;
}

/**
 * Check if an admin can approve a pending user based on hierarchy
 * @param adminRole The role of the person doing the approving
 * @param pendingUserRole The role of the pending user
 * @returns true if adminRole can approve pendingUserRole
 */
export function canApprove(adminRole: string, pendingUserRole: string): boolean {
  const requiredRole = getApprovingRole(pendingUserRole);
  return requiredRole === adminRole;
}

/**
 * Get the approval queue filter for a given admin role
 * Determines which roles this admin should see in their verification queue
 * 
 * @param adminRole The role of the admin
 * @returns Filter object with role to check, or null if admin doesn't verify anyone
 */
export function getVerificationQueueFilter(adminRole: string): string | null {
  const filterMap: Record<string, string> = {
    'teacher': 'student',
    'principal': 'teacher',
    'district_admin': 'principal',
    'province_admin': 'district_admin',
    'ministry_admin': 'province_admin',
  };

  return filterMap[adminRole] || null;
}

/**
 * Get human-readable approval instruction for a pending user
 * @param role The pending user's role
 * @returns Human-readable message about who should approve them
 */
export function getApprovalInstruction(role: string, language: 'en' | 'fa' = 'fa'): string {
  const instructions: Record<string, Record<'en' | 'fa', string>> = {
    'student': {
      'en': 'Your account is pending approval from a Teacher.',
      'fa': 'حساب شما منتظر تصویب معلم است.'
    },
    'teacher': {
      'en': 'Your account is pending approval from a Principal.',
      'fa': 'حساب شما منتظر تصویب مدیر مکتب است.'
    },
    'principal': {
      'en': 'Your account is pending approval from a District Admin.',
      'fa': 'حساب شما منتظر تصویب اداره تعلیم و تربیه ولسوالی است.'
    },
    'district_admin': {
      'en': 'Your account is pending approval from a Province Admin.',
      'fa': 'حساب شما منتظر تصویب اداره تعلیم و تربیه ولایت است.'
    },
    'province_admin': {
      'en': 'Your account is pending approval from Ministry Admin (Kabul).',
      'fa': 'حساب شما منتظر تصویب وزارت تعلیم است.'
    },
    'ministry_admin': {
      'en': 'Your account is active.',
      'fa': 'حساب شما فعال است.'
    }
  };

  return instructions[role]?.[language] || instructions['student'][language];
}

/**
 * Get the friendly name for a role
 */
export function getRoleLabel(role: string, language: 'en' | 'fa' = 'fa'): string {
  const labels: Record<string, Record<'en' | 'fa', string>> = {
    'student': { 'en': 'Student', 'fa': 'شاگرد' },
    'teacher': { 'en': 'Teacher', 'fa': 'معلم' },
    'principal': { 'en': 'School Principal', 'fa': 'رئیسمدیر مکتب' },
    'district_admin': { 'en': 'District Admin', 'fa': 'رئیس معارف' },
    'province_admin': { 'en': 'Province Admin', 'fa': 'رئیس معارف ولایت' },
    'ministry_admin': { 'en': 'Ministry Admin', 'fa': 'وزیر معارف' },
  };

  return labels[role]?.[language] || role;
}

/**
 * Get the hierarchy level of a role (for sorting/display)
 * Higher number = higher in hierarchy
 */
export function getHierarchyLevel(role: string): number {
  const levels: Record<string, number> = {
    'student': 1,
    'teacher': 2,
    'principal': 3,
    'district_admin': 4,
    'province_admin': 5,
    'ministry_admin': 6,
  };

  return levels[role] || 0;
}
