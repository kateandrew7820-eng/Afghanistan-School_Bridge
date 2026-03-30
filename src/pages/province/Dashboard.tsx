import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { supabase } from '@/lib/supabase';
import { useMockData } from '@/hooks/useMockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, BarChart3, AlertCircle, Users, Loader2, TrendingUp } from 'lucide-react';

interface ProvinceStats {
  totalDistricts: number;
  totalSchools: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  totalStudents: number;
}

export default function ProvinceDashboard() {
  const { profile, isDemoMode } = useAuth();
  const { t } = useTranslation();
  const mockData = useMockData();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProvinceStats>({
    totalDistricts: 0,
    totalSchools: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    totalStudents: 0
  });

  useEffect(() => {
    fetchProvinceData();
  }, [profile]);

  async function fetchProvinceData() {
    try {
      setLoading(true);

      if (isDemoMode || !profile?.province) {
        setStats({
          totalDistricts: mockData.provinceStats.districts || 12,
          totalSchools: mockData.provinceStats.schools || 385,
          totalSubmissions: mockData.submissions.length,
          pendingSubmissions: mockData.submissions.filter(s => s.status === 'در انتظار تأیید').length,
          approvedSubmissions: mockData.submissions.filter(s => s.status === 'تأیید شده').length,
          totalStudents: mockData.provinceStats.students || 125000
        });
        return;
      }

      const [schoolsRes, statsRes, reportsRes, formsRes] = await Promise.all([
        supabase.from('schools').select('*').eq('province', profile.province),
        supabase.from('statistics_submissions').select('*'),
        supabase.from('report_submissions').select('*'),
        supabase.from('form_submissions').select('*')
      ]);

      const schools = schoolsRes.data || [];
      const allSubmissions = [
        ...(statsRes.data || []),
        ...(reportsRes.data || []),
        ...(formsRes.data || [])
      ];

      setStats({
        totalDistricts: new Set(schools.map(s => s.district)).size,
        totalSchools: schools.length,
        totalSubmissions: allSubmissions.length,
        pendingSubmissions: allSubmissions.filter(s => s.status === 'pending').length,
        approvedSubmissions: allSubmissions.filter(s => s.status === 'approved').length,
        totalStudents: (statsRes.data || []).reduce((sum, s: any) => sum + (s.total_students || 0), 0)
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 bg-white text-slate-800 p-4 rounded-2xl">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">داشبورد ولایت</h1>
          <p className="text-sm text-slate-500">
            {profile?.province || 'ولایت شما'} — مدیریت هوشمند و دقیق داده‌ها
          </p>
        </div>

        <Badge className="bg-slate-100 text-slate-700 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          فعال
        </Badge>
      </div>

      {/* MOTIVATION BAR */}
      <div className="bg-slate-50 border rounded-xl p-4 flex justify-between items-center">
        <p className="text-sm">
          📊 داده‌های دقیق امروز = تصمیم‌های قوی فردا
        </p>
        <Badge variant="outline">به‌روز</Badge>
      </div>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <Card className="bg-white border shadow-sm hover:shadow-md transition">
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm">ولسوالی‌ها</CardTitle>
            <MapPin className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalDistricts}</div>
            <p className="text-xs text-slate-500">در سطح ولایت</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition">
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm">مکاتب</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalSchools}</div>
            <p className="text-xs text-slate-500">کل مکاتب</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition">
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm">دانش‌آموزان</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalStudents.toLocaleString('fa-AF')}
            </div>
            <p className="text-xs text-slate-500">کل دانش‌آموزان</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition">
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm">نیاز به بررسی</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingSubmissions}</div>
            <p className="text-xs text-slate-500">ارسال‌های معطل</p>
          </CardContent>
        </Card>

      </div>

      {/* PERFORMANCE */}
      <div className="grid gap-4 md:grid-cols-3">

        <Card className="bg-slate-50 border">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">کل ارسال‌ها</p>
            <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border">
          <CardContent className="p-4">
            <p className="text-sm text-green-600">تأیید شده</p>
            <p className="text-3xl font-bold text-green-700">{stats.approvedSubmissions}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600">در انتظار</p>
            <p className="text-3xl font-bold text-amber-700">{stats.pendingSubmissions}</p>
          </CardContent>
        </Card>

      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      )}

    </div>
  );
}
