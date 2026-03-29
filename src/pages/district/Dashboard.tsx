import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  School, CheckCircle2, Clock, Eye, Loader2
} from "lucide-react";
import { format } from "date-fns";

type Status = "pending" | "approved" | "rejected";

interface Submission {
  id: string;
  school_name: string;
  type: string;
  status: Status;
  created_at: string;
}

export default function DistrictDashboard() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    schools: 0,
    total: 0,
    pending: 0,
    approved: 0,
  });

  const [recent, setRecent] = useState<Submission[]>([]);

  useEffect(() => {
    if (profile?.district) fetchData();
  }, [profile]);

  async function fetchData() {
    setLoading(true);

    try {
      const district = profile?.district;

      // ✅ 1. Schools count (filtered)
      const { count: schoolCount } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true })
        .eq("district", district);

      // ✅ 2. Optimized fetch (filtered + limited)
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

      const normalize = (data: any[], type: string): Submission[] =>
        (data || []).map((item) => ({
          id: item.id,
          school_name: item.schools?.name || "نامعلوم",
          type,
          status: normalizeStatus(item.status),
          created_at: item.created_at,
        }));

      const all = [
        ...normalize(statsRes.data, "آمار"),
        ...normalize(reportsRes.data, "گزارش"),
        ...normalize(formsRes.data, "فورم"),
      ];

      const pending = all.filter((s) => s.status === "pending").length;
      const approved = all.filter((s) => s.status === "approved").length;

      setStats({
        schools: schoolCount || 0,
        total: all.length,
        pending,
        approved,
      });

      setRecent(
        all
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
          .slice(0, 6) // clean limit
      );

    } finally {
      setLoading(false);
    }
  }

  function normalizeStatus(status: string): Status {
    if (["approved", "تأیید شده"].includes(status)) return "approved";
    if (["rejected", "رد شده"].includes(status)) return "rejected";
    return "pending";
  }

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

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">

        <StatCard title="مکاتب" value={stats.schools} loading={loading} tone="blue" />
        <StatCard title="کل ارسال‌ها" value={stats.total} loading={loading} tone="purple" />
        <StatCard title="تایید شده" value={stats.approved} loading={loading} tone="green" />
        <StatCard title="در انتظار" value={stats.pending} loading={loading} tone="yellow" />

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
                  className="flex justify-between items-center p-3 rounded-xl border bg-white dark:bg-gray-900 hover:bg-gray-50 transition"
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

function StatCard({ title, value, loading, tone }: any) {
  const tones: any = {
    blue: "bg-white text-gray-900 border-gray-100",
    purple: "bg-white text-gray-900 border-gray-100",
    green: "bg-white text-gray-900 border-gray-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
  };
  
  return (
    <Card className="hover:scale-[1.02] transition shadow-sm border-none">
      <CardHeader className="flex flex-row justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${tones[tone]}`}>
          <School className="w-4 h-4" />
        </div>
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