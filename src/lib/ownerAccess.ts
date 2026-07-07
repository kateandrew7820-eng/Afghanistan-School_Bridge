export const OWNER_EMAIL = 'masoudsalik2024@gmail.com';
export const OWNER_PASSWORD = 'KfR94hZkAE4edz$3';

export type OwnerRoleSelection = 'teacher' | 'principal' | 'district_admin' | 'province_admin' | 'ministry_admin';

const OFFICIAL_ROLE_ROUTES: Record<string, string> = {
  'salikmasoud1@gmail.com': '/school',
  'kateandrew78.20@gmail.com': '/school',
  'salikmasoud621@gmail.com': '/district',
  'zahrasalik87@gmail.com': '/province',
  'manotofaza@gmail.com': '/ministry',
};

export function isOwnerCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase() && password === OWNER_PASSWORD;
}

export function isOwnerBypassMode(email?: string | null, password?: string | null): boolean {
  return !!email && !!password && isOwnerCredentials(email, password);
}

export function getRoleRouteFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return OFFICIAL_ROLE_ROUTES[email.trim().toLowerCase()] ?? null;
}

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
