import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Users, Building2, TrendingUp, Crown, User, ArrowLeft, ArrowRight, School } from 'lucide-react';

const DEMO_ROLES = [
  { id: 'teacher', label: 'معلم', icon: User, tier: 'school', tone: 'text-primary bg-primary/10', description: 'ارسال آمار، گزارش‌ها و اطلاعات مکتب' },
  { id: 'principal', label: 'مدیریت مکتب', icon: Users, tier: 'school', tone: 'text-accent bg-accent/10', description: 'پیگیری ارسال‌ها و عملکرد مکتب' },
  { id: 'district_admin', label: 'ریاست ولسوالی', icon: Building2, tier: 'district', tone: 'text-success bg-success/10', description: 'بررسی اطلاعات و وضعیت مکاتب ولسوالی' },
  { id: 'province_admin', label: 'ریاست ولایت', icon: TrendingUp, tier: 'province', tone: 'text-primary bg-primary/10', description: 'نمای کلی ولسوالی‌ها و مکاتب ولایت' },
  { id: 'ministry_admin', label: 'وزارت معارف', icon: Crown, tier: 'ministry', tone: 'text-warning bg-warning/10', description: 'آمار ملی، تأیید اطلاعات و گزارش‌ها' },
] as const;

export default function Demo() {
  const navigate = useNavigate();
  const { setDemoMode } = useAuth();
  const handleClick = (role: typeof DEMO_ROLES[number]) => {
    setDemoMode(role.id, role.tier);
    navigate(`/${role.tier}`);
  };
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Helmet><title>حالت نمایشی | پل آموزش افغانستان</title></Helmet>
      <header className="border-b bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold"><School className="h-6 w-6 text-primary" />پل آموزش افغانستان</Link>
        <div className="flex items-center gap-2"><ThemeToggle /><Button asChild variant="ghost" size="sm"><Link to="/"><ArrowRight />بازگشت</Link></Button></div>
      </div></header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 max-w-2xl space-y-3">
          <p className="text-sm font-medium text-primary">حالت نمایشی</p>
          <h1>پورتال از نگاه شما</h1>
          <p className="text-sm text-muted-foreground">از معلم تا وزارت معارف؛ یک پیوند برای آموزش افغانستان.</p>
          <p className="flex items-center gap-2 text-xs text-warning"><span className="h-1.5 w-1.5 rounded-full bg-warning" />داده‌های نمونه — تغییرات ذخیره نمی‌شود</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_ROLES.map((role, index) => <Card key={role.id} className="flex min-h-[235px] flex-col p-5">
            <div className="mb-5 flex items-center justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-lg ${role.tone}`}><role.icon className="h-5 w-5" /></div><span className="text-xs text-muted-foreground">{(index + 1).toLocaleString('fa-AF')}</span></div>
            <h2 className="mb-2 text-lg">{role.label}</h2>
            <p className="mb-5 text-sm text-muted-foreground">{role.description}</p>
            <Button variant="outline" className="mt-auto w-full justify-between" onClick={() => handleClick(role)} aria-label={`نمایش ${role.label}`}>ورود به نمایش<ArrowLeft /></Button>
          </Card>)}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t pt-6"><Button asChild><Link to="/signup">ایجاد حساب</Link></Button><Button asChild variant="ghost"><Link to="/login">ورود به حساب</Link></Button><Button asChild variant="ghost"><Link to="/roadmap">نقشه راه<ArrowLeft /></Link></Button></div>
      </main>
    </div>
  );
}
