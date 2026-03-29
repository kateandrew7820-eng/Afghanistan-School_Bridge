import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { useVerification } from '@/hooks/useVerification';
import { supabase } from '@/lib/supabase';
import { VerificationPanel } from '@/components/VerificationPanel';
import WelcomeGuide from '@/components/WelcomeGuide';
import { getVerificationQueueFilter } from '@/lib/verificationHierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, FileText, ClipboardList, Bell, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function SchoolDashboard() {
  const { profile, role } = useAuth();
  const { t } = useTranslation();
  const verification = useVerification();

  const [openSend, setOpenSend] = useState(false);
  const sendRef = useRef<HTMLDivElement>(null);

  const [announcements, setAnnouncements] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  const verificationQueueRole = useMemo(
    () => (role ? getVerificationQueueFilter(role) : null),
    [role]
  );

  // outside click close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!sendRef.current?.contains(e.target as Node)) {
        setOpenSend(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const [a, d] = await Promise.all([
        supabase.from('announcements').select('*').eq('is_published', true).limit(3),
        supabase.from('deadlines').select('*').eq('is_active', true).limit(5),
      ]);
      if (a.data) setAnnouncements(a.data);
      if (d.data) setDeadlines(d.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const sendItems = [
    { href: '/school/statistics', icon: BarChart3, title: 'ارسال آمار', sub: 'ثبت تعداد شاگردان' },
    { href: '/school/reports', icon: FileText, title: 'ارسال گزارش‌ها', sub: 'گزارش ماهانه' },
    { href: '/school/forms', icon: ClipboardList, title: 'ارسال فورم‌ها', sub: 'تکمیل فورم‌ها' },
  ];

  return (
    <div className="space-y-6">
      <WelcomeGuide userName={profile?.full_name} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('school.dashboard')}</h1>
        <p className="text-xs text-muted-foreground">
          {profile?.schools?.name} — {profile?.schools?.province}
        </p>
      </div>

      {/* SEND CARD (MAIN UX) */}
      <div ref={sendRef}>
        <div
          onClick={() => setOpenSend(!openSend)}
          className="relative cursor-pointer rounded-3xl p-6 text-white 
          bg-gradient-to-br from-indigo-600 via-slate-900 to-cyan-500
          shadow-xl hover:scale-[1.015] transition-all duration-300 overflow-hidden"
        >
          {/* subtle glow effect */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

          <div className="relative z-10">
            <h2 className="text-lg font-bold tracking-wide">ارسال 📤</h2>
            <p className="text-xs opacity-80">Submit data, reports, forms</p>

            {/* Expand */}
            <div className={`overflow-hidden transition-all duration-500 ${openSend ? 'max-h-80 mt-4' : 'max-h-0'}`}>
              <div className="grid gap-3">
                {sendItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3 p-4 rounded-2xl 
                      bg-white/10 backdrop-blur-md 
                      hover:bg-white/20 active:scale-[0.98]
                      transition-all duration-200"
                    >
                      <Icon className="h-5 w-5 text-cyan-300" />
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs opacity-70">{item.sub}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ANNOUNCEMENTS */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">اطلاعیه‌ها</CardTitle>
          </div>
          <Link to="/school/announcements">
            <Button size="sm" variant="ghost">همه</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-20 w-full" /> : announcements.map((a: any) => (
            <div key={a.id} className="p-3 rounded-xl border hover:bg-muted transition mb-2">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* DEADLINES */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <CardTitle className="text-sm">ددلاین‌ها</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-20 w-full" /> : deadlines.map((d: any) => (
            <div key={d.id} className="p-3 rounded-xl border hover:bg-muted transition mb-2">
              <p className="text-sm font-medium">{d.title}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(d.due_date), 'MMM dd')}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* VERIFIED */}
      {verification.isVerified && (
        <div className="p-4 rounded-2xl bg-green-100 flex items-center gap-2">
          <CheckCircle2 className="text-green-600" />
          <p className="text-sm">Account verified</p>
        </div>
      )}

      {/* QUEUE */}
      {verificationQueueRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Verification Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VerificationPanel filterRole={verificationQueueRole} limit={10} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}