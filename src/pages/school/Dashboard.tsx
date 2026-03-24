import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useVerification } from '@/hooks/useVerification';
import { supabase } from '@/lib/supabase';
import { VerificationPanel } from '@/components/VerificationPanel';
import WelcomeGuide from '@/components/WelcomeGuide';
import { getVerificationQueueFilter } from '@/lib/verificationHierarchy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, FileText, ClipboardList, Bell, Calendar,
  ArrowLeft, AlertCircle, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface Announcement { id: string; title: string; content: string; priority: string; created_at: string; }
interface Deadline { id: string; title: string; due_date: string; description: string | null; }

const PRIORITY_VARIANT: Record<string, string> = {
  urgent: 'destructive',
  high: 'default',
  normal: 'secondary',
};

function CardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function SchoolDashboard() {
  const { profile, role } = useAuth();
  const { t } = useTranslation();
  const verification = useVerification();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  const verificationQueueRole = useMemo(
    () => (role ? getVerificationQueueFilter(role) : null),
    [role]
  );

  useEffect(() => {
    async function fetchData() {
      const [announcementsRes, deadlinesRes] = await Promise.all([
        supabase.from('announcements').select('id,title,content,priority,created_at')
          .eq('is_published', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('deadlines').select('id,title,due_date,description')
          .eq('is_active', true).gte('due_date', new Date().toISOString().split('T')[0])
          .order('due_date', { ascending: true }).limit(5),
      ]);
      if (announcementsRes.data) setAnnouncements(announcementsRes.data as Announcement[]);
      if (deadlinesRes.data) setDeadlines(deadlinesRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const quickActions = useMemo(() => [
    { href: '/school/statistics', icon: BarChart3, label: t('school.submitStatistics'), sub: t('school.enterStudentData') },
    { href: '/school/reports', icon: FileText, label: t('school.submitReports'), sub: t('school.uploadMonthlyReports') },
    { href: '/school/forms', icon: ClipboardList, label: t('school.submitForms'), sub: t('school.fillRequiredForms') },
  ], [t]);

  return (
    <div className="space-y-6">
      <WelcomeGuide userName={profile?.full_name} />

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold">{t('school.dashboard')}</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
          {profile?.schools?.name} — {profile?.schools?.province}، {profile?.schools?.district}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} to={action.href}>
              <Card className="h-full border-border hover:border-primary/40 transition-colors group cursor-pointer">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{action.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{action.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Announcements & Deadlines */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">{t('school.recentAnnouncements')}</CardTitle>
            </div>
            <Link to="/school/announcements">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                {t('common.viewAll')}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <CardSkeleton /> : announcements.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">{t('school.noAnnouncements')}</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm line-clamp-1">{a.title}</h4>
                    <Badge variant={(PRIORITY_VARIANT[a.priority] || 'outline') as any} className="text-[10px] shrink-0">
                      {a.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{format(new Date(a.created_at), 'MMM dd, yyyy')}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary-foreground" />
              <CardTitle className="text-sm">{t('school.upcomingDeadlines')}</CardTitle>
            </div>
            <Link to="/school/deadlines">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                {t('common.viewAll')}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <CardSkeleton /> : deadlines.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">{t('school.noDeadlines')}</p>
            ) : (
              deadlines.map((d) => {
                const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
                const isUrgent = daysLeft <= 3;
                return (
                  <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-lg shrink-0 ${isUrgent ? 'bg-destructive/10' : 'bg-muted'}`}>
                      <Calendar className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm line-clamp-1">{d.title}</h4>
                      {d.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{format(new Date(d.due_date), 'MMM dd, yyyy')}</span>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-[10px]">
                            {daysLeft === 0 ? t('school.today') : `${daysLeft}d`}
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
        <Card className="border-success/30 bg-success/5">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="font-medium text-sm">{t('school.accountVerified')}</p>
              <p className="text-xs text-muted-foreground">{t('school.accountVerifiedDesc')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Queue */}
      {verificationQueueRole && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">{t('school.verificationQueue')}</CardTitle>
            </div>
            <CardDescription className="text-xs">{t('school.pendingApproval')}</CardDescription>
          </CardHeader>
          <CardContent>
            <VerificationPanel filterRole={verificationQueueRole} limit={10} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
