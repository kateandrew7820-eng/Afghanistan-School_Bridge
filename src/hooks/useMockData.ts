/**
 * Hook to provide mock data for demo mode
 * Dashboards can use this to show sample data when testing without real database
 */

import { useAuth } from '@/contexts/AuthContext';
import {
  mockAnnouncements,
  mockDeadlines,
  mockStudentStats,
  mockSubmissions,
  mockReports,
  mockDocuments,
  mockDistrictStats,
  mockProvinceStats,
  mockMinistryStats,
} from '@/lib/mockData';

export function useMockData() {
  const { isDemoMode } = useAuth();

  return {
    isDemoMode,
    announcements: mockAnnouncements,
    deadlines: mockDeadlines,
    studentStats: mockStudentStats,
    submissions: mockSubmissions,
    reports: mockReports,
    documents: mockDocuments,
    districtStats: mockDistrictStats,
    provinceStats: mockProvinceStats,
    ministryStats: mockMinistryStats,
  };
}
