import { useEffect, useState } from 'react';
import { sanitizeError } from '@/lib/sanitizeError';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { canApprove, getVerificationQueueFilter } from '@/lib/verificationHierarchy';
// Mock data removed - using real data only
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, FileText, ClipboardList, CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: string;
  school_name: string;
  status: string;
  created_at: string;
  data?: any;
}

export default function AdminSubmissions() {
  const { role, isDemoMode } = useAuth();
  const mockData = { submissions: [] as any[] };
  const { toast } = useToast();
  const [statistics, setStatistics] = useState<Submission[]>([]);
  const [reports, setReports] = useState<Submission[]>([]);
  const [forms, setForms] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; submissionId: string; type: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    try {
      setLoading(true);

      // If in demo mode, use mock data
      if (isDemoMode) {
        const mockSubmissions = mockData.submissions.map((s, idx) => ({
          id: `mock-${idx}`,
          school_name: s.submittedBy,
          status: s.status === 'تأیید شده' ? 'approved' : s.status === 'در انتظار تأیید' ? 'pending' : 'reviewed',
          created_at: s.date,
          data: {}
        }));

        setStatistics(mockSubmissions.filter((_, i) => i % 3 === 0));
        setReports(mockSubmissions.filter((_, i) => i % 3 === 1));
        setForms(mockSubmissions.filter((_, i) => i % 3 === 2));
        setLoading(false);
        return;
      }

      const [statsRes, reportsRes, formsRes] = await Promise.all([
        supabase.from('statistics_submissions').select('*, schools(name)').order('created_at', { ascending: false }),
        supabase.from('report_submissions').select('*, schools(name)').order('created_at', { ascending: false }),
        supabase.from('form_submissions').select('*, schools(name)').order('created_at', { ascending: false })
      ]);

      if (statsRes.data) setStatistics(statsRes.data.map(s => ({ ...s, school_name: (s.schools as any)?.name || 'Unknown' })));
      if (reportsRes.data) setReports(reportsRes.data.map(s => ({ ...s, school_name: (s.schools as any)?.name || 'Unknown' })));
      if (formsRes.data) setForms(formsRes.data.map(s => ({ ...s, school_name: (s.schools as any)?.name || 'Unknown' })));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'خطا در بارگذاری',
        description: 'مشکلی در بارگذاری داده‌ها پیش آمد',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (table: 'statistics_submissions' | 'report_submissions' | 'form_submissions', id: string, status: string) => {
    try {
      setUpdatingId(id);
      const updateData: Record<string, any> = { status };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase.from(table).update(updateData).eq('id', id);

      if (error) throw error;

      const statusLabel = status === 'approved' ? 'تایید شد' : status === 'rejected' ? 'رد شد' : 'بررسی شد';
      toast({
        title: 'موفقیت',
        description: `ارسال ${statusLabel}`,
      });

      // Clear rejection dialog
      setRejectionDialog(null);
      setRejectionReason('');

      // Refresh data
      fetchSubmissions();
    } catch (error) {
      toast({
        title: 'خطا',
        description: sanitizeError(error),
        variant: 'destructive'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = (value: string, submissionId: string, table: string, currentStatus: string) => {
    if (value === 'rejected') {
      setRejectionDialog({ open: true, submissionId, type: table });
    } else {
      updateStatus(table as any, submissionId, value);
    }
  };

  const handleRejectWithReason = () => {
    if (!rejectionDialog) return;
    if (!rejectionReason.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً دلیل رد کردن را وارد کنید',
        variant: 'destructive'
      });
      return;
    }
    updateStatus(rejectionDialog.type as any, rejectionDialog.submissionId, 'rejected');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'در انتظار تأیید':
        return 'bg-warning/10 text-warning';
      case 'approved':
      case 'تأیید شده':
        return 'bg-success/10 text-success';
      case 'reviewed':
      case 'بررسی‌شده':
        return 'bg-primary/10 text-primary';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'تأیید شده':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
      case 'در انتظار تأیید':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'درانتظار';
      case 'approved':
        return 'تایید‌شده';
      case 'rejected':
        return 'رد شده';
      case 'reviewed':
        return 'بررسی‌شده';
      case 'تأیید شده':
        return 'تایید‌شده';
      case 'در انتظار تأیید':
        return 'درانتظار';
      default:
        return status;
    }
  };

  const SubmissionCard = ({ submission, type }: { submission: any; type: string }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base">{submission.school_name}</CardTitle>
            <CardDescription>
              {format(new Date(submission.created_at), 'd MMM، HH:mm')}
            </CardDescription>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(submission.status)}`}>
            {getStatusIcon(submission.status)}
            <span className="text-xs font-medium">{getStatusLabel(submission.status)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Submission Details */}
        {type === 'statistics' && (
          <div className="text-sm space-y-1 bg-muted p-2 rounded">
            <p><span className="font-medium">سال:</span> {submission.academic_year}</p>
            <p><span className="font-medium">کل دانش‌آموزان:</span> {submission.total_students}</p>
            <p><span className="font-medium">معلمان:</span> {submission.total_teachers}</p>
            {submission.attendance_rate && <p><span className="font-medium">حضور:</span> {submission.attendance_rate}%</p>}
          </div>
        )}
        {type === 'report' && (
          <div className="text-sm space-y-1 bg-muted p-2 rounded">
            <p className="font-medium">{submission.title}</p>
            {submission.description && <p className="text-muted-foreground">{submission.description}</p>}
            <p className="text-xs text-muted-foreground">📄 {submission.file_name}</p>
          </div>
        )}
        {type === 'form' && (
          <div className="text-sm space-y-1 bg-muted p-2 rounded">
            <p><span className="font-medium">نوع:</span> {submission.form_type}</p>
            {submission.form_data?.title && <p className="font-medium">{submission.form_data.title}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={() => updateStatus(`${type === 'statistics' ? 'statistics_submissions' : type === 'report' ? 'report_submissions' : 'form_submissions'}`, submission.id, 'approved')}
            disabled={updatingId === submission.id || submission.status === 'approved'}
          >
            {updatingId === submission.id ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                درحال پردازش...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                تایید
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => setRejectionDialog({ open: true, submissionId: submission.id, type: `${type === 'statistics' ? 'statistics_submissions' : type === 'report' ? 'report_submissions' : 'form_submissions'}` })}
            disabled={updatingId === submission.id || submission.status === 'rejected'}
          >
            {updatingId === submission.id ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                رد
              </>
            )}
          </Button>
          <Select
            value={submission.status}
            onValueChange={(value) => handleStatusChange(value, submission.id, `${type === 'statistics' ? 'statistics_submissions' : type === 'report' ? 'report_submissions' : 'form_submissions'}`, submission.status)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">درانتظار</SelectItem>
              <SelectItem value="reviewed">بررسی‌شده</SelectItem>
              <SelectItem value="approved">تایید‌شده</SelectItem>
              <SelectItem value="rejected">رد شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6" />
          مشاهده و تایید ارسال‌ها
        </h1>
        <p className="text-muted-foreground">داده‌های ارسال شده توسط مکاتب را بررسی و تایید کنید</p>
      </div>

      <Tabs defaultValue="statistics">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">آمار</span>
            <Badge variant="outline" className="ml-1">{statistics.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">گزارش‌ها</span>
            <Badge variant="outline" className="ml-1">{reports.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">فورم‌ها</span>
            <Badge variant="outline" className="ml-1">{forms.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="mt-4">
          {loading ? (
            <Card><CardContent className="pt-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /><p className="text-muted-foreground">درحال بارگذاری...</p></CardContent></Card>
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
            <Card><CardContent className="pt-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /><p className="text-muted-foreground">درحال بارگذاری...</p></CardContent></Card>
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
            <Card><CardContent className="pt-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /><p className="text-muted-foreground">درحال بارگذاری...</p></CardContent></Card>
          ) : forms.length === 0 ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">ارسالی فورم وجود ندارد</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {forms.map((s) => <SubmissionCard key={s.id} submission={s} type="form" />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectionDialog?.open || false} onOpenChange={(open) => {
        if (!open) {
          setRejectionDialog(null);
          setRejectionReason('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رد کردن ارسال</DialogTitle>
            <DialogDescription>لطفاً دلیل رد کردن را توضیح دهید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="دلیل رد کردن..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectionDialog(null);
                  setRejectionReason('');
                }}
              >
                انصراف
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectWithReason}
                disabled={!rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                رد کردن
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
