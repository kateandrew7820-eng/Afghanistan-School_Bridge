import { useState } from 'react';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, BarChart3, ClipboardList, Loader2 } from 'lucide-react';
import { TYPE_LABELS, STATUS_CONFIG } from '@/lib/statusConfig';

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MinistryExport() {
  const { data, loading } = useSubmissions({});
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = (type: 'all' | 'statistics' | 'report' | 'form') => {
    if (!data) return;
    setExporting(true);
    try {
      const filtered = type === 'all' ? data.submissions : data.submissions.filter(s => s.type === type);
      const headers = ['شناسه', 'نوع', 'وضعیت', 'ولایت', 'ولسوالی', 'تاریخ ایجاد'];
      const rows = filtered.map(s => [
        s.id,
        TYPE_LABELS[s.type] ?? s.type,
        STATUS_CONFIG[s.status]?.label ?? s.status,
        s.province ?? '',
        s.district ?? '',
        s.created_at,
      ]);
      const csv = toCSV(headers, rows);
      const filename = `submissions-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(filename, csv);
      toast({ title: 'موفقیت', description: `${filtered.length} رکورد خروجی گرفته شد` });
    } catch {
      toast({ title: 'خطا', description: 'خطا در خروجی‌گیری', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Download className="h-6 w-6" />
          خروجی‌گیری
        </h1>
        <p className="text-muted-foreground">داده‌های ارسال‌ها را به صورت CSV دانلود کنید</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { type: 'all' as const, label: 'همه ارسال‌ها', icon: Download, count: data?.stats.total ?? 0 },
          { type: 'statistics' as const, label: 'آمار', icon: BarChart3, count: data?.submissions.filter(s => s.type === 'statistics').length ?? 0 },
          { type: 'report' as const, label: 'گزارش‌ها', icon: FileText, count: data?.submissions.filter(s => s.type === 'report').length ?? 0 },
          { type: 'form' as const, label: 'فورم‌ها', icon: ClipboardList, count: data?.submissions.filter(s => s.type === 'form').length ?? 0 },
        ].map(item => (
          <Card key={item.type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </CardTitle>
              <CardDescription>{item.count} رکورد</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                className="w-full"
                disabled={loading || exporting || item.count === 0}
                onClick={() => handleExport(item.type)}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Download className="h-4 w-4 ml-1" />}
                دانلود CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
