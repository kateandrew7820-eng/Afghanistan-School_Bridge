import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { School, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/contexts/LocalizationContext";

interface AuthShellProps {
  title: string;
  description?: string;
  showStats?: boolean;
  children: ReactNode;
}

/**
 * Shared chrome for all auth screens (/login, /signup, /forgot-password,
 * /reset-password, /verify-email). RTL, branded gradient background, single
 * column. Keeps each screen page-light.
 */
export function AuthShell({ title, description, showStats = false, children }: AuthShellProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-hero relative" dir="rtl">
      <Helmet>
        <title>{title} | پل آموزش افغانستان</title>
        {description && <meta name="description" content={description} />}
      </Helmet>

      {/* Subtle decorative blur orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <School className="h-5 w-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-sm sm:text-base">
            {t("app.title")}
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex items-start justify-center px-4 pb-16 pt-4 sm:pt-10">
        <div className="w-full max-w-md space-y-6">{children}</div>
      </main>

      {showStats && (
        <div className="px-4 pb-10 -mt-6">
          <div className="mx-auto max-w-md grid grid-cols-3 gap-4 text-center">
            <Stat label="مکتب" value="۲۰٬۰۰۰+" />
            <Stat label="ولایت" value="۳۴" />
            <Stat label="شاگرد" value="۱۱٫۷M+" />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
