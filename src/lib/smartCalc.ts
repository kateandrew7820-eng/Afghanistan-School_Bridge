/**
 * Smart derivations for statistics forms.
 * Small, pure helpers — safe to call on every keystroke.
 */

export function toInt(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'string' ? parseInt(v.replace(/[^\d]/g, ''), 10) : v;
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function toFloat(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export interface StudentTotals {
  male: number;
  female: number;
  teachers: number;
  total: number;
}

export interface DerivedStats {
  autoTotal: number;
  studentsPerTeacher: number | null;
  femalePercent: number | null;
  malePercent: number | null;
  isOvercrowded: boolean;   // > 40 per teacher
  totalMismatch: boolean;   // typed total != male+female
}

export function deriveStats(t: StudentTotals): DerivedStats {
  const autoTotal = t.male + t.female;
  const total = t.total > 0 ? t.total : autoTotal;
  const spt = t.teachers > 0 ? total / t.teachers : null;
  const femalePercent = total > 0 ? (t.female / total) * 100 : null;
  const malePercent = total > 0 ? (t.male / total) * 100 : null;
  return {
    autoTotal,
    studentsPerTeacher: spt,
    femalePercent,
    malePercent,
    isOvercrowded: spt != null && spt > 40,
    totalMismatch: t.total > 0 && autoTotal > 0 && t.total !== autoTotal,
  };
}

const PERSIAN_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
export function toPersianDigits(v: number | string): string {
  return String(v).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);
}
