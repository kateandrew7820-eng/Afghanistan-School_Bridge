import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Circle, Loader2 } from 'lucide-react';

const items = [
  { phase: 'منتشر شد', status: 'done', title: 'احراز هویت و نقش‌ها', desc: 'ورود ایمیلی، تأیید توسط وزارت، نقش‌های چهارلایه' },
  { phase: 'منتشر شد', status: 'done', title: 'گردش کار ارسال', desc: 'مکتب → ولسوالی → ولایت با تأیید/رد' },
  { phase: 'منتشر شد', status: 'done', title: 'مدیریت مکاتب', desc: 'ثبت توسط ولسوالی، تأیید توسط ولایت' },
  { phase: 'منتشر شد', status: 'done', title: 'جدول‌های مرجع ولایات و ولسوالی‌ها', desc: 'با ۳۴ ولایت افغانستان' },
  { phase: 'منتشر شد', status: 'done', title: 'پالت دستورات (⌘K)', desc: 'دسترسی سریع به همه صفحات' },
  { phase: 'منتشر شد', status: 'done', title: 'خروجی Excel و CSV', desc: 'گزارش‌گیری چندبرگه' },
  { phase: 'در حال انجام', status: 'in', title: 'مرکز اعلان‌ها', desc: 'اعلان لحظه‌ای ارسال‌های جدید' },
  { phase: 'در حال انجام', status: 'in', title: 'حافظه کوتاه‌مدت', desc: 'ذخیره مسوده فورم و فیلترها' },
  { phase: 'برنامه‌ریزی', status: 'todo', title: 'برنامه آفلاین (PWA)', desc: 'ارسال در شرایط اینترنت ضعیف' },
  { phase: 'برنامه‌ریزی', status: 'todo', title: 'تحلیل پیشرفته', desc: 'نمودارهای ملی و حرارتی ولایت‌ها' },
  { phase: 'برنامه‌ریزی', status: 'todo', title: 'پشتی‌بانی پشتو', desc: 'دو زبانه دری/پشتو' },
];

const icon = (s: string) => s === 'done' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : s === 'in' ? <Loader2 className="h-4 w-4 text-amber-600 animate-spin" /> : <Circle className="h-4 w-4 text-muted-foreground" />;

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background py-10 px-4" dir="rtl">
      <Helmet>
        <title>نقشه راه محصول | پل آموزش افغانستان</title>
        <meta name="description" content="نقشه راه پورتال داده‌های مکاتب افغانستان: ویژگی‌های منتشر شده، در حال انجام و برنامه‌ریزی‌شده مانند PWA آفلاین و پشتیبانی پشتو." />
        <link rel="canonical" href="https://schoolbridge-afg.lovable.app/roadmap" />
        <meta property="og:title" content="نقشه راه محصول | پل آموزش افغانستان" />
        <meta property="og:description" content="ویژگی‌های منتشر شده، در حال انجام و برنامه‌ریزی‌شده پورتال داده‌های مکاتب افغانستان." />
        <meta property="og:url" content="https://schoolbridge-afg.lovable.app/roadmap" />
      </Helmet>
      <main className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">نقشه راه</h1>
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 ml-1" />بازگشت</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">مسیر تولید</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50">
                {icon(it.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{it.title}</p>
                    <Badge variant="outline" className="text-[10px]">{it.phase}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{it.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
