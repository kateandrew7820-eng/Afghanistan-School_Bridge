import { useEffect, useState } from 'react';
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
      <WelcomeGuide userName={profile?.full_name} />
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('school.dashboard')}</h1>
        <p className="text-muted-foreground text-sm">
          {profile?.schools?.name} — {profile?.schools?.province}، {profile?.schools?.district}
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/school/statistics">
            <div className="group p-6 rounded-2xl border border-white/10 bg-gradient-to-br hover:from-primary/10 hover:to-transparent cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 group-hover:shadow-lg transition-shadow">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Featured</span>
              </div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition">{t('school.submitStatistics')}</h3>
              <p className="text-sm text-muted-foreground">{t('school.enterStudentData')}</p>
              <div className="mt-4 flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                Get Started <ArrowLeft className="ml-2 h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link to="/school/reports">
            <div className="group p-6 rounded-2xl border border-white/10 bg-gradient-to-br hover:from-secondary/10 hover:to-transparent cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-secondary/30">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 group-hover:shadow-lg transition-shadow">
                  <FileText className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-secondary transition">{t('school.submitReports')}</h3>
              <p className="text-sm text-muted-foreground">{t('school.uploadMonthlyReports')}</p>
              <div className="mt-4 flex items-center text-secondary text-sm font-medium group-hover:translate-x-1 transition-transform">
                Upload <ArrowLeft className="ml-2 h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link to="/school/forms">
            <div className="group p-6 rounded-2xl border border-white/10 bg-gradient-to-br hover:from-accent/10 hover:to-transparent cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-accent/30">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 group-hover:shadow-lg transition-shadow">
                  <ClipboardList className="h-6 w-6 text-accent" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-accent transition">{t('school.submitForms')}</h3>
              <p className="text-sm text-muted-foreground">{t('school.fillRequiredForms')}</p>
              <div className="mt-4 flex items-center text-accent text-sm font-medium group-hover:translate-x-1 transition-transform">
                Fill Form <ArrowLeft className="ml-2 h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Announcements */}
        <Card className="border-white/10 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                {t('school.recentAnnouncements')}
              </CardTitle>
              <CardDescription className="mt-1">{t('school.updatesFromCenter')}</CardDescription>
            </div>
            <Link to="/school/announcements">
              <Button variant="ghost" size="sm" className="hover:text-primary">
                {t('common.viewAll')} <ArrowLeft className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('school.noAnnouncements')}</p>
            ) : (
              announcements.map((a, idx) => (
                <div key={a.id} className="group p-4 rounded-lg border border-white/5 bg-white/2 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm group-hover:text-primary transition">{a.title}</h4>
                    <Badge variant={getPriorityColor(a.priority) as any} className="text-xs shrink-0">
                      {a.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-muted-foreground font-medium">{format(new Date(a.created_at), 'MMM dd, yyyy')}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card className="border-white/10 bg-gradient-to-br from-secondary/5 to-transparent hover:border-secondary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10">
                  <Calendar className="h-5 w-5 text-secondary" />
                </div>
                {t('school.upcomingDeadlines')}
              </CardTitle>
              <CardDescription className="mt-1">{t('school.dontMissDeadlines')}</CardDescription>
            </div>
            <Link to="/school/deadlines">
              <Button variant="ghost" size="sm" className="hover:text-secondary">
                {t('common.viewAll')} <ArrowLeft className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('school.noDeadlines')}</p>
            ) : (
              deadlines.map((deadline, idx) => {
                const daysLeft = Math.ceil(
                  (new Date(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 3;
                return (
                  <div key={deadline.id} className="group p-4 rounded-lg border border-white/5 bg-white/2 hover:bg-secondary/5 hover:border-secondary/20 transition-all duration-200 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg shrink-0 ${isUrgent ? 'bg-destructive/20' : 'bg-secondary/20'}`}>
                        <Calendar className={`h-5 w-5 ${isUrgent ? 'text-destructive' : 'text-secondary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm group-hover:text-secondary transition">{deadline.title}</h4>
                        {deadline.description && (
                          <p className="text-xs text-muted-foreground mt-1">{deadline.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {format(new Date(deadline.due_date), 'MMM dd, yyyy')}
                          </span>
                          {isUrgent && (
                            <Badge variant="destructive" className="text-xs animate-pulse-glow">
                              {daysLeft === 0 ? t('school.today') : `${daysLeft}d left`}
                            </Badge>
                          )}
                        </div>
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
        <Card className="border-transparent bg-gradient-to-r from-green-600/10 via-green-500/5 to-transparent hover:border-green-600/30 transition-colors">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-600/20 to-green-600/10">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-green-700 dark:text-green-400">{t('school.accountVerified')}</p>
              <p className="text-xs text-green-600/70 dark:text-green-500/70 mt-0.5">{t('school.accountVerifiedDesc')}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 hidden sm:block" />
          </CardContent>
        </Card>
      )}

      {/* Verification Queue */}
      {verificationQueueRole && (
        <Card className="border-transparent bg-gradient-to-r from-blue-600/10 via-blue-500/5 to-transparent hover:border-blue-600/30 transition-colors">
          <CardHeader className="pb-3 border-b border-blue-600/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-600/10">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-700 dark:text-blue-400">{t('school.verificationQueue')}</CardTitle>
                <CardDescription className="text-blue-600/70 dark:text-blue-500/70">{t('school.pendingApproval')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <VerificationPanel filterRole={verificationQueueRole} limit={10} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
