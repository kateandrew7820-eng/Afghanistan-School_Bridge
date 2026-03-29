import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LocalizationContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  AlertTriangle,
  Users,
  Building2,
  TrendingUp,
  Crown,
  User,
  TestTube,
} from "lucide-react";

const DEMO_ROLES = [
  {
    id: "teacher",
    label: "معلم",
    description: "دسترسی معلم به فعالیت‌های آموزشی مکتب",
    icon: User,
    tier: "school",
  },
  {
    id: "principal",
    label: "مدیریت مکتب",
    description: "مدیریت معلمان و سیستم مکتب",
    icon: Users,
    tier: "school",
  },
  {
    id: "district_admin",
    label: "ریاست ولسوالی",
    description: "مدیریت مکاتب در سطح ولسوالی",
    icon: Building2,
    tier: "district",
  },
  {
    id: "province_admin",
    label: "ریاست ولایت",
    description: "مدیریت سیستم آموزشی ولایت",
    icon: TrendingUp,
    tier: "province",
  },
  {
    id: "ministry_admin",
    label: "وزارت معارف",
    description: "مدیریت سیستم آموزشی کشور",
    icon: Crown,
    tier: "ministry",
  },
];

export default function Demo() {
  const navigate = useNavigate();

  const auth = useAuth();
  const { t } = useTranslation();

  const setDemoMode = auth?.setDemoMode;

  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSelectRole = (roleId: string) => {
    const role = DEMO_ROLES.find((r) => r.id === roleId);
    if (!role || !setDemoMode) return;

    setDemoMode(roleId as any, role.tier as any);

    const routes: Record<string, string> = {
      school: "/school",
      district: "/district",
      province: "/province",
      ministry: "/ministry",
    };

    navigate(routes[role.tier]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center gap-4">
            <Building2 className="h-12 w-12 text-primary animate-pulse" />
            <Users className="h-12 w-12 text-primary animate-pulse" />
          </div>

          <h1 className="text-3xl font-bold">{t("app.title")}</h1>
          <p className="text-muted-foreground">Demo Mode – Testing System Roles</p>
        </div>

        {/* Warning */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            ⚠️ حالت آزمایشی. هیچ داده واقعی ذخیره نمی‌شود.
          </AlertDescription>
        </Alert>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEMO_ROLES.map((role) => {
            const Icon = role.icon;
            const active = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`cursor-pointer transition ${
                  active
                    ? "border-primary bg-primary/10 shadow-md"
                    : "hover:border-primary/40 hover:bg-accent"
                }`}
              >
                <CardHeader className="flex flex-row justify-between items-start gap-4">
                  <div>
                    <CardTitle>{role.label}</CardTitle>
                    <CardDescription className="mt-1">
                      {role.description}
                    </CardDescription>
                  </div>
                  <Icon className="h-6 w-6 text-primary" />
                </CardHeader>

                <CardContent className="text-xs text-muted-foreground">
                  Access Level: {role.tier}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">

          <Button
            disabled={!selectedRole}
            size="lg"
            onClick={() => selectedRole && handleSelectRole(selectedRole)}
          >
            ورود به داشبورد
          </Button>

          <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
            بازگشت
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/test-buttons")}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Test UI
          </Button>

        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground bg-muted p-4 rounded-lg">
          Demo mode uses simulated data for testing system dashboards.
        </div>

      </div>
    </div>
  );
}
