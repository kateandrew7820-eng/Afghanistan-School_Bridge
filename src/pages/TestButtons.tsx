import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useErrorToast } from "@/lib/errorToast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  CheckCircle2, AlertTriangle, Loader2, Play, Info, X
} from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export default function TestButtons() {
  const navigate = useNavigate();
  const { isDemoMode, role, roleTier } = useAuth();
  const { showSuccess, showErrorMessage } = useErrorToast();

  const [state, setState] = useState<Record<string, Status>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [guideOpen, setGuideOpen] = useState(false);

  const simulate = async (id: string, label: string) => {
    setState(p => ({ ...p, [id]: "loading" }));

    try {
      await new Promise(r => setTimeout(r, 700 + Math.random() * 1000));

      if (Math.random() > 0.15) {
        setState(p => ({ ...p, [id]: "success" }));
        setMsg(p => ({ ...p, [id]: `✅ ${label} انجام شد` }));
        showSuccess(label);
      } else throw new Error();
    } catch {
      setState(p => ({ ...p, [id]: "error" }));
      setMsg(p => ({ ...p, [id]: `❌ خطا در ${label}` }));
      showErrorMessage(label);
    }

    setTimeout(() => {
      setState(p => ({ ...p, [id]: "idle" }));
      setMsg(p => ({ ...p, [id]: "" }));
    }, 2000);
  };

  const Action = ({ id, label, path, simulateMode }: any) => {
    const s = state[id] || "idle";

    return (
      <div className="space-y-1 group">
        <Button
          onClick={() => {
            if (simulateMode) simulate(id, label);
            if (path) navigate(path);
          }}
          disabled={s === "loading"}
          className="w-full justify-start transition-all duration-300 hover:scale-[1.02]"
          variant="outline"
        >
          {s === "loading" && <Loader2 className="mr-2 animate-spin" />}
          {s === "success" && <CheckCircle2 className="mr-2 text-success" />}
          {s === "error" && <AlertTriangle className="mr-2 text-destructive" />}
          {s === "idle" && <Play className="mr-2" />}
          {label}
        </Button>

        {/* feedback */}
        {msg[id] && (
          <div className="h-1 bg-muted rounded overflow-hidden">
            <div className={`h-full ${
              s === "success" ? "bg-success" : "bg-destructive"
            } w-full animate-pulse`} />
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, color, children }: any) => (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition">
      <div className={`h-1 bg-gradient-to-r ${color}`} />
      <CardContent className="p-5 space-y-3">
        <h3 className="font-semibold">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-5">

      {/* 🔘 Floating Guide Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button size="icon" variant="secondary" onClick={() => setGuideOpen(true)}>
          <Info className="w-4 h-4" />
        </Button>
      </div>

      {/* 📌 Guide Popup */}
      {guideOpen && (
        <div className="fixed top-16 right-4 w-72 bg-white shadow-xl rounded-xl p-4 z-50 animate-in fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">راهنما</span>
            <X className="cursor-pointer w-4" onClick={() => setGuideOpen(false)} />
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <p>✅ دکمه‌ها → انتقال یا تست</p>
            <p>🧪 تست‌ها → شبیه‌سازی</p>
            <p>⚡ سریع، بدون ذخیره واقعی</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">🧪 تست سیستم</h1>

          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">مقام: {role || "-"}</Badge>
            <Badge variant="outline">سطح: {roleTier || "-"}</Badge>
            {isDemoMode && <Badge className="bg-primary">Demo</Badge>}
          </div>
        </div>

        {/* Sections */}

        {(roleTier === "school" || !roleTier) && (
          <Section title="🏫 مکتب" color="from-primary to-primary">
            <Action id="s1" label="ارسال آمار" path="/school/submit-statistics" />
            <Action id="s2" label="ارسال گزارش" path="/school/submit-reports" />
            <Action id="s3" label="فورم‌ها" path="/school/submit-forms" />
            <Action id="s4" label="اعلانات" path="/school/announcements" />
            <Action id="s5" label="تست ارسال" simulateMode />
          </Section>
        )}

        {(roleTier === "district" || !roleTier) && (
          <Section title="🏢 ولسوالی" color="from-success to-success">
            <Action id="d1" label="ارسال‌ها" path="/district/submissions" />
            <Action id="d2" label="تایید" path="/district/verify" />
            <Action id="d3" label="مکاتب" path="/district/schools" />
            <Action id="d4" label="تست تایید" simulateMode />
          </Section>
        )}

        {(roleTier === "province" || !roleTier) && (
          <Section title="🌍 ولایت" color="from-purple-400 to-purple-600">
            <Action id="p1" label="آمار" path="/province" />
            <Action id="p2" label="Export" simulateMode />
          </Section>
        )}

        {(roleTier === "ministry" || !roleTier) && (
          <Section title="👑 وزارت" color="from-warning to-orange-500">
            <Action id="m1" label="ملی" path="/ministry/analytics" />
            <Action id="m2" label="کاربران" path="/ministry/users" />
            <Action id="m3" label="گزارش" path="/ministry/export" />
          </Section>
        )}

        <Section title="⚙️ عمومی" color="from-gray-400 to-gray-600">
          <Action id="g1" label="Refresh" simulateMode />
          <Action id="g2" label="Save" simulateMode />
          <Action id="g3" label="Download" simulateMode />
          <Action id="g4" label="Print" simulateMode />
        </Section>

        {/* Back */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            بازگشت
          </Button>
        </div>

      </div>
    </div>
  );
}