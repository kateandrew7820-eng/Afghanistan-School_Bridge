import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LocalizationContext";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Users, Building2, TrendingUp, Crown, User, TestTube
} from "lucide-react";

const DEMO_ROLES = [
  { id: "teacher", label: "معلم", icon: User, tier: "school", color: "from-primary to-primary" },
  { id: "principal", label: "مدیریت مکتب", icon: Users, tier: "school", color: "from-accent to-accent" },
  { id: "district_admin", label: "ریاست ولسوالی", icon: Building2, tier: "district", color: "from-success to-success" },
  { id: "province_admin", label: "ریاست ولایت", icon: TrendingUp, tier: "province", color: "from-accent to-accent" },
  { id: "ministry_admin", label: "وزارت معارف", icon: Crown, tier: "ministry", color: "from-warning to-warning" },
];

export default function Demo() {
  const navigate = useNavigate();
  const { setDemoMode } = useAuth();
  const { t } = useTranslation();

  // Gate demo mode to development only
  if (import.meta.env.MODE !== 'development') {
    navigate('/login');
    return null;
  }

  const routes: Record<string, string> = {
    school: "/school",
    district: "/district",
    province: "/province",
    ministry: "/ministry",
  };

  const handleClick = (role: any) => {
    setDemoMode?.(role.id as any, role.tier as any);

    // smooth delay for UX feel
    setTimeout(() => {
      navigate(routes[role.tier]);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">

      {/* 🔝 Sticky Top Bar */}
      <div className="sticky top-0 z-50 backdrop-blur bg-background/70 border-b flex justify-between items-center px-6 py-3">
        <h1 className="font-bold text-lg">{t("app.title")}</h1>

        <Button
          variant="secondary"
          onClick={() => navigate("/test-buttons")}
          className="flex items-center gap-2"
        >
          <TestTube className="w-4 h-4" />
          Test UI
        </Button>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">انتخاب نقش</h2>
          <p className="text-muted-foreground text-sm">
            فقط کلیک کنید و مستقیم واردش شوید 🚀
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_ROLES.map((role) => {
            const Icon = role.icon;

            return (
              <Card
                key={role.id}
                onClick={() => handleClick(role)}
                className="cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 overflow-hidden"
              >
                <CardContent className="p-0">

                  {/* Gradient top */}
                  <div className={`h-2 bg-gradient-to-r ${role.color}`} />

                  <div className="p-5 space-y-4">

                    <div className="flex justify-between items-center">
                      <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition" />
                      <span className="text-xs text-muted-foreground">
                        {role.tier}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">
                        {role.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        ورود مستقیم به دشبورد
                      </p>
                    </div>

                    {/* Progress-style bar (Duolingo feel) */}
                    <div className="h-1 bg-muted rounded overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${role.color} w-0 group-hover:w-full transition-all duration-500`} />
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Back */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => navigate("/login")}>
            بازگشت
          </Button>
        </div>

      </div>
    </div>
  );
}
