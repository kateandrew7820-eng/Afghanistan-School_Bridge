/**
 * ============================================================
 * 🚧 TEMPORARY TEST MODE CONFIGURATION
 * ============================================================
 * 
 * This file contains temporary testing overrides that bypass
 * the normal hierarchical approval chain.
 * 
 * WHEN READY FOR PRODUCTION:
 * 1. Set TEMPORARY_TEST_MODE = false
 * 2. The original hierarchy in verificationHierarchy.ts will take over
 * 3. No other code changes needed
 * ============================================================
 */

// ⚠️ TEMPORARY TEST MODE FLAG
// Set to false to restore normal hierarchical approval
export const TEMPORARY_TEST_MODE = false;

// Global confirmer email removed for production.
// Approval flow now uses the hierarchical chain in verificationHierarchy.ts
export const GLOBAL_CONFIRMER_EMAIL = '';

// Pending status expiry in hours
export const PENDING_EXPIRY_HOURS = 24;

// Role hierarchy labels (Dari) - used for "waiting for [one level higher]" message
export const ROLE_HIERARCHY_LABELS: Record<string, string> = {
  'student': 'معلم',           // Teacher approves Student
  'teacher': 'مدیر مکتب',      // Principal approves Teacher
  'principal': 'رئیس معارف ولسوالی', // District Admin approves Principal
  'district_admin': 'رئیس معارف', // Province Admin approves District Admin
  'province_admin': 'وزارت معارف',     // Ministry approves Province Admin
  'ministry_admin': 'وزارت معارف',     // Self-approved
};

// Dashboard routes by role
export const DASHBOARD_ROUTES: Record<string, string> = {
  'student': '/school',
  'teacher': '/school',
  'principal': '/school',
  'district_admin': '/district',
  'province_admin': '/province',
  'ministry_admin': '/ministry',
};

/**
 * Get the "one level higher" label for a role
 */
export function getApproverLabel(role: string): string {
  return ROLE_HIERARCHY_LABELS[role] || 'مدیر';
}

/**
 * Get the dashboard route for a role
 */
export function getDashboardRouteForRole(role: string): string {
  return DASHBOARD_ROUTES[role] || '/school';
}

/**
 * Check if a pending profile has expired (24 hours)
 */
export function isPendingExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffHours >= PENDING_EXPIRY_HOURS;
}
