import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { School, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import schoolCourtyard from '@/assets/school-courtyard.jpg';

interface AuthShellProps {
  title: string;
  description?: string;
  showStats?: boolean;
  children: ReactNode;
}

export function AuthShell({ title, description, showStats = false, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Helmet><title>{title} | پل آموزش افغانستان</title>{description && <meta name="description" content={description} />}</Helmet>
      <header className="border-b bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold sm:text-base"><School className="h-7 w-7 shrink-0 text-primary" />پل آموزش افغانستان</Link>
        <div className="flex items-center gap-1"><ThemeToggle /><Button asChild variant="ghost" size="sm"><Link to="/"><ArrowRight /><span className="hidden sm:inline">صفحه اصلی</span></Link></Button></div>
      </div></header>
      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-2 lg:gap-20">
        <section className="auth-surface mx-auto w-full max-w-md space-y-7 lg:py-4" aria-label={title}>{children}</section>
        <aside className="hidden space-y-6 lg:block">
          <img src={schoolCourtyard} alt="تصویر بازآفرینی‌شده از شاگردان یک مکتب افغانستان" width={1536} height={1024} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
          <div className="space-y-3 border-s-2 border-primary ps-5"><p className="text-xs font-medium text-primary">از مکتب تا وزارت معارف</p><h2 className="text-2xl">یک پیوند برای آینده آموزش</h2><p className="text-sm text-muted-foreground">داده‌های دقیق، تصمیم‌های بهتر و مکاتب توانمندتر.</p></div>
          {showStats && <div className="grid grid-cols-3 border-t pt-5"><Stat label="مکتب" value="۱۸٬۰۰۰+" /><Stat label="ولایت" value="۳۴" /><Stat label="شاگرد" value="۱۱٫۷ میلیون+" /></div>}
        </aside>
      </main>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="space-y-1"><p className="text-lg font-bold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}
