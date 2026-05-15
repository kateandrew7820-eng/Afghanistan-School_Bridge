import { useState } from 'react';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, BarChart3, ClipboardList, FileSpreadsheet, Loader2 } from 'lucide-react';
import { TYPE_LABELS, STATUS_CONFIG } from '@/lib/statusConfig';
import { exportToXlsx } from '@/lib/exportXlsx';

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}
function downloadCSV(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function MinistryExport() {
  const { data, loading } = useSubmissions({});
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<string>('all');

  const rows = (data?.submissions ?? []).filter(s => {
    if (status !== 'all' && s.status !== status) return false;
    const d = new Date(s.created_at);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + 'T23:59:59')) return false;
    return true;
  });

  const exportCsv = (type: 'all' | 'statistics' | 'report' | 'form') => {
    setExporting(true);
    try {
      const filtered = type === 'all' ? rows : rows.filter(s => s.type === type);
      const headers = ['شناسه', 'نوع', 'وضعیت', 'ولایت', 'ولسوالی', 'تاریخ ایجاد'];
      const csv = toCSV(headers, filtered.map(s => [
        s.id, TYPE_LABELS[s.type] ?? s.type, STATUS_CONFIG[s.status]?.label ?? s.status,
        s.province ?? '', s.district ?? '', s.created_at,
      ]));
      downloadCSV(`submissions-${type}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast({ title: 'موفقیت', description: `${filtered.length} رکورد دانلود شد` });
    } finally { setExporting(false); }
  };

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const grouped = {
        همه: rows.map(s => ({
          شناسه: s.id, نوع: TYPE_LABELS[s.type] ?? s.type,
          وضعیت: STATUS_CONFIG[s.status]?.label ?? s.status,
          ولایت: s.province ?? '', ولسوالی: s.district ?? '', تاریخ: s.created_at,
        })),
        آمار: rows.filter(s => s.type === 'statistics').map(s => ({
          شناسه: s.id, ولایت: s.province ?? '', ولسوالی: s.district ?? '', تاریخ: s.created_at,
        })),
        گزارش‌ها: rows.filter(s => s.type === 'report').map(s => ({
          شناسه: s.id, ولایت: s.province ?? '', ولسوالی: s.district ?? '', تاریخ: s.created_at,
        })),
        فورم‌ها: rows.filter(s => s.type === 'form').map(s => ({
          شناسه: s.id, ولایت: s.province ?? '', ولسوالی: s.district ?? '', تاریخ: s.created_at,
        })),
      };
      await exportToXlsx(`SchoolBridge-${new Date().toISOString().slice(0, 10)}.xlsx`, grouped);
      toast({ title: 'موفقیت', description: 'فایل Excel دانلود شد' });
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Download className="h-6 w-6" />خروجی‌گیری</h1>
        <p className="text-muted-foreground">داده‌های ارسال‌ها را به Excel یا CSV دانلود کنید</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">فیلترها</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">از تاریخ</Label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">تا تاریخ</Label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">وضعیت</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="approved">تأیید شده</SelectItem>
                <SelectItem value="rejected">رد شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-primary" />Excel کامل</CardTitle>
          <CardDescription>{rows.length} رکورد در ۴ شیت جداگانه</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportXlsx} disabled={loading || exporting || rows.length === 0}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <FileSpreadsheet className="h-4 w-4 ml-1" />}
            دانلود XLSX
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          { type: 'all', label: 'همه (CSV)', icon: Download, count: rows.length },
          { type: 'statistics', label: 'آمار (CSV)', icon: BarChart3, count: rows.filter(s => s.type === 'statistics').length },
          { type: 'report', label: 'گزارش‌ها (CSV)', icon: FileText, count: rows.filter(s => s.type === 'report').length },
          { type: 'form', label: 'فورم‌ها (CSV)', icon: ClipboardList, count: rows.filter(s => s.type === 'form').length },
        ] as const).map(item => (
          <Card key={item.type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><item.icon className="h-4 w-4" />{item.label}</CardTitle>
              <CardDescription>{item.count} رکورد</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" className="w-full"
                disabled={loading || exporting || item.count === 0}
                onClick={() => exportCsv(item.type as any)}>
                <Download className="h-4 w-4 ml-1" />CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
