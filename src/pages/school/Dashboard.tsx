import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useVerification } from '@/hooks/useVerification';
import { supabase } from '@/lib/supabase';
import { VerificationPanel } from '@/components/VerificationPanel';
import { getVerificationQueueFilter } from '@/lib/verificationHierarchy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, FileText, ClipboardList, Bell, Calendar,
  ArrowLeft, AlertCircle, CheckCircle2, School
} from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

interface Deadline {
  id: string;
  title: string;
  due_date: string;
  description: string | null;
}

export default function SchoolDashboard() {
  const { profile, role } = useAuth();
  const { t } = useTranslation();
  const verification = useVerification();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  const verificationQueueRole = role ? getVerificationQueueFilter(role) : null;

  useEffect(() => {
    async function fetchData() {
      const [announcementsRes, deadlinesRes] = await Promise.all([
        supabase
          .from('announcements')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('deadlines')
          .select('*')
          .eq('is_active', true)
          .gte('due_date', new Date().toISOString().split('T')[0])
          .order('due_date', { ascending: true })
          .limit(5)
      ]);

      if (announcementsRes.data) setAnnouncements(announcementsRes.data as any);
      if (deadlinesRes.data) setDeadlines(deadlinesRes.data);
      setLoading(false);
    }

    fetchData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('school.dashboard')}</h1>
        <p className="text-muted-foreground text-sm">
          {profile?.schools?.name} — {profile?.schools?.province}، {profile?.schools?.district}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/school/statistics">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('school.submitStatistics')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{t('school.enterStudentData')}</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/school/reports">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('school.submitReports')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{t('school.uploadMonthlyReports')}</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/school/forms">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('school.submitForms')}</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{t('school.fillRequiredForms')}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5" />
                {t('school.recentAnnouncements')}
              </CardTitle>
              <CardDescription>{t('school.updatesFromCenter')}</CardDescription>
            </div>
            <Link to="/school/announcements">
              <Button variant="ghost" size="sm">
                {t('common.viewAll')} <ArrowLeft className="mr-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('school.noAnnouncements')}</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{a.title}</h4>
                    <Badge variant={getPriorityColor(a.priority) as any}>
                      {a.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(a.created_at), 'yyyy/MM/dd')}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                {t('school.upcomingDeadlines')}
              </CardTitle>
              <CardDescription>{t('school.dontMissDeadlines')}</CardDescription>
            </div>
            <Link to="/school/deadlines">
              <Button variant="ghost" size="sm">
                {t('common.viewAll')} <ArrowLeft className="mr-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('school.noDeadlines')}</p>
            ) : (
              deadlines.map((deadline) => {
                const daysLeft = Math.ceil(
                  (new Date(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={deadline.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-md ${daysLeft <= 3 ? 'bg-destructive/10' : 'bg-muted'}`}>
                      <Calendar className={`h-4 w-4 ${daysLeft <= 3 ? 'text-destructive' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{deadline.title}</h4>
                      <p className="text-xs text-muted-foreground">{deadline.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium">
                          {format(new Date(deadline.due_date), 'yyyy/MM/dd')}
                        </span>
                        {daysLeft <= 3 && (
                          <Badge variant="destructive" className="text-xs">
                            {daysLeft === 0 ? t('school.today') : t('school.daysLeft', { count: daysLeft })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verified Banner */}
      {verification.isVerified && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{t('school.accountVerified')}</p>
              <p className="text-xs text-muted-foreground">{t('school.accountVerifiedDesc')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Queue */}
      {verificationQueueRole && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>{t('school.verificationQueue')}</CardTitle>
                <CardDescription>{t('school.pendingApproval')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <VerificationPanel filterRole={verificationQueueRole} limit={10} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
