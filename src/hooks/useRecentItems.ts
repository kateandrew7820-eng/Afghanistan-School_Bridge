import { useCallback, useEffect, useState } from 'react';

export interface RecentItem {
  id: string;
  label: string;
  href: string;
  ts: number;
}

export function useRecentItems(scope: string, max = 5) {
  const key = `recent:${scope}`;
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [key]);

  const push = useCallback((item: Omit<RecentItem, 'ts'>) => {
    setItems(prev => {
      const next = [{ ...item, ts: Date.now() }, ...prev.filter(p => p.id !== item.id)].slice(0, max);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [key, max]);

  return { items, push };
}
