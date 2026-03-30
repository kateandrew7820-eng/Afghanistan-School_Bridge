import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Deadline {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
}

export default function Schoolفرصت‌‌ها() {
  const [فرصت‌‌ها, setفرصت‌‌ها] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchفرصت‌‌ها() {
      const { data } = await supabase
        .from('فرصت‌‌ها')
        .select('*')
        .eq('is_active', true)
        .order('due_date', { ascending: true });
      
      if (data) setفرصت‌‌ها(data);
      setLoading(false);
    }

    fetchفرصت‌‌ها();
  }, []);

  const getDaysRemaining = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const getفرصت‌‌هاtatus = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return 'destructive';
    if (days <= 3) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          فرصت‌‌ها
        </h1>
        <p className="text-muted-foreground">Important dates and submission فرصت‌‌ها</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading فرصت‌‌ها...</p>
      ) : فرصت‌‌ها.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No active فرصت‌‌ها</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {فرصت‌‌ها.map((deadline) => (
            <Card key={deadline.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{deadline.title}</CardTitle>
                    <CardDescription>
                      Due: {format(new Date(deadline.due_date), 'EEEE, MMMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge variant={getفرصت‌‌هاtatus(deadline.due_date) as any}>
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
