import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { School, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";

/* ---------------- TYPES ---------------- */

type Status = "pending" | "approved" | "rejected";

interface Submission {
  id: string;
  school_name: string;
  type: string;
  status: Status;
  created_at: string;
}

interface Stats {
  schools: number;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/* ---------------- PAGE ---------------- */

export default function DistrictDashboard() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>({
    schools: 0,
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [recent, setRecent] = useState<Submission[]>([]);

  const fetchData = useCallback(async () => {
    if (!profile?.district) return;

    setLoading(true);
    setError(null);

    try {
      const district = profile.district;

      /* ---------------- Schools ---------------- */
      const { count: schoolCount, error: schoolError } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true })
        .eq("district", district);

      if (schoolError) throw schoolError;

      /* ---------------- Submissions ---------------- */
      const baseQuery = (table: string) =>
        supabase
          .from(table)
          .select("id,status,created_at,school_id,schools(name)")
          .eq("schools.district", district)
          .limit(20);

      const [a, b, c] = await Promise.all([
        baseQuery("statistics_submissions"),
        baseQuery("report_submissions"),
        baseQuery("form_submissions"),
      ]);

      if (a.error || b.error || c.error) {
        throw a.error || b.error || c.error;
      }

      const normalize = (data: any[], type: string): Submission[] =>
        (data || []).map((item) => ({
          id: item.id,
          school_name: item.schools?.name || "نامعلوم",
          type,
          status: normalizeStatus(item.status),
          created_at: item.created_at,
        }));

      const all: Submission[] = [
        ...normalize(a.data || [], "آمار"),
        ...normalize(b.data || [], "گزارش"),
        ...normalize(c.data || [], "فورم"),
      ];

      /* ---------------- Stats (single pass) ---------------- */
      let pending = 0;
      let approved = 0;
      let rejected = 0;

      for (const s of all) {
        if (s.status === "pending") pending++;
        else if (s.status === "approved") approved++;
        else rejected++;
      }

      setStats({
        schools: schoolCount || 0,
        total: all.length,
        pending,
        approved,
        rejected,
      });

      /* ---------------- Recent ---------------- */
      setRecent(
        all
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
          .slice(0, 6)
      );

    } catch (err) {
      console.error(err);
      setError("Something went wrong while loading dashboard");
    } finally {
      setLoading(false);
    }
  }, [profile?.district]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-6 space-y-8">

      {/* HEADER */}
      <div className="animate-fade-in space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          District Dashboard
        </h1>
        <p className="text-gray-600 text-sm">
          {profile?.district} — Smart submission management system
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg animate-pulse">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard title="Schools" value={stats.schools} loading={loading} />
        <StatCard title="Total" value={stats.total} loading={loading} />
        <StatCard title="Approved" value={stats.approved} loading={loading} />
        <StatCard title="Pending" value={stats.pending} loading={loading} />
      </div>

      {/* ACTION CARD */}
      <Link to="/district/submissions">
        <Card className="group cursor-pointer border border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardContent className="flex justify-between items-center p-5">
            <span className="font-medium text-gray-800 group-hover:text-gray-900 transition">
              View All Submissions
            </span>
            <Eye className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition" />
          </CardContent>
        </Card>
      </Link>

      {/* RECENT */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Activity</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-gray-500" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No submissions yet
            </p>
          ) : (
            <div className="space-y-3">
              {recent.map((s, i) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {s.school_name}
                    </p>
                    <p className="text-xs text-gray-500">{s.type}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    <span className="text-xs text-gray-500">
                      {format(new Date(s.created_at), "d MMM")}
                    </span>
                  </div>
                </div>
              ))}

              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-gray-300 hover:bg-gray-100 transition-all duration-300"
              >
                <Link to="/district/submissions">See Full List</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- STAT CARD ---------------- */

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-600 font-medium">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {loading ? "..." : value}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- STATUS BADGE ---------------- */

function StatusBadge({ status }: { status: Status }) {
  const map = {
    approved: "bg-green-50 text-green-700 border border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    rejected: "bg-red-50 text-red-700 border border-red-200",
  };

  const label = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
  };

  return (
    <Badge className={`${map[status]} transition-all duration-200`}>
      {label[status]}
    </Badge>
  );
}

/* ---------------- STATUS NORMALIZER ---------------- */

function normalizeStatus(status: string): Status {
  if (["approved", "تأیید شده"].includes(status)) return "approved";
  if (["rejected", "رد شده"].includes(status)) return "rejected";
  return "pending";
}
