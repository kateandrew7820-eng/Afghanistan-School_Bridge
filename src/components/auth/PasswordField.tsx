import { forwardRef, useState, useEffect, InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  showCapsLockWarning?: boolean;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ id, label, error, hint, showCapsLockWarning, className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const [capsOn, setCapsOn] = useState(false);

    useEffect(() => {
      if (!showCapsLockWarning) return;
      const onKey = (e: KeyboardEvent) => {
        if (typeof e.getModifierState === "function") {
          setCapsOn(e.getModifierState("CapsLock"));
        }
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);
      return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("keyup", onKey);
      };
    }, [showCapsLockWarning]);

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          {label}
        </Label>
        <div className="relative">
          <Input
            {...props}
            id={id}
            ref={ref}
            type={show ? "text" : "password"}
            dir="ltr"
            className={cn("h-11 pl-10", error && "border-destructive", className)}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            tabIndex={-1}
            aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {capsOn && (
          <p className="text-xs text-warning">⚠️ Caps Lock فعال است</p>
        )}
        {error ? (
          <p id={`${id}-error`} className="text-sm text-destructive animate-in slide-in-from-top-1">
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";
