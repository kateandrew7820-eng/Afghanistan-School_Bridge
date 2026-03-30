import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LocalizationContext";
import { supabase } from "@/lib/supabase";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Map,
  School,
  Users,
  BarChart3,
  TrendingUp,
  Download,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

interface NationalStats {
  provinces: number;
  schools: number;
  students: number;
  teachers: number;
  submissions: number;
  submissionsThisMonth: number;
  completionRate: number;
  teacherStudentRatio: number;
}

/* ---------------- PAGE ---------------- */

export default function MinistryDashboard() {
  const { profile, isDemoMode } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<NationalStats>({
    provinces: 0,
    schools: 0,
    students: 0,
    teachers: 0,
    submissions: 0,
    submissionsThisMonth: 0,
    completionRate: 0,
    teacherStudentRatio: 0,
  });

  /* ---------------- FETCH ---------------- */

  const fetchNationalData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isDemoMode) {
        setStats({
          provinces: 34,
          schools: 1200,
          students: 925000,
          teachers: 26000,
          submissions: 4800,
          submissionsThisMonth: 2900,
          completionRate: 78,
          teacherStudentRatio: 36,
        });
        setLoading(false);
        return;
      }

      const [schoolsRes, statsRes, reportsRes, formsRes] =
        await Promise.all([
          supabase.from("schools").select("id, province"),
          supabase
            .from("statistics_submissions")
            .select("id, total_students, total_teachers, created_at"),
          supabase.from("report_submissions").select("id, created_at"),
          supabase.from("form_submissions").select("id, created_at"),
        ]);

      if (schoolsRes.error || statsRes.error || reportsRes.error || formsRes.error) {
        throw new Error("Failed to fetch national data");
      }

      const schools = schoolsRes.data || [];
      const statsSubmissions = statsRes.data || [];
      const reports = reportsRes.data || [];
      const forms = formsRes.data || [];

      /* ---------------- CORE METRICS ---------------- */

      const provinces = new Set(schools.map((s) => s.province)).size;

      const totalStudents = statsSubmissions.reduce(
        (sum, s) => sum + (s.total_students || 0),
        0
      );

      const totalTeachers = statsSubmissions.reduce(
        (sum, s) => sum + (s.total_teachers || 0),
        0
      );

      const submissions = statsSubmissions.length + reports.length + forms.length;

      /* ---------------- TIME FILTER (optimized) ---------------- */

      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      const isThisMonth = (d: string) => {
        const date = new Date(d);
        return date.getMonth() === month && date.getFullYear() === year;
      };

      const submissionsThisMonth =
        [...statsSubmissions, ...reports, ...forms].filter((s) =>
          isThisMonth(s.created_at)
        ).length;

      /* ---------------- FINAL STATS ---------------- */

      const completionRate =
        submissions > 0
          ? Math.round((submissionsThisMonth / submissions) * 100)
          : 0;

      const teacherStudentRatio =
        totalTeachers > 0
          ? Math.round(totalStudents / totalTeachers)
          : 0;

      setStats({
        provinces,
        schools: schools.length,
        students: totalStudents,
        teachers: totalTeachers,
        submissions,
        submissionsThisMonth,
        completionRate,
        teacherStudentRatio,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load national dashboard data");
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchNationalData();
  }, [fetchNationalData]);

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-white text-gray-900 px-5 py-6 space-y-8">

      {/* HEADER */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {t("ministry.dashboard")}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {t("ministry.nationalDesc")}
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-pulse">
          {error}
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <KpiCard title="Provinces" value={stats.provinces} icon={<Map />} loading={loading} />
        <KpiCard title="Schools" value={stats.schools} icon={<School />} loading={loading} />
        <KpiCard title="Students" value={Math.round(stats.students / 1000)} suffix="K" icon={<Users />} loading={loading} />
        <KpiCard title="Teachers" value={Math.round(stats.teachers / 1000)} suffix="K" icon={<BarChart3 />} loading={loading} />

      </div>

      {/* SECOND KPI ROW */}
      <div className="grid gap-4 md:grid-cols-3">

        <KpiCard title="Total Submissions" value={stats.submissions} icon={<BarChart3 />} loading={loading} />

        <KpiCard
          title="This Month"
          value={stats.submissionsThisMonth}
          icon={<TrendingUp />}
          loading={loading}
          subtitle={`${stats.completionRate}% completion`}
        />

        <KpiCard
          title="Teacher Ratio"
          value={stats.teacherStudentRatio}
          icon={<Users />}
          loading={loading}
          subtitle="Students per teacher"
        />

      </div>

      {/* ACTIONS */}
      <div className="grid md:grid-cols-2 gap-4">

        <Link to="/ministry/submissions">
          <Card className="group cursor-pointer border border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="text-sm text-gray-800 group-hover:text-gray-900 transition">
                View All Submissions
              </CardTitle>
              <CheckCircle2 className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                National submission overview
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-gray-50 border border-gray-200 hover:shadow-md transition">
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm text-gray-800">
              National Analytics
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Aggregated insights across provinces
            </p>
          </CardContent>
        </Card>

      </div>

      {/* FOOTER ANALYTICS */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5" />
            Aggregated Insights
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              <InsightRow label="Avg Attendance Rate" value="82%" />
              <InsightRow label="Submission Completion" value={`${stats.completionRate}%`} />
              <InsightRow label="Active Provinces" value={`${stats.provinces}/34`} />
            </>
          )}

        </CardContent>
      </Card>

    </div>
  );
}

/* ---------------- KPI CARD ---------------- */

function KpiCard({
  title,
  value,
  icon,
  loading,
  subtitle,
  suffix = "",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  subtitle?: string;
  suffix?: string;
}) {
  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="flex flex-row justify-between pb-2">
        <CardTitle className="text-sm text-gray-600 font-medium">
          {title}
        </CardTitle>
        <div className="text-gray-500">{icon}</div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {loading ? "..." : `${value}${suffix}`}
        </div>

        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- INSIGHT ROW ---------------- */

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition">
      <span className="text-sm text-gray-700">{label}</span>
      <Badge className="bg-gray-100 text-gray-800 border border-gray-200">
        {value}
      </Badge>
    </div>
  );
}
