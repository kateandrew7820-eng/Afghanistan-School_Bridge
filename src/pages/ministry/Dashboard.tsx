import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { supabase } from "@/lib/supabase";

/* ---------------- SIDEBAR ---------------- */

function Sidebar({ active, setActive }: any) {
  const items = ["Dashboard", "Analytics", "Reports", "Settings"];

  return (
    <div className="w-60 h-screen bg-white border-r p-4">
      <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

      {items.map((item) => (
        <div
          key={item}
          onClick={() => setActive(item)}
          className={`p-2 rounded-lg cursor-pointer mb-2 transition ${
            active === item ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"
          }`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

/* ---------------- MAIN ---------------- */

export default function MinistryDashboardV2() {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);

  /* ---------------- REALTIME ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      const [s, r, a, sc] = await Promise.all([
        supabase.from("students").select("*"),
        supabase.from("exam_results").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("schools").select("*"),
      ]);

      setStudents(s.data || []);
      setResults(r.data || []);
      setAttendance(a.data || []);
      setSchools(sc.data || []);
    };

    fetchData();

    // realtime updates
    const channel = supabase
      .channel("realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---------------- ANALYTICS ---------------- */

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalSchools = schools.length;

    const passRate =
      results.length > 0
        ? Math.round(
            (results.filter((r) => r.score >= 50).length / results.length) *
              100
          )
        : 0;

    const attendanceRate =
      attendance.length > 0
        ? Math.round(
            (attendance.filter((a) => a.present).length /
              attendance.length) *
              100
          )
        : 0;

    return {
      totalStudents,
      totalSchools,
      passRate,
      attendanceRate,
    };
  }, [students, results, attendance, schools]);

  /* ---------------- CHART DATA ---------------- */

  const chartData = [
    { name: "Students", value: stats.totalStudents },
    { name: "Schools", value: stats.totalSchools },
    { name: "Pass %", value: stats.passRate },
    { name: "Attendance %", value: stats.attendanceRate },
  ];

  const lineData = results.slice(0, 10).map((r, i) => ({
    name: `T${i + 1}`,
    score: r.score,
  }));

  /* ---------------- UI ---------------- */

  return (
    <div className="flex bg-white min-h-screen text-gray-900">
      <Sidebar active={activeTab} setActive={setActiveTab} />

      <div className="flex-1 p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{activeTab}</h1>
          <Badge className="bg-green-100 text-green-700">Live</Badge>
        </div>

        {/* DASHBOARD */}
        {activeTab === "Dashboard" && (
          <>
            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Stat title="Students" value={stats.totalStudents} />
              <Stat title="Schools" value={stats.totalSchools} />
              <Stat title="Pass Rate" value={`${stats.passRate}%`} />
              <Stat title="Attendance" value={`${stats.attendanceRate}%`} />
            </div>

            {/* BAR CHART */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* LINE CHART */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lineData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* OTHER TABS */}
        {activeTab !== "Dashboard" && (
          <Card>
            <CardContent className="p-6 text-gray-500">
              {activeTab} section coming next...
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------------- STAT CARD ---------------- */

function Stat({ title, value }: any) {
  return (
    <motion.div whileHover={{ scale: 1.03 }}>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="text-xl font-semibold">{value}</h2>
        </CardContent>
      </Card>
    </motion.div>
  );
}
