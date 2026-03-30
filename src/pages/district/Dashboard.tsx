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

      /* ---------------- Schools COUNT ---------------- */
      const { count: schoolCount, error: schoolError } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true })
        .eq("district", district);

      if (schoolError) throw schoolError;

      /* ---------------- Base Query Factory ---------------- */
      const baseQuery = (table: string) =>
        supabase
          .from(table)
          .select("id,status,created_at,school_id,schools(name)")
          .eq("schools.district", district)
          .limit(20);

      const [statsRes, reportsRes, formsRes] = await Promise.all([
        baseQuery("statistics_submissions"),
        baseQuery("report_submissions"),
        baseQuery("form_submissions"),
      ]);

      if (statsRes.error || reportsRes.error || formsRes.error) {
        throw statsRes.error || reportsRes.error || formsRes.error;
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
        ...normalize(statsRes.data || [], "آمار"),
        ...normalize(reportsRes.data || [], "گزارش"),
        ...normalize(formsRes.data || [], "فورم"),
      ];

      /* ---------------- SINGLE PASS STATS ---------------- */
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

      /* ---------------- RECENT ---------------- */
      const sorted = all
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 6);

      setRecent(sorted);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError("خطا در بارگذاری داده‌ها");
    } finally {
      setLoading(false);
    }
  }, [profile?.district]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          داشبورد ناحیه
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile?.district} — مدیریت هوشمند ارسال‌ها
        </p>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard title="مکاتب" value={stats.schools} loading={loading} />
        <StatCard title="کل ارسال‌ها" value={stats.total} loading={loading} />
        <StatCard title="تایید شده" value={stats.approved} loading={loading} />
        <StatCard title="در انتظار" value={stats.pending} loading={loading} />
      </div>

      {/* ACTION */}
      <Link to="/district/submissions">
        <Card className="cursor-pointer hover:shadow-md transition border-dashed">
          <CardContent className="flex justify-between items-center p-4">
            <span className="font-medium">مشاهده همه ارسال‌ها</span>
            <Eye className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* RECENT */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>آخرین فعالیت‌ها</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              هنوز هیچ ارسالی ثبت نشده
            </p>
          ) : (
            <div className="space-y-3">
              {recent.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center p-3 rounded-xl border bg-white hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium text-sm">{s.school_name}</p>
                    <p className="text-xs text-muted-foreground">{s.type}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "d MMM")}
                    </span>
                  </div>
                </div>
              ))}

              <Button asChild variant="outline" className="w-full mt-3">
                <Link to="/district/submissions">مشاهده کامل</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

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
    <Card className="hover:scale-[1.02] transition shadow-sm border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">
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

function StatusBadge({ status }: { status: Status }) {
  const map = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
  };

  const label = {
    approved: "تایید",
    pending: "در انتظار",
    rejected: "رد",
  };

  return (
    <Badge className={`${map[status]} border-none`}>
      {label[status]}
    </Badge>
  );
}

/* ---------------- HELPERS ---------------- */

function normalizeStatus(status: string): Status {
  if (["approved", "تأیید شده"].includes(status)) return "approved";
  if (["rejected", "رد شده"].includes(status)) return "rejected";
  return "pending";
}
