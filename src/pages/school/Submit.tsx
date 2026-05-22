import { lazy, Suspense, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, FileText, ClipboardList, Send } from 'lucide-react';

const SubmitStatistics = lazy(() => import('./SubmitStatistics'));
const SubmitReports = lazy(() => import('./SubmitReports'));
const SubmitForms = lazy(() => import('./SubmitForms'));

type TabKey = 'statistics' | 'reports' | 'forms';
const VALID: TabKey[] = ['statistics', 'reports', 'forms'];

function Fallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  );
}

/**
 * Unified School Submission Workspace.
 * Replaces /school/statistics, /school/reports, /school/forms with a single
 * workspace and ?tab= query param so context and draft state can be shared
 * across submission types in the future.
 */
export default function SchoolSubmitWorkspace() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab') as TabKey | null;
  const active: TabKey = useMemo(() => (raw && VALID.includes(raw) ? raw : 'statistics'), [raw]);

  const setActive = (next: string) => {
    const p = new URLSearchParams(params);
    p.set('tab', next);
    setParams(p, { replace: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold leading-tight">
            ارسال اطلاعات مکتب
          </h1>
          <p className="text-sm text-muted-foreground">
            آمار، گزارش‌ها و فورم‌ها را از همین صفحه ارسال کنید
          </p>
        </div>
      </div>

      <Tabs value={active} onValueChange={setActive} dir="rtl" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">آمار</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">گزارش‌ها</span>
          </TabsTrigger>
          <TabsTrigger value="forms" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">فورم‌ها</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="mt-5">
          <Suspense fallback={<Fallback />}>
            <SubmitStatistics />
          </Suspense>
        </TabsContent>
        <TabsContent value="reports" className="mt-5">
          <Suspense fallback={<Fallback />}>
            <SubmitReports />
          </Suspense>
        </TabsContent>
        <TabsContent value="forms" className="mt-5">
          <Suspense fallback={<Fallback />}>
            <SubmitForms />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
