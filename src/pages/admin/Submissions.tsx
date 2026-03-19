import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, FileText, ClipboardList, Eye, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: string;
  school_name: string;
  status: string;
  created_at: string;
  data?: any;
}

export default function AdminSubmissions() {
  const { toast } = useToast();
  const [statistics, setStatistics] = useState<Submission[]>([]);
  const [reports, setReports] = useState<Submission[]>([]);
  const [forms, setForms] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    const [statsRes, reportsRes, formsRes] = await Promise.all([
      supabase.from('statistics_submissions').select('*, schools(name)').order('created_at', { ascending: false }),
      supabase.from('report_submissions').select('*, schools(name)').order('created_at', { ascending: false }),
      supabase.from('form_submissions').select('*, schools(name)').order('created_at', { ascending: false })
    ]);

    if (statsRes.data) setStatistics(statsRes.data.map(s => ({ ...s, school_name: (s.schools as any)?.name || 'Unknown' })));
    if (reportsRes.data) setReports(reportsRes.data.map(s => ({ ...s, school_name: (s.schools as any)?.name || 'Unknown' })));
    if (formsRes.data) setForms(formsRes.data.map(s => ({ ...s, school_name: (s.schools as any)?.name || 'Unknown' })));
    setLoading(false);
  }

  const updateStatus = async (table: 'statistics_submissions' | 'report_submissions' | 'form_submissions', id: string, status: string) => {
    const { error } = await supabase.from(table).update({ status }).eq('id', id);
    if (error) {
      toast({ title: "ناموفق", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "وضعیت بروزرسانی شد" });
    fetchSubmissions();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'reviewed': return 'secondary';
      default: return 'outline';
    }
  };

  const SubmissionCard = ({ submission, type }: { submission: any; type: string }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{submission.school_name}</CardTitle>
            <CardDescription>
              {format(new Date(submission.created_at), 'MMM d, yyyy HH:mm')}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadge(submission.status) as any}>{submission.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {type === 'statistics' && (
          <div className="text-sm space-y-1 mb-3">
            <p>سال: {submission.academic_year}</p>
            <p>کل دانش‌آموزان: {submission.total_students}</p>
            <p>معلمان: {submission.total_teachers}</p>
            {submission.attendance_rate && <p>حضور: {submission.attendance_rate}%</p>}
          </div>
        )}
        {type === 'report' && (
          <div className="text-sm space-y-1 mb-3">
            <p className="font-medium">{submission.title}</p>
            {submission.description && <p className="text-muted-foreground">{submission.description}</p>}
            <p className="text-xs text-muted-foreground">پرونده: {submission.file_name}</p>
          </div>
        )}
        {type === 'form' && (
          <div className="text-sm space-y-1 mb-3">
            <p>نوع: {submission.form_type}</p>
            {submission.form_data?.title && <p className="font-medium">{submission.form_data.title}</p>}
          </div>
        )}
        <div className="flex gap-2">
          <Select
            value={submission.status}
            onValueChange={(value) => updateStatus(`${type === 'statistics' ? 'statistics_submissions' : type === 'report' ? 'report_submissions' : 'form_submissions'}`, submission.id, value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">درانتظار</SelectItem>
              <SelectItem value="reviewed">بررسی‌شده</SelectItem>
              <SelectItem value="approved">تایید‌شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مشاهده ارسال‌ها</h1>
        <p className="text-muted-foreground">داده‌های ارسال شده توسط مکاتب را بررسی کنید</p>
      </div>

      <Tabs defaultValue="statistics">
        <TabsList>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            آمار ({statistics.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            گزارش‌ها ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            فرم‌ها ({forms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">درحال بارگذاری...</p>
          ) : statistics.length === 0 ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">ارسالی آماری وجود ندارد</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {statistics.map((s) => <SubmissionCard key={s.id} submission={s} type="statistics" />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">درحال بارگذاری...</p>
          ) : reports.length === 0 ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">ارسالی گزارش وجود ندارد</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reports.map((s) => <SubmissionCard key={s.id} submission={s} type="report" />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="forms" className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">درحال بارگذاری...</p>
          ) : forms.length === 0 ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">ارسالی فرم وجود ندارد</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {forms.map((s) => <SubmissionCard key={s.id} submission={s} type="form" />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
