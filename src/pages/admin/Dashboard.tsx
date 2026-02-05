import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  School, 
  BarChart3, 
  FileText, 
  ClipboardList,
  Bell,
  FileUp,
  Calendar,
  ArrowRight,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  totalSchools: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  activeAnnouncements: number;
}

interface RecentSubmission {
  id: string;
  type: 'statistics' | 'report' | 'form';
  school_name: string;
  created_at: string;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSchools: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    activeAnnouncements: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [schoolsRes, statsRes, reportsRes, formsRes, announcementsRes] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact' }),
        supabase.from('statistics_submissions').select('id, status, created_at, schools(name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('report_submissions').select('id, status, created_at, schools(name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('form_submissions').select('id, status, created_at, schools(name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('announcements').select('id', { count: 'exact' }).eq('is_published', true)
      ]);

      const allSubmissions = [
        ...(statsRes.data || []).map(s => ({ ...s, type: 'statistics' as const, school_name: (s.schools as any)?.name || 'Unknown' })),
        ...(reportsRes.data || []).map(s => ({ ...s, type: 'report' as const, school_name: (s.schools as any)?.name || 'Unknown' })),
        ...(formsRes.data || []).map(s => ({ ...s, type: 'form' as const, school_name: (s.schools as any)?.name || 'Unknown' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

      const pendingCount = [
        ...(statsRes.data || []),
        ...(reportsRes.data || []),
        ...(formsRes.data || [])
      ].filter(s => s.status === 'pending').length;

      setStats({
        totalSchools: schoolsRes.count || 0,
        totalSubmissions: (statsRes.data?.length || 0) + (reportsRes.data?.length || 0) + (formsRes.data?.length || 0),
        pendingSubmissions: pendingCount,
        activeAnnouncements: announcementsRes.count || 0
      });

      setRecentSubmissions(allSubmissions);
      setLoading(false);
    }

    fetchData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'statistics': return <BarChart3 className="h-4 w-4" />;
      case 'report': return <FileText className="h-4 w-4" />;
      case 'form': return <ClipboardList className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Center Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of all school activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">Registered schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">All submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAnnouncements}</div>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link to="/admin/announcements">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm">Post Announcement</CardTitle>
                <CardDescription className="text-xs">Share news with schools</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/documents">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <FileUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm">Upload Document</CardTitle>
                <CardDescription className="text-xs">Share guidelines & policies</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/deadlines">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm">Set Deadline</CardTitle>
                <CardDescription className="text-xs">Add important dates</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/schools">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm">Manage Schools</CardTitle>
                <CardDescription className="text-xs">Add or edit schools</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest data from schools</CardDescription>
          </div>
          <Link to="/admin/submissions">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet</p>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <div key={`${submission.type}-${submission.id}`} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      {getTypeIcon(submission.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{submission.school_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{submission.type} submission</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={submission.status === 'pending' ? 'secondary' : 'default'}>
                      {submission.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(submission.created_at), 'MMM d, HH:mm')}
                    </p>
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
