import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

export default function Schoolاعلانات() {
  const [اعلانات, setاعلانات] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchاعلانات() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (data) setاعلانات(data as any);
      setLoading(false);
    }

    fetchاعلانات();
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          اعلانات
        </h1>
        <p className="text-muted-foreground">Updates and news from the center</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading اعلانات...</p>
      ) : اعلانات.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No اعلانات yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {اعلانات.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{announcement.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(announcement.created_at), 'MMMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge variant={getPriorityColor(announcement.priority) as any}>
                    {announcement.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
