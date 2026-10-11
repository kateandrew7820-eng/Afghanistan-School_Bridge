import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import NavigationBackButton from '@/components/NavigationBackButton';

interface Deadline {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
}

export default function SchoolDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeadlines() {
      const { data } = await supabase
        .from('deadlines')
        .select('*')
        .eq('is_active', true)
        .order('due_date', { ascending: true });
      
      if (data) setDeadlines(data);
      setLoading(false);
    }

    fetchDeadlines();
  }, []);

  const getDaysRemaining = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return 'مهلت گذشته';
    if (days === 0) return 'امروز آخرین مهلت است';
    if (days === 1) return '۱ روز باقی‌مانده';
    return `${days} روز باقی‌مانده`;
  };

  const getDeadlineStatus = (dueDate: string): NonNullable<BadgeProps['variant']> => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return 'destructive';
    if (days <= 3) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <NavigationBackButton fallback="/school" label="بازگشت به دشبورد مکتب" />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          مهلت‌های زمانی و تقویم ارسالی‌ها
        </h1>
        <p className="text-muted-foreground">تاریخ‌های مهم و مهلت‌های تعیین‌شده برای ارسال آمار و گزارش‌ها</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">در حال دریافت مهلت‌های زمانی...</p>
      ) : deadlines.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">هیچ مهلت فعالی در حال حاضر ثبت نشده است.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deadlines.map((deadline) => (
            <Card key={deadline.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{deadline.title}</CardTitle>
                    <CardDescription>
                      مهلت ارسال: {format(new Date(deadline.due_date), 'yyyy/MM/dd')}
                    </CardDescription>
                  </div>
                  <Badge variant={getDeadlineStatus(deadline.due_date)}>
                    {getDaysRemaining(deadline.due_date)}
                  </Badge>
                </div>
              </CardHeader>
              {deadline.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{deadline.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
