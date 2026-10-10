import type { Json } from '@/integrations/supabase/types';

export type RollupLevel = 'district' | 'province' | 'ministry';

export interface RollupSummary {
  totalSchools: number;
  reportingSchools: number;
  students: number;
  maleStudents: number;
  femaleStudents: number;
  attendanceRate: number | null;
  previousAttendanceRate: number | null;
  averageScore: number | null;
  assessmentCount: number;
  decliningSchools: number;
}

export interface RollupGroup extends RollupSummary {
  id: string;
  label: string;
}

export interface AcademicRollup {
  academicYear: string | null;
  years: string[];
  subjects: string[];
  summary: RollupSummary;
  groups: RollupGroup[];
}

function isRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function countMetric(record: { [key: string]: Json | undefined }, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid academic rollup metric: ${key}`);
  }
  return value;
}

function nullableMetric(record: { [key: string]: Json | undefined }, key: string): number | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid academic rollup metric: ${key}`);
  }
  return value;
}

function textMetric(record: { [key: string]: Json | undefined }, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new Error(`Invalid academic rollup field: ${key}`);
  return value;
}

function nullableTextMetric(record: { [key: string]: Json | undefined }, key: string): string | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== 'string') throw new Error(`Invalid academic rollup field: ${key}`);
  return value;
}

function parseSummary(record: { [key: string]: Json | undefined }): RollupSummary {
  return {
    totalSchools: countMetric(record, 'totalSchools'),
    reportingSchools: countMetric(record, 'reportingSchools'),
    students: countMetric(record, 'students'),
    maleStudents: countMetric(record, 'maleStudents'),
    femaleStudents: countMetric(record, 'femaleStudents'),
    attendanceRate: nullableMetric(record, 'attendanceRate'),
    previousAttendanceRate: nullableMetric(record, 'previousAttendanceRate'),
    averageScore: nullableMetric(record, 'averageScore'),
    assessmentCount: countMetric(record, 'assessmentCount'),
    decliningSchools: countMetric(record, 'decliningSchools'),
  };
}

export function parseAcademicRollup(value: Json): AcademicRollup {
  if (!isRecord(value) || !isRecord(value.summary) || !Array.isArray(value.groups)) {
    throw new Error('پاسخ داشبورد تحصیلی معتبر نیست.');
  }
  if (
    !Array.isArray(value.years)
    || !value.years.every((year): year is string => typeof year === 'string')
    || !Array.isArray(value.subjects)
    || !value.subjects.every((subject): subject is string => typeof subject === 'string')
  ) {
    throw new Error('فهرست فیلترهای داشبورد تحصیلی معتبر نیست.');
  }
  const groups = value.groups.map((item): RollupGroup => {
    if (!isRecord(item)) throw new Error('گروه مقایسه‌ای پاسخ داشبورد معتبر نیست.');
    return {
      id: textMetric(item, 'id'),
      label: textMetric(item, 'label'),
      ...parseSummary(item),
    };
  });

  return {
    academicYear: nullableTextMetric(value, 'academicYear'),
    years: value.years,
    subjects: value.subjects,
    summary: parseSummary(value.summary),
    groups,
  };
}
