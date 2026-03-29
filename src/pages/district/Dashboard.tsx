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
  School, CheckCircle2, Clock, AlertCircle, Loader2, Eye
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
    try {
      setLoading(true);

      // Schools count
      const { count: schoolCount } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true })
        .eq("district", profile?.district);

      // Fetch all submissions
      const [statsRes, reportsRes, formsRes] = await Promise.all([
        supabase.from("statistics_submissions").select("id,status,created_at,schools(name)"),
        supabase.from("report_submissions").select("id,status,created_at,schools(name)"),
        supabase.from("form_submissions").select("id,status,created_at,schools(name)")
      ]);

      const normalize = (data: any[], type: string): Submission[] =>
        (data || []).map((item) => ({
          id: item.id,
          school_name: item.schools?.name || "نامعلوم",
          type,
          status: normalizeStatus(item.status),
          created_at: item.created_at,
        }));

      const all: Submission[] = [
        ...normalize(statsRes.data, "احصاییه"),
        ...normalize(reportsRes.data, "گزارش"),
        ...normalize(formsRes.data, "فورم"),
      ];

      const pending = all.filter(s => s.status === "pending").length;
      const approved = all.filter(s => s.status === "approved").length;

      setStats({
        schools: schoolCount || 0,
        total: all.length,
        pending,
        approved,
      });

      setRecent(
        all
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
          .slice(0, 5)
      );

    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  function normalizeStatus(status: string): Status {
    if (!status) return "pending";

    if (["approved", "تأیید شده"].includes(status)) return "approved";
    if (["rejected", "رد شده"].includes(status)) return "rejected";
    return "pending";
  }

  function statusUI(status: Status) {
    switch (status) {
      case "approved":
        return { label: "تایید شده", class: "bg-green-100 text-green-700" };
      case "pending":
        return { label: "در انتظار", class: "bg-yellow-100 text-yellow-700" };
      case "rejected":
        return { label: "رد شده", class: "bg-red-100 text-red-700" };
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">دشبورد ناحیه</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.district || "ناحیه"} — مدیریت ارسال‌ها
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">

        <StatCard
          title="مکاتب"
          value={stats.schools}
          icon={<School />}
          color="bg-blue-100"
          loading={loading}
        />

        <StatCard
          title="کل ارسال‌ها"
          value={stats.total}
          icon={<CheckCircle2 />}
          color="bg-purple-100"
          loading={loading}
        />

        <StatCard
          title="تایید شده"
          value={stats.approved}
          icon={<CheckCircle2 />}
          color="bg-green-100"
          loading={loading}
        />

        <StatCard
          title="در انتظار"
          value={stats.pending}
          icon={<Clock />}
          color="bg-yellow-100"
          loading={loading}
        />

      </div>

      {/* Quick Action */}
      <Link to="/district/submissions">
        <Card className="cursor-pointer hover:shadow-md transition">
          <CardContent className="flex items-center justify-between p-4">
            <span className="font-medium">مشاهده ارسال‌ها</span>
            <Eye className="w-5 h-5" />
          </CardContent>
        </Card>
      </Link>

      {/* Recent */}
      <Card>
        <CardHeader>
          <CardTitle>آخرین ارسال‌ها</CardTitle>
        </CardHeader>
        <CardContent>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-center text-muted-foreground">
              هنوز هیچ ارسالی وجود ندارد
            </p>
          ) : (
            <div className="space-y-3">
              {recent.map((s) => {
                const ui = statusUI(s.status);
                return (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-3 rounded-lg border hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.school_name}</p>
                      <p className="text-xs text-muted-foreground">{s.type}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={ui.class}>{ui.label}</Badge>
                      <span className="text-xs">
                        {format(new Date(s.created_at), "d MMM")}
                      </span>
                    </div>
                  </div>
                );
              })}

              <Link to="/district/submissions">
                <Button className="w-full mt-3" variant="outline">
                  همه ارسال‌ها
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

/* --- Small Component --- */
function StatCard({ title, value, icon, color, loading }: any) {
  return (
    <Card className="hover:scale-[1.02] transition">
      <CardHeader className="flex justify-between flex-row pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className={`p-2 rounded ${color}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "..." : value}
        </div>
      </CardContent>
    </Card>
  );
}