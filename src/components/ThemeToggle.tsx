import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? theme === "dark" : true;

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`${showLabel ? "gap-2 rounded-full transition-colors duration-300" : ""} ${className ?? ""}`}
      aria-label={isDark ? "حالت روشن" : "حالت تاریک"}
      title={isDark ? "حالت روشن" : "حالت تاریک"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel && <span>{isDark ? "حالت روشن" : "حالت تاریک"}</span>}
    </Button>
  );
}
