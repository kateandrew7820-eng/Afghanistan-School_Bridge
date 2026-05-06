import { useEffect, useRef, useState } from 'react';

/**
 * Persists a form value to localStorage with debounce.
 * Returns [value, setValue, clear, hasDraft].
 */
export function useDraft<T extends Record<string, any>>(key: string, initial: T) {
  const storageKey = `draft:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return { ...initial, ...JSON.parse(raw) } as T;
    } catch { /* ignore */ }
    return initial;
  });
  const hadDraft = useRef<boolean>(!!localStorage.getItem(storageKey));
  const timer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* ignore */ }
    }, 600);
    return () => window.clearTimeout(timer.current);
  }, [value, storageKey]);

  const clear = () => { localStorage.removeItem(storageKey); hadDraft.current = false; };
  return [value, setValue, clear, hadDraft.current] as const;
}
