import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Countdown hook used for resend buttons (signup confirmation, forgot
 * password, verify email). Returns the remaining seconds and a start() fn.
 */
export function useCooldown(seconds: number = 60) {
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<number | null>(null);

  const clear = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(() => {
    clear();
    setRemaining(seconds);
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clear();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }, [seconds]);

  useEffect(() => clear, []);

  return { remaining, isActive: remaining > 0, start };
}
