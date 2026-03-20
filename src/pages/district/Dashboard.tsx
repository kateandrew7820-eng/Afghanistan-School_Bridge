import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { supabase } from '@/lib/supabase';
import { useMockData } from '@/hooks/useMockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { School, BarChart3, CheckSquare, AlertCircle, Eye, Loader2, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface DistrictStats {
  totalSchools: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
}

interface RecentSubmission {
  id: string;
  school_name: string;
  submission_type: string;
  status: string;
  created_at: string;
}

export default function DistrictDashboard() {
  const { profile, isDemoMode } = useAuth();
  const { t } = useTranslation();
  const mockData = useMockData();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DistrictStats>({
    totalSchools: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);

  useEffect(() => {
    fetchDistrictData();
  }, [profile]);

  async function fetchDistrictData() {
    try {
      setLoading(true);

      // If in demo mode, use mock data
      if (isDemoMode || !profile?.district) {
        setStats({
          totalSchools: mockData.districtStats.schools,
          totalSubmissions: mockData.submissions.length,
          pendingSubmissions: mockData.submissions.filter(s => s.status === 'در انتظار تأیید').length,
          approvedSubmissions: mockData.submissions.filter(s => s.status === 'تأیید شده').length
        });
        setRecentSubmissions(
          mockData.submissions.slice(0, 5).map((s, idx) => ({
            id: s.id,
            school_name: s.submittedBy,
            submission_type: s.type,
            status: s.status,
            created_at: s.date
          }))
        );
        setLoading(false);
        return;
      }

      // Fetch real data from Supabase
      const [schoolsRes, statsRes, reportsRes, formsRes] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact' }).eq('district', profile.district),
        supabase.from('statistics_submissions').select('id, status, created_at, schools(name)'),
        supabase.from('report_submissions').select('id, status, created_at, schools(name)'),
        supabase.from('form_submissions').select('id, status, created_at, schools(name)')
      ]);

      const allSubmissions = [
        ...(statsRes.data || []).map(s => ({ ...s, type: 'إحصائيات', school_name: (s.schools as any)?.name || 'Unknown' })),
        ...(reportsRes.data || []).map(s => ({ ...s, type: 'تقرير', school_name: (s.schools as any)?.name || 'Unknown' })),
        ...(formsRes.data || []).map(s => ({ ...s, type: 'نموذج', school_name: (s.schools as any)?.name || 'Unknown' }))
      ];

      const pending = allSubmissions.filter(s => s.status === 'pending').length;
      const approved = allSubmissions.filter(s => s.status === 'approved').length;

      setStats({
        totalSchools: schoolsRes.count || 0,
        totalSubmissions: allSubmissions.length,
        pendingSubmissions: pending,
        approvedSubmissions: approved
      });

      setRecentSubmissions(
        allSubmissions
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(s => ({
            id: s.id,
            school_name: s.school_name,
            submission_type: s.type,
            status: s.status,
            created_at: s.created_at
          }))
      );
    } catch (error) {
      console.error('Error fetching district data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'در انتظار تأیید':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'تأیید شده':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'در انتظار بررسی';
      case 'approved':
        return 'تایید شده';
      case 'rejected':
        return 'رد شده';
      case 'در انتظار تأیید':
        return 'در انتظار بررسی';
      case 'تأیید شده':
        return 'تایید شده';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('district.dashboard')}</h1>
        <p className="text-muted-foreground text-sm">
          {profile?.district || t('navigation.districtName')} — {t('district.overviewDesc')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('district.schoolCount')}</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">{t('common.inYourDistrict')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('district.submissionCount')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">{t('common.thisMonth')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('district.verified')}</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.approvedSubmissions}</div>
            <p className="text-xs text-muted-foreground">{t('common.awaitingReview')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('district.alerts')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">{t('common.needAttention')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/district/submissions">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">مشاهده ارسال‌ها</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">مشاهده و تایید مشارکت‌های مکاتب</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="bg-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">گزارش تجمیعی</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">مشاهده داده‌های تجمیع شده مکاتب</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">آخرین ارسال‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentSubmissions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">هیچ ارسالی وجود ندارد</p>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.map(submission => (
                <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{submission.school_name}</p>
                    <p className="text-xs text-muted-foreground">{submission.submission_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(submission.status)}>
                      {getStatusLabel(submission.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(submission.created_at), 'd MMM')}
                    </span>
                  </div>
                </div>
              ))}
              <Link to="/district/submissions">
                <Button variant="outline" className="w-full mt-4">
                  مشاهده تمام ارسال‌ها
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
