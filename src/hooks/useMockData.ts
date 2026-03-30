/**
 * Hook to provide mock data for demo mode
 * Dashboards can use this to show sample data when testing without real database
 */

import { useAuth } from '@/contexts/AuthContext';
import {
  mockAnnouncements,
  mockفرصت‌‌ها,
  mockStudentStats,
  mockSubmissions,
  mockReports,
  mockاسناد,
  mockDistrictStats,
  mockProvinceStats,
  mockMinistryStats,
} from '@/lib/mockData';

export function useMockData() {
  const { isDemoMode } = useAuth();

  return {
    isDemoMode,
    اعلانات: mockAnnouncements,
    فرصت‌‌ها: mockفرصت‌‌ها,
    studentStats: mockStudentStats,
    submissions: mockSubmissions,
    reports: mockReports,
    اسناد: mockاسناد,
    districtStats: mockDistrictStats,
    provinceStats: mockProvinceStats,
    ministryStats: mockMinistryStats,
  };
}
