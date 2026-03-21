import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Loader2, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Deadline {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  is_active: boolean;
}

export default function AdminDeadlines() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    description: '',
    due_date: ''
  });

  useEffect(() => {
    fetchDeadlines();
  }, []);

  async function fetchDeadlines() {
    const { data } = await supabase
      .from('deadlines')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (data) setDeadlines(data);
    setLoading(false);
  }

  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('deadlines').insert({
      title: newDeadline.title,
      description: newDeadline.description || null,
      due_date: newDeadline.due_date,
      created_by: user.id
    });

    setIsSubmitting(false);

    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Deadline Added", description: "Schools can now see this deadline." });
    setIsAddDialogOpen(false);
    setNewDeadline({ title: '', description: '', due_date: '' });
    fetchDeadlines();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('deadlines').delete().eq('id', id);
    
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    
    toast({ title: "Deleted" });
    fetchDeadlines();
  };

  const getDeadlineStatus = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return { label: 'Passed', variant: 'outline' as const };
    if (days === 0) return { label: 'Today', variant: 'destructive' as const };
    if (days <= 3) return { label: `${days} days`, variant: 'default' as const };
    return { label: `${days} days`, variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            فرصت‌ها
          </h1>
          <p className="text-muted-foreground">تعیین تاریخ‌های مهم برای مکاتب</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              افزودن فرصت
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن فرصت</DialogTitle>
              <DialogDescription>تعیین فرصت برای مکاتب</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDeadline} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان *</Label>
                <Input
                  id="title"
                  value={newDeadline.title}
                  onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                  placeholder="ارسال گزارش ماهیانه"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">تاریخ فرصت *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newDeadline.due_date}
                  onChange={(e) => setNewDeadline({ ...newDeadline, due_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={newDeadline.description}
                  onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
                  placeholder="جزئیات اضافی..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    درحال افزودن...
                  </>
                ) : (
                  'افزودن فرصت'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">درحال بارگذاری...</p>
      ) : deadlines.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">فرصتی تعریف نشده است</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deadlines.map((deadline) => {
            const status = getDeadlineStatus(deadline.due_date);
            return (
              <Card key={deadline.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{deadline.title}</CardTitle>
                      <CardDescription>
                        فرصت: {format(new Date(deadline.due_date), 'EEEE, MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(deadline.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {deadline.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{deadline.description}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
