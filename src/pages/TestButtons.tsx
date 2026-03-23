import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useErrorToast } from "@/lib/errorToast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
} from "lucide-react";

type ButtonStatus = "idle" | "loading" | "success" | "error";

export default function TestButtons() {
  const navigate = useNavigate();
  const { isDemoMode, role, roleTier } = useAuth();
  const { showSuccess, showErrorMessage } = useErrorToast();

  const [buttonStates, setButtonStates] = useState<Record<string, ButtonStatus>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const getState = (id: string) => buttonStates[id] || "idle";

  const simulateAction = async (id: string, label: string) => {
    setButtonStates((p) => ({ ...p, [id]: "loading" }));

    try {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

      if (Math.random() > 0.15) {
        setButtonStates((p) => ({ ...p, [id]: "success" }));
        setMessages((p) => ({ ...p, [id]: `✅ ${label} با موفقیت انجام شد` }));
        showSuccess(`${label} موفقانه انجام شد`, "موفقیت");
      } else {
        throw new Error();
      }
    } catch {
      setButtonStates((p) => ({ ...p, [id]: "error" }));
      setMessages((p) => ({ ...p, [id]: `❌ در اجرای ${label} خطا رخ داد` }));
      showErrorMessage(`خطا در ${label}`, "خطا");
    }

    setTimeout(() => {
      setButtonStates((p) => ({ ...p, [id]: "idle" }));
      setMessages((p) => ({ ...p, [id]: "" }));
    }, 2500);
  };

  const ActionButton = ({
    id,
    label,
    path,
    simulate,
  }: {
    id: string;
    label: string;
    path?: string;
    simulate?: boolean;
  }) => {
    const state = getState(id);

    const handleClick = () => {
      if (simulate) simulateAction(id, label);
      if (path) navigate(path);
    };

    return (
      <div className="space-y-1">
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={state === "loading"}
          onClick={handleClick}
        >
          {state === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {state === "success" && <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />}
          {state === "error" && <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />}
          {state === "idle" && <Play className="mr-2 h-4 w-4" />}
          {label}
        </Button>

        {messages[id] && (
          <p
            className={`text-sm ${
              state === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {messages[id]}
          </p>
        )}
      </div>
    );
  };

  const Section = ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-5">
      <div className="max-w-4xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-bold">🧪 آزمایش دکمه‌ها</h1>
          <p className="text-muted-foreground">
            تمام عملکردهای مربوط به مقام خود را بررسی و آزمایش کنید
          </p>

          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline">مقام: {role || "نامشخص"}</Badge>
            <Badge variant="outline">سطح: {roleTier || "نامشخص"}</Badge>
            {isDemoMode && <Badge className="bg-blue-600">حالت نمایشی</Badge>}
          </div>
        </div>

        {isDemoMode && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              حالت نمایشی فعال است. هیچ داده واقعی ذخیره نمی‌شود.
            </AlertDescription>
          </Alert>
        )}

        {(roleTier === "school" || !roleTier) && (
          <Section title="🏫 داشبورد مکتب" description="عملکردهای مربوط به مکتب">
            <ActionButton id="stats" label="ارسال آمار" path="/school/submit-statistics" />
            <ActionButton id="reports" label="ارسال گزارش" path="/school/submit-reports" />
            <ActionButton id="forms" label="ارسال فورم‌ها" path="/school/submit-forms" />
            <ActionButton id="ann" label="مشاهده اعلانات" path="/school/announcements" />
            <ActionButton id="sim1" label="🧪 تست ارسال" simulate />
          </Section>
        )}

        {(roleTier === "district" || !roleTier) && (
          <Section title="🔷 مدیریت ولسوالی" description="عملکردهای مدیریتی منطقه">
            <ActionButton id="sub" label="مشاهده ارسال‌ها" path="/district/submissions" />
            <ActionButton id="verify" label="تایید اطلاعات" path="/district/verify" />
            <ActionButton id="schools" label="مدیریت مکاتب" path="/district/schools" />
            <ActionButton id="sim2" label="🧪 تست تایید" simulate />
          </Section>
        )}

        {(roleTier === "province" || !roleTier) && (
          <Section title="🔶 مدیریت ولایت" description="نظارت آموزشی در سطح ولایت">
            <ActionButton id="analytics" label="مشاهده آمار" path="/province" />
            <ActionButton id="export" label="صدور اطلاعات" simulate />
          </Section>
        )}

        {(roleTier === "ministry" || !roleTier) && (
          <Section title="👑 وزارت معارف" description="مدیریت کلان سیستم آموزشی">
            <ActionButton id="na" label="آمار ملی" path="/ministry/analytics" />
            <ActionButton id="users" label="مدیریت کاربران" path="/ministry/users" />
            <ActionButton id="rep" label="صدور گزارش‌ها" path="/ministry/export" />
          </Section>
        )}

        <Section title="⚙️ عملکردهای عمومی" description="برای تمام مقام‌ها">
          <ActionButton id="refresh" label="بازخوانی اطلاعات" simulate />
          <ActionButton id="save" label="ذخیره تغییرات" simulate />
          <ActionButton id="download" label="دانلود فایل" simulate />
          <ActionButton id="print" label="چاپ گزارش" simulate />
        </Section>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>راهنمای استفاده</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>✅ دکمه‌های واقعی شما را به صفحات سیستم هدایت می‌کنند.</p>
            <p>🧪 دکمه‌های آزمایشی فقط برای تست عملکرد و نمایش بازخورد هستند.</p>
            <p>⏳ زمان پاسخ‌دهی شبکه به صورت شبیه‌سازی‌شده نمایش داده می‌شود.</p>
            <p>🎨 در حالت نمایشی هیچ داده واقعی ذخیره نمی‌شود.</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
