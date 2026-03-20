import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { supabase } from '@/lib/supabase';
import { useMockData } from '@/hooks/useMockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, BarChart3, TrendingUp, AlertCircle, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ProvinceStats {
  totalDistricts: number;
  totalSchools: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  totalStudents: number;
}

interface DistrictSummary {
  name: string;
  schools: number;
  submissions: number;
  pending: number;
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
  const [districtSummaries, setDistrictSummaries] = useState<DistrictSummary[]>([]);

  useEffect(() => {
    fetchProvinceData();
  }, [profile]);

  async function fetchProvinceData() {
    try {
      setLoading(true);

      // If in demo mode, use mock data
      if (isDemoMode || !profile?.province) {
        setStats({
          totalDistricts: mockData.provinceStats.districts || 12,
          totalSchools: mockData.provinceStats.schools || 385,
          totalSubmissions: mockData.submissions.length,
          pendingSubmissions: mockData.submissions.filter(s => s.status === 'در انتظار تأیید').length,
          approvedSubmissions: mockData.submissions.filter(s => s.status === 'تأیید شده').length,
          totalStudents: mockData.provinceStats.students || 125000
        });
        setLoading(false);
        return;
      }

      // Fetch real data from Supabase
      const [schoolsRes, statsRes, reportsRes, formsRes] = await Promise.all([
        supabase.from('schools').select('*').eq('province', profile.province),
        supabase.from('statistics_submissions').select('id, status, created_at'),
        supabase.from('report_submissions').select('id, status, created_at'),
        supabase.from('form_submissions').select('id, status, created_at')
      ]);

      const schools = schoolsRes.data || [];
      const allSubmissions = [
        ...(statsRes.data || []),
        ...(reportsRes.data || []),
        ...(formsRes.data || [])
      ];

      const pending = allSubmissions.filter(s => s.status === 'pending').length;
      const approved = allSubmissions.filter(s => s.status === 'approved').length;

      // Calculate unique districts
      const districts = new Set(schools.map(s => s.district)).size;

      // Calculate total students from statistics
      let totalStudents = 0;
      if (statsRes.data) {
        totalStudents = statsRes.data.reduce((sum: number, stat: any) => {
          return sum + (stat.total_students || 0);
        }, 0);
      }

      setStats({
        totalDistricts: districts,
        totalSchools: schools.length,
        totalSubmissions: allSubmissions.length,
        pendingSubmissions: pending,
        approvedSubmissions: approved,
        totalStudents: totalStudents
      });

      // Get district-wise summaries
      const districtMap = new Map<string, DistrictSummary>();
      schools.forEach(school => {
        const district = school.district || 'نامشخص';
        if (!districtMap.has(district)) {
          districtMap.set(district, {
            name: district,
            schools: 0,
            submissions: 0,
            pending: 0
          });
        }
        const summary = districtMap.get(district)!;
        summary.schools += 1;
      });

      setDistrictSummaries(Array.from(districtMap.values()).slice(0, 5));
    } catch (error) {
      console.error('Error fetching province data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('province.dashboard')}</h1>
        <p className="text-muted-foreground text-sm">
          {profile?.province || t('navigation.provinceName')} — {t('province.overviewDesc')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('province.districtCount')}</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalDistricts}</div>
            <p className="text-xs text-muted-foreground">{t('common.inYourProvince')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد مکاتب</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">کل مکاتب ولایت</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">دانش‌آموزان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : (stats.totalStudents > 0 ? stats.totalStudents.toLocaleString('fa-AF') : '—')}</div>
            <p className="text-xs text-muted-foreground">کل دانش‌آموزان</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('province.alerts')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">{t('common.needAttention')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">کل ارسال‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">تایید شده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{loading ? '...' : stats.approvedSubmissions}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">در انتظار بررسی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{loading ? '...' : stats.pendingSubmissions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Districts Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading">خلاصه ولسوالی‌ها</CardTitle>
          <Badge variant="outline">{districtSummaries.length} ولسوالی</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : districtSummaries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">هیچ اطلاعات ولسوالی‌ای دراسترسی نیست</p>
          ) : (
            <div className="space-y-2">
              {districtSummaries.map(district => (
                <div key={district.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{district.name}</p>
                    <p className="text-xs text-muted-foreground">{district.schools} مکتب</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{district.submissions} ارسال</Badge>
                    {district.pending > 0 && (
                      <Badge variant="destructive">{district.pending} در انتظار</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
