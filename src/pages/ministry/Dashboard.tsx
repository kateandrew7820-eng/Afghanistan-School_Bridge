import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { supabase } from '@/lib/supabase';
import { useMockData } from '@/hooks/useMockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, School, BarChart3, TrendingUp, Users, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface NationalStats {
  provinces: number;
  schools: number;
  students: number;
  teachers: number;
  submissions: number;
  submissionsThisMonth: number;
  avgCompletionRate: number;
  avgTeacherStudentRatio: number;
}

export default function MinistryDashboard() {
  const { profile, isDemoMode } = useAuth();
  const { t } = useTranslation();
  const mockData = useMockData();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NationalStats>({
    provinces: 0,
    schools: 0,
    students: 0,
    teachers: 0,
    submissions: 0,
    submissionsThisMonth: 0,
    avgCompletionRate: 0,
    avgTeacherStudentRatio: 0,
  });

  useEffect(() => {
    fetchNationalData();
  }, []);

  async function fetchNationalData() {
    try {
      setLoading(true);

      // If in demo mode, use mock data
      if (isDemoMode) {
        setStats({
          provinces: mockData.ministryStats?.provinces || 34,
          schools: mockData.submissions.length * 5, // Estimate
          students: mockData.provinceStats.students || 925000,
          teachers: Math.round((mockData.provinceStats.students || 925000) / 35),
          submissions: mockData.submissions.length,
          submissionsThisMonth: Math.floor(mockData.submissions.length * 0.6),
          avgCompletionRate: 78,
          avgTeacherStudentRatio: 35,
        });
        setLoading(false);
        return;
      }

      // Fetch real data from Supabase
      const [schoolsRes, statsRes, reportsRes, formsRes] = await Promise.all([
        supabase.from('schools').select('id, province', { count: 'exact' }),
        supabase.from('statistics_submissions').select('id, total_students, total_teachers'),
        supabase.from('report_submissions').select('id, created_at'),
        supabase.from('form_submissions').select('id, created_at'),
      ]);

      const schools = schoolsRes.data || [];
      const statsSubmissions = statsRes.data || [];
      const reports = reportsRes.data || [];
      const forms = formsRes.data || [];

      const totalSubmissions = statsSubmissions.length + reports.length + forms.length;
      const provinces = new Set(schools.map((s) => s.province)).size;

      // Calculate averages from statistics
      let totalStudents = 0;
      let totalTeachers = 0;
      if (statsSubmissions.length > 0) {
        totalStudents = statsSubmissions.reduce((sum, s) => sum + (s.total_students || 0), 0);
        totalTeachers = statsSubmissions.reduce((sum, s) => sum + (s.total_teachers || 0), 0);
      }

      const thisMonth = new Date();
      const submissionsThisMonth = [
        ...reports,
        ...forms,
        ...statsSubmissions,
      ].filter(
        (s) =>
          new Date(s.created_at).getMonth() === thisMonth.getMonth() &&
          new Date(s.created_at).getFullYear() === thisMonth.getFullYear()
      ).length;

      setStats({
        provinces,
        schools: schools.length,
        students: totalStudents,
        teachers: totalTeachers,
        submissions: totalSubmissions,
        submissionsThisMonth,
        avgCompletionRate: totalSubmissions > 0 ? Math.round((submissionsThisMonth / totalSubmissions) * 100) : 0,
        avgTeacherStudentRatio: totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0,
      });
    } catch (error) {
      console.error('Error fetching national data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('ministry.dashboard')}</h1>
        <p className="text-muted-foreground text-sm">{t('ministry.nationalDesc')}</p>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ولایات</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.provinces}</div>
            <p className="text-xs text-muted-foreground">فعال</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مکاتب</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.schools.toLocaleString('en-US')}</div>
            <p className="text-xs text-muted-foreground">ثبت شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">دانش‌آموزان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : (stats.students / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">کل ثبت‌شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معلمان</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : (stats.teachers / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">فعال</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ارسال‌ها</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.submissions}</div>
            <p className="text-xs text-muted-foreground">همه‌ی اوقات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">این ماه</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.submissionsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : `${stats.avgCompletionRate}% تکمیل`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبت</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.avgTeacherStudentRatio}</div>
            <p className="text-xs text-muted-foreground">دانش‌آموز به معلم</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">گزارش</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="w-full">
              نمایش
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/admin/submissions">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">مشاهده ارسال‌ها</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">مشاهده تمام ارسال‌های سراسری</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="bg-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">تحلیل ملی</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">دیدن داده‌های تجمیع شده سراسری</p>
          </CardContent>
        </Card>
      </div>

      {/* Future Analytics Section - Can be expanded */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            داده‌های تجمیع شده
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            در این بخش می‌توانید داده‌های تجمیع شده از تمام ولایات و مکاتب را مشاهده کنید.
          </p>
          <div className="grid gap-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium">نرخ حضور متوسط</span>
                  <Badge variant="secondary">۸۲٪</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm font-medium">درصد تکمیل ارسال‌ها</span>
                  <Badge variant="secondary">{stats.avgCompletionRate}٪</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-sm font-medium">ولایات فعال</span>
                  <Badge variant="secondary">{stats.provinces} از 34</Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
