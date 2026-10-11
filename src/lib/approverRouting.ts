// Client-side approver labels; recipient routing is handled by the approval function.

export type ApproverRoute = {
  label: string;
};

export const APPROVER_ROUTING: Record<string, ApproverRoute> = {
  student: { label: 'مدیر مکتب' },
  teacher: { label: 'مدیر مکتب' },
  principal: { label: 'رئیس معارف ولسوالی' },
  district_admin: { label: 'رئیس معارف ولایت' },
  province_admin: { label: 'مدیر ملی' },
  admin: { label: 'وزیر معارف' },
  ministry_admin: { label: 'وزیر معارف' },
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
