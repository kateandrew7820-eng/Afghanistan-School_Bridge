export function formatTimeFa(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-AF', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDaySeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'امروز';
  if (sameDay(d, yesterday)) return 'دیروز';
  try {
    return new Intl.DateTimeFormat('fa-AF', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  } catch {
    return iso;
  }
}

export function relativeTimeFa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'اکنون';
  if (m < 60) return `${m}د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}س`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}ر`;
  try {
    return new Intl.DateTimeFormat('fa-AF', { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function initialsFrom(name: string | null | undefined, fallback = '؟'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? fallback) + (parts[1]?.[0] ?? '');
}
