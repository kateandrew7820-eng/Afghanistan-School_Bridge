import { ShieldCheck } from "lucide-react";

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
  color: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: score as 0 | 1, label: "ضعیف", color: "bg-destructive" };
  if (score === 2) return { score: 2, label: "متوسط", color: "bg-warning" };
  if (score === 3) return { score: 3, label: "خوب", color: "bg-primary" };
  if (score === 4) return { score: 4, label: "قوی", color: "bg-success" };
  return { score: 5, label: "بسیار قوی", color: "bg-success" };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const s = getPasswordStrength(password);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= s.score ? s.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        قدرت رمز: {s.label}
      </p>
    </div>
  );
}
