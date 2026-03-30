/**
 * Enhanced School Dashboard Example
 * 
 * This demonstrates how to upgrade the dashboard with:
 * - Smart form validation
 * - Interactive expandable cards
 * - Real-time notifications
 * - Contextual guidance
 * - Professional animations
 * - Deadline awareness
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useConfirmation, ConfirmationTemplates } from '@/contexts/ConfirmationContext';
import { InteractiveDashboardCard, SmartStatusCard } from '@/components/InteractiveDashboardCard';
import { SmartGuidance, SmartTip, NextStep } from '@/components/SmartGuidance';
import { AnimationClasses } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, FileText, ClipboardList, Bell, Calendar, Clock,
  AlertCircle, CheckCircle2, TrendingUp, Users
} from 'lucide-react';

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'high' | 'normal';
  created_at: string;
}

interface DeadlineData {
  id: string;
  title: string;
  due_date: string;
  description: string | null;
  status: 'pending' | 'submitted' | 'overdue';
}

interface SchoolStats {
  totalStudents: number;
  studentTrend: 'up' | 'down' | 'neutral';
  totalTeachers: number;
  teacherTrend: 'up' | 'down' | 'neutral';
  submissionRate: number;
  getUpcoming فرصت‌‌ها: number;
}

/**
 * EXAMPLE: Enhanced School Dashboard
 * Shows best practices for using smart UX features
 */
export default function EnhancedSchoolDashboard() {
  const { profile, role } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Smart notifications
  const { 
    notifyDeadlineApproaching, 
    getNextStepsGuidance, 
    getTip,
    notifyMissingFields 
  } = useSmartNotifications();

  // Confirmation system
  const { showConfirmation } = useConfirmation();

  // State
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [فرصت‌‌ها, setفرصت‌‌ها] = useState<DeadlineData[]>([]);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    async function loadDashData() {
      try {
        // Simulate data loading
        const announcementsData = [
          {
            id: '1',
            title: 'Emergency: New enrollment form required',
            content: 'All schools must submit updated enrollment forms',
            priority: 'urgent',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Quarterly Report Submission Open',
            content: 'Submit your Q1 statistics by March 31',
            priority: 'high',
            created_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
          },
        ];

        const فرصت‌‌هاData = [
          {
            id: '1',
            title: 'Q1 Statistics Submission',
            due_date: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
            description: 'Submit student enrollment data',
            status: 'pending',
          },
          {
            id: '2',
            title: 'Teacher Report',
            due_date: new Date(Date.now() + 5*24*60*60*1000).toISOString(),
            description: 'Submit monthly teacher statistics',
            status: 'pending',
          },
        ];

        setAnnouncements(announcementsData);
        setفرصت‌‌ها(فرصت‌‌هاData);

        // Show deadline notifications for urgent ones
        فرصت‌‌هاData.forEach(d => {
          const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / (1000*60*60*24));
          if (daysLeft <= 3) {
            notifyDeadlineApproaching(d);
          }
        });

        setStats({
          totalStudents: 245,
          studentTrend: 'up',
          totalTeachers: 18,
          teacherTrend: 'neutral',
          submissionRate: 87,
          upcomingفرصت‌‌ها: 2,
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        setLoading(false);
      }
    }

    loadDashData();
  }, [notifyDeadlineApproaching]);

  // Next steps for student's role
  const nextSteps = getNextStepsGuidance();
  const nextStepsFormatted: NextStep[] = nextSteps
    .map((step, index) => ({
      id: `step-${index}`,
      title: step,
      description: 'Follow the prompts in the system to complete this step',
      priority: index === 0 ? 'high' : 'medium',
      icon: completedSteps.includes(`step-${index}`) ? 
        <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
        <Clock className="h-5 w-5 text-blue-600" />,
      action: {
        label: 'Get Started',
        onClick: () => handleStartStep(index),
      },
      completed: completedSteps.includes(`step-${index}`),
    }));

  const handleStartStep = (stepIndex: number) => {
    // Navigate based on step
    const routes = [
      '/setup-profile',
      '/school/statistics',
      '/school/reports',
      '/school/announcements',
    ];
    if (stepIndex < routes.length) {
      navigate(routes[stepIndex]);
    }
  };

  const handleSubmitStatistics = () => {
    showConfirmation(
      ConfirmationTemplates.submitForm('Student Statistics', async () => {
        // Validation would happen here
        // Then actual submission
        navigate('/school/statistics');
      })
    );
  };

  const handleSubmitReport = () => {
    showConfirmation(
      ConfirmationTemplates.submitForm('Monthly Report', async () => {
        navigate('/school/reports');
      })
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Get priority color for announcement
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className={`space-y-6 ${AnimationClasses.fadeIn}`}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">{t('school.dashboard')}</h1>
        <p className="text-muted-foreground mt-1">
          {profile?.schools?.name} — {profile?.schools?.province}, {profile?.schools?.district}
        </p>
      </div>

      {/* Urgent Announcements Alert */}
      {announcements.some(a => a.priority === 'urgent') && (
        <Card className="border-destructive/50 bg-destructive/5 animate-in slide-in-from-top">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-base text-destructive">Urgent Announcement</CardTitle>
                <p className="text-sm text-destructive/80 mt-2">
                  {announcements.find(a => a.priority === 'urgent')?.title}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Getting Started Guidance */}
      <SmartGuidance
        title="Getting your school set up"
        description="Follow these steps to fully configure your school profile"
        steps={nextStepsFormatted}
        onStepClick={(stepId) => {
          const stepIndex = parseInt(stepId.split('-')[1]);
          handleStartStep(stepIndex);
        }}
      />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Submit Statistics - High Priority */}
        <InteractiveDashboardCard
          title="Student Statistics"
          description="Report student enrollment data"
          icon={<BarChart3 className="h-5 w-5" />}
          highlight={
            فرصت‌‌ها.some(
              d => d.title.includes('Statistics') && 
              new Date(d.due_date).getTime() - Date.now() < 7*24*60*60*1000
            )
          }
          badge={{
            label: فرصت‌‌ها.some(d => d.title.includes('Statistics')) ? 'Pending' : 'Updated',
            variant: فرصت‌‌ها.some(d => d.title.includes('Statistics')) ? 'destructive' : 'default',
          }}
          onExpand={() => {}}
          expandedContent={
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Report has not been submitted for Q1 2026
              </p>
              <Button onClick={handleSubmitStatistics} className="w-full">
                Submit Now
              </Button>
            </div>
          }
        >
          <div className="space-y-2">
            <p className="text-2xl font-bold">{stats?.totalStudents}</p>
            <p className="text-xs text-muted-foreground">students enrolled</p>
          </div>
        </InteractiveDashboardCard>

        {/* Submit Reports */}
        <InteractiveDashboardCard
          title="Monthly Reports"
          description="Submit school performance reports"
          icon={<FileText className="h-5 w-5" />}
          badge={{
            label: 'Ready',
            variant: 'secondary',
          }}
          expandedContent={
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload PDF اسناد with your school's monthly performance data
              </p>
              <Button onClick={handleSubmitReport} className="w-full">
                Upload Report
              </Button>
            </div>
          }
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">March 2026</p>
            <p className="text-xs text-muted-foreground">month to report</p>
          </div>
        </InteractiveDashboardCard>

        {/* Submit Forms */}
        <InteractiveDashboardCard
          title="Forms & Surveys"
          description="Complete required forms"
          icon={<ClipboardList className="h-5 w-5" />}
          badge={{
            label: '3 Pending',
            variant: 'outline',
          }}
          expandedContent={
            <div className="space-y-3">
              <ul className="text-sm space-y-2">
                <li>• Teacher qualification form</li>
                <li>• Infrastructure assessment</li>
                <li>• Student performance survey</li>
              </ul>
              <Link to="/school/forms">
                <Button className="w-full">View Forms</Button>
              </Link>
            </div>
          }
        >
          <div className="space-y-2">
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">forms to complete</p>
          </div>
        </InteractiveDashboardCard>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SmartStatusCard
          label="Total Students"
          value={stats?.totalStudents || 0}
          status="success"
          trend={stats?.studentTrend || 'neutral'}
        />
        <SmartStatusCard
          label="Teachers"
          value={stats?.totalTeachers || 0}
          status="success"
          trend={stats?.teacherTrend || 'neutral'}
        />
        <SmartStatusCard
          label="Submission Rate"
          value={`${stats?.submissionRate || 0}%`}
          status={stats && stats.submissionRate >= 80 ? 'success' : 'warning'}
          trend="up"
        />
        <SmartStatusCard
          label="Upcoming فرصت‌‌ها"
          value={stats?.upcomingفرصت‌‌ها || 0}
          status={فرصت‌‌ها.length > 0 ? 'warning' : 'success'}
          trend="neutral"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Announcements */}
        <Card className="animate-in slide-in-from-left">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('school.recentAnnouncements')}
              </CardTitle>
              <CardDescription>Important updates from the center</CardDescription>
            </div>
            <Link to="/school/announcements">
              <Button variant="ghost" size="sm">
                View All →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                  a.priority === 'urgent' ? 'border-destructive/50 bg-destructive/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{a.title}</h4>
                  <Badge variant={getPriorityColor(a.priority)}>
                    {a.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* فرصت‌‌ها */}
        <Card className="animate-in slide-in-from-right">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming فرصت‌‌ها
              </CardTitle>
              <CardDescription>Tasks that need your attention</CardDescription>
            </div>
            <Link to="/school/فرصت‌‌ها">
              <Button variant="ghost" size="sm">
                View All →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {فرصت‌‌ها.map((d) => {
              const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / (1000*60*60*24));
              const isUrgent = daysLeft <= 3;

              return (
                <div
                  key={d.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isUrgent
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-border hover:shadow-md'
                  } cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{d.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {d.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-medium ${isUrgent ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                    </span>
                    <Badge variant={isUrgent ? 'destructive' : 'secondary'}>
                      {d.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick Tip */}
      <SmartTip
        title="Did you know?"
        message={getTip('dashboard')}
        type="info"
        action={{
          label: 'Learn More',
          onClick: () => window.open('/help/dashboard', '_blank'),
        }}
      />
    </div>
  );
}

/**
 * Key Features Demonstrated:
 * 
 * 1. Smart Notifications
 *    - Auto-shows فرصت‌‌ها that are approaching
 *    - Contextual warnings for urgent announcements
 * 
 * 2. Interactive Cards
 *    - Expandable cards for detailed information
 *    - Color-coded badges for status
 *    - Smart highlighting for important items
 * 
 * 3. Role-based Guidance
 *    - Shows next steps based on school's setup status
 *    - Tracks completed steps
 *    - Provides actionable links
 * 
 * 4. Confirmations
 *    - Confirms before navigating to submission pages
 *    - Prevents accidental clicks
 * 
 * 5. Animations
 *    - Smooth fade-in of main content
 *    - Slide-in from sides for major cards
 *    - Contextual animations for urgent items
 * 
 * 6. Professional Feel
 *    - Consistent responsive layout
 *    - Color-coded status indicators
 *    - Clear hierarchy of information
 *    - Helpful tips throughout
 */
