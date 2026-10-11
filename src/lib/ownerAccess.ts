export type OwnerRoleSelection = 'teacher' | 'principal' | 'district_admin' | 'province_admin' | 'ministry_admin';

export function getOwnerRoleRoute(role: OwnerRoleSelection): string {
  switch (role) {
    case 'teacher':
    case 'principal':
      return '/school';
    case 'district_admin':
      return '/district';
    case 'province_admin':
      return '/province';
    case 'ministry_admin':
      return '/ministry';
    default:
      return '/school';
  }
}
