// Hierarchical approver routing.
// Each applicant role's approval email is sent to a preset head email address.

export type ApproverRoute = {
  email: string;
  label: string;
};

export const APPROVER_ROUTING: Record<string, ApproverRoute> = {
  student: { email: 'kateandrew78.20@gmail.com', label: 'مدیر مکتب' },
  teacher: { email: 'kateandrew78.20@gmail.com', label: 'مدیر مکتب' },
  principal: { email: 'salikmasoud621@gmail.com', label: 'رئیس معارف ولسوالی' },
  district_admin: { email: 'zahrasalik87@gmail.com', label: 'رئیس معارف ولایت' },
  province_admin: { email: 'manotofaza@gmail.com', label: 'مدیر ملی' },
  admin: { email: 'masoudsalik2024@gmail.com', label: 'وزیر معارف' },
  ministry_admin: { email: 'masoudsalik2024@gmail.com', label: 'مالک پلتفرم' },
};

export function getApproverRoute(role: string | null | undefined): ApproverRoute {
  if (!role) return APPROVER_ROUTING.teacher;
  return APPROVER_ROUTING[role] ?? APPROVER_ROUTING.teacher;
}

export const DASHBOARD_ROUTE_BY_ROLE: Record<string, string> = {
  student: '/school',
  teacher: '/school',
  principal: '/school',
  district_admin: '/district',
  province_admin: '/province',
  admin: '/ministry',
  ministry_admin: '/ministry',
};
