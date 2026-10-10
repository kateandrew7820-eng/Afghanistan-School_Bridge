import { describe, expect, it } from 'vitest';
import { parseAcademicRollup } from '@/lib/academicRollup';

describe('parseAcademicRollup', () => {
  it('parses RPC summary and comparison groups', () => {
    const result = parseAcademicRollup({
      academicYear: '1404',
      years: ['1404', '1403'],
      subjects: ['ریاضی'],
      summary: {
        totalSchools: 12,
        reportingSchools: 9,
        students: 420,
        maleStudents: 230,
        femaleStudents: 190,
        attendanceRate: 87.5,
        previousAttendanceRate: 91,
        averageScore: 72.25,
        assessmentCount: 24,
        decliningSchools: 2,
      },
      groups: [{
        id: 'district-id',
        label: 'ولسوالی نمونه',
        totalSchools: 4,
        reportingSchools: 3,
        students: 100,
        maleStudents: 55,
        femaleStudents: 45,
        attendanceRate: 88,
        previousAttendanceRate: 90,
        averageScore: 70,
        assessmentCount: 8,
        decliningSchools: 1,
      }],
    });

    expect(result.summary.reportingSchools).toBe(9);
    expect(result.summary.attendanceRate).toBe(87.5);
    expect(result.groups[0]).toMatchObject({
      id: 'district-id',
      label: 'ولسوالی نمونه',
      totalSchools: 4,
      decliningSchools: 1,
    });
  });

  it('rejects malformed RPC payloads instead of rendering success-shaped defaults', () => {
    expect(() => parseAcademicRollup({ summary: null, groups: [] })).toThrow('پاسخ داشبورد تحصیلی معتبر نیست.');
  });
});
