import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileText, 
  ClipboardList, 
  Bell, 
  Calendar,
  ArrowRight,
  AlertCircle
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
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (announcementsRes.data) setAnnouncements(announcementsRes.data);
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
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          {profile?.schools?.name} - {profile?.schools?.province}, {profile?.schools?.district}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/school/statistics">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Submit Statistics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Enter student counts and attendance data</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/school/reports">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upload Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Upload monthly reports and documents</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/school/forms">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fill Forms</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Complete required forms</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Latest Announcements
              </CardTitle>
              <CardDescription>Updates from the center</CardDescription>
            </div>
            <Link to="/school/announcements">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{announcement.title}</h4>
                    <Badge variant={getPriorityColor(announcement.priority) as any}>
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Don't miss these dates</CardDescription>
            </div>
            <Link to="/school/deadlines">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
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
                          {format(new Date(deadline.due_date), 'MMM d, yyyy')}
                        </span>
                        {daysLeft <= 3 && (
                          <Badge variant="destructive" className="text-xs">
                            {daysLeft === 0 ? 'Today!' : `${daysLeft} days left`}
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
    </div>
  );
}
