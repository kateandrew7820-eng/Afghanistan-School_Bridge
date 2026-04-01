import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type SubmissionType = 'statistics' | 'report' | 'form';

export interface Submission {
  id: string;
  type: SubmissionType;
  status: SubmissionStatus;
  created_at: string;
  school_id: string;
  province: string | null;
  district: string | null;
}

export interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface SubmissionsData {
  submissions: Submission[];
  stats: SubmissionStats;
  schoolCount: number;
  totalStudents: number;
  totalTeachers: number;
}

interface UseSubmissionsOptions {
  province?: string | null;
  district?: string | null;
  enabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  STATUS NORMALIZER (single source of truth)                         */
/* ------------------------------------------------------------------ */

function normalizeStatus(raw: string | null): SubmissionStatus {
  if (!raw) return 'pending';
  if (raw === 'approved') return 'approved';
  if (raw === 'rejected') return 'rejected';
  return 'pending';
}

/* ------------------------------------------------------------------ */
/*  QUERY KEY                                                          */
/* ------------------------------------------------------------------ */

function queryKey(opts: UseSubmissionsOptions) {
  return ['submissions', opts.province ?? 'all', opts.district ?? 'all'] as const;
}

/* ------------------------------------------------------------------ */
/*  FETCHER                                                            */
/* ------------------------------------------------------------------ */

async function fetchSubmissions(opts: UseSubmissionsOptions): Promise<SubmissionsData> {
  const { province, district } = opts;

  // ---------- schools count ----------
  let schoolsQuery = supabase.from('schools').select('id, province, district', { count: 'exact', head: true });
  if (province) schoolsQuery = schoolsQuery.eq('province', province);
  if (district) schoolsQuery = schoolsQuery.eq('district', district);
  const { count: schoolCount } = await schoolsQuery;

  // ---------- stats submissions (has student/teacher numbers) ----------
  let statsQ = supabase.from('statistics_submissions').select('id, status, created_at, school_id, province, district, total_students, total_teachers');
  if (province) statsQ = statsQ.eq('province', province);
  if (district) statsQ = statsQ.eq('district', district);

  let reportsQ = supabase.from('report_submissions').select('id, status, created_at, school_id, province, district');
  if (province) reportsQ = reportsQ.eq('province', province);
  if (district) reportsQ = reportsQ.eq('district', district);

  let formsQ = supabase.from('form_submissions').select('id, status, created_at, school_id, province, district');
  if (province) formsQ = formsQ.eq('province', province);
  if (district) formsQ = formsQ.eq('district', district);

  const [statsRes, reportsRes, formsRes] = await Promise.all([statsQ, reportsQ, formsQ]);

  if (statsRes.error) throw statsRes.error;
  if (reportsRes.error) throw reportsRes.error;
  if (formsRes.error) throw formsRes.error;

  const statsData = statsRes.data ?? [];
  const reportsData = reportsRes.data ?? [];
  const formsData = formsRes.data ?? [];

  // ---------- normalize into unified list ----------
  const submissions: Submission[] = [
    ...statsData.map((s) => ({
      id: s.id,
      type: 'statistics' as const,
      status: normalizeStatus(s.status),
      created_at: s.created_at,
      school_id: s.school_id,
      province: s.province,
      district: s.district,
    })),
    ...reportsData.map((r) => ({
      id: r.id,
      type: 'report' as const,
      status: normalizeStatus(r.status),
      created_at: r.created_at,
      school_id: r.school_id,
      province: r.province,
      district: r.district,
    })),
    ...formsData.map((f) => ({
      id: f.id,
      type: 'form' as const,
      status: normalizeStatus(f.status),
      created_at: f.created_at,
      school_id: f.school_id,
      province: f.province,
      district: f.district,
    })),
  ];

  // ---------- single-pass aggregation ----------
  let pending = 0, approved = 0, rejected = 0;
  for (const s of submissions) {
    if (s.status === 'pending') pending++;
    else if (s.status === 'approved') approved++;
    else rejected++;
  }

  const totalStudents = statsData.reduce((sum, s) => sum + (s.total_students ?? 0), 0);
  const totalTeachers = statsData.reduce((sum, s) => sum + (s.total_teachers ?? 0), 0);

  // sort by date desc
  submissions.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  return {
    submissions,
    stats: { total: submissions.length, pending, approved, rejected },
    schoolCount: schoolCount ?? 0,
    totalStudents,
    totalTeachers,
  };
}

/* ------------------------------------------------------------------ */
/*  HOOK                                                               */
/* ------------------------------------------------------------------ */

export function useSubmissions(opts: UseSubmissionsOptions = {}) {
  const queryClient = useQueryClient();
  const key = queryKey(opts);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchSubmissions(opts),
    enabled: opts.enabled !== false,
    staleTime: 30_000, // 30s cache
    refetchOnWindowFocus: false,
  });

  // ---------- realtime subscription ----------
  useEffect(() => {
    const tables = ['statistics_submissions', 'report_submissions', 'form_submissions'] as const;

    const channel = supabase
      .channel(`submissions-${opts.province ?? 'all'}-${opts.district ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tables[0] }, () => queryClient.invalidateQueries({ queryKey: key }))
      .on('postgres_changes', { event: '*', schema: 'public', table: tables[1] }, () => queryClient.invalidateQueries({ queryKey: key }))
      .on('postgres_changes', { event: '*', schema: 'public', table: tables[2] }, () => queryClient.invalidateQueries({ queryKey: key }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [opts.province, opts.district, queryClient]);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
