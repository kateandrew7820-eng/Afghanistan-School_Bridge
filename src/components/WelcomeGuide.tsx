import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { School, LayoutDashboard, Menu, Sparkles } from 'lucide-react';

const WELCOME_KEY = 'schoolbridge_welcome_shown';

interface WelcomeGuideProps {
  userName?: string | null;
}

export default function WelcomeGuide({ userName }: WelcomeGuideProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(WELCOME_KEY);
    if (!shown) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl">
            خوش آمدید{userName ? ` ${userName}` : ''}!
          </DialogTitle>
          <DialogDescription className="text-base">
            به سیستم پل آموزش افغانستان خوش آمدید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <LayoutDashboard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">صفحه اصلی شما</p>
              <p className="text-xs text-muted-foreground">تمام معلومات مهم در یک نگاه</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Menu className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">منوی کناری</p>
              <p className="text-xs text-muted-foreground">از منوی کناری برای دسترسی به بخش‌های مختلف استفاده کنید</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <School className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">ارسال معلومات</p>
              <p className="text-xs text-muted-foreground">آمار، گزارش و فورم‌ها را به راحتی ارسال کنید</p>
            </div>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full">
          شروع کنید
        </Button>
      </DialogContent>
    </Dialog>
  );
}