import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, KeyRound, Layers, ShieldCheck, Sparkles, FileText, Download } from 'lucide-react';

const NESP_PDF = '/docs/National-Education-Strategic-Plan-for-Afghanistan.pdf';

export default function Help() {
  const [showPdf, setShowPdf] = useState(false);

  return (
    <div className="min-h-screen bg-background py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6" />راهنما</h1>
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 ml-1" />بازگشت</Button></Link>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" />نقش‌ها و گردش کار</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2 leading-7">
            <p><b>مکتب (معلم/مدیر):</b> ارسال آمار، گزارش‌ها و فورم‌ها.</p>
            <p><b>ولسوالی:</b> ثبت مکاتب جدید، بررسی و تأیید/رد ارسال‌های مکاتب.</p>
            <p><b>ولایت:</b> تأیید نهایی مکاتب، تحلیل ولسوالی‌ها، تأیید ارسال‌ها.</p>
            <p><b>وزارت:</b> نظارت ملی، خروجی‌گیری، مدیریت کاربران و نقش‌ها.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              اسناد ملی — پلان ستراتیژی معارف (NESP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-7 text-muted-foreground">
              سند رسمی وزارت معارف؛ شامل اهداف ملی برای ثبت‌نام، معلمان، زیربناء، سواد و کیفیت آموزش.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setShowPdf(s => !s)}>
                {showPdf ? 'بستن سند' : 'مشاهده سند'}
              </Button>
              <a href={NESP_PDF} download>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 ml-1" />دانلود PDF
                </Button>
              </a>
            </div>
            {showPdf && (
              <div className="border rounded-lg overflow-hidden mt-3" style={{ height: '70vh' }}>
                <iframe
                  src={NESP_PDF}
                  title="National Education Strategic Plan for Afghanistan"
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" />میانبرها</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><kbd className="border rounded px-1.5 py-0.5 text-xs">Ctrl/⌘ + K</kbd> — جستجو و رفتن سریع</div>
            <div><kbd className="border rounded px-1.5 py-0.5 text-xs">Esc</kbd> — بستن پنجره‌ها</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" />امنیت</CardTitle></CardHeader>
          <CardContent className="text-sm leading-7">
            تمامی داده‌ها با Row-Level Security محافظت می‌شوند. کاربران فقط داده‌های مربوط به ولسوالی/ولایت خود را می‌بینند. تغییر نقش فقط توسط وزارت ممکن است.
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" />ویژگی‌های هوشمند</CardTitle></CardHeader>
          <CardContent className="text-sm leading-7 space-y-1">
            <p>• ذخیره خودکار مسوده فورم‌ها در دستگاه شما.</p>
            <p>• حافظه فیلترها بین صفحات.</p>
            <p>• به‌روزرسانی لحظه‌ای ارسال‌ها.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
