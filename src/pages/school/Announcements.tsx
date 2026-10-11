import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import NavigationBackButton from '@/components/NavigationBackButton';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

export default function SchoolAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (data) setAnnouncements(data);
      setLoading(false);
    }

    fetchAnnouncements();
  }, []);

  const getPriorityColor = (priority: string): NonNullable<BadgeProps['variant']> => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <NavigationBackButton fallback="/school" label="بازگشت به دشبورد مکتب" />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          اطلاعیه‌ها
        </h1>
        <p className="text-muted-foreground">اطلاعیه‌ها، بخشنامه‌ها و اخبار ارسالی از سوی وزارت و ریاست</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">در حال بارگذاری اطلاعیه‌ها...</p>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">در حال حاضر اطلاعیه‌ای موجود نیست.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{announcement.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(announcement.created_at), 'yyyy/MM/dd')}
                    </CardDescription>
                  </div>
                  <Badge variant={getPriorityColor(announcement.priority)}>
                    {announcement.priority === 'urgent' ? 'فوری' :
                      announcement.priority === 'high' ? 'مهم' :
                        announcement.priority === 'normal' ? 'عادی' : 'اطلاعیه'}
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
