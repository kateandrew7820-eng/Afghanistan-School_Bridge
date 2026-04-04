import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStatCardProps {
  title: string;
  value?: number;
  icon?: React.ReactNode;
  loading: boolean;
  format?: boolean;
  suffix?: string;
  subtitle?: string;
}

export function DashboardStatCard({ title, value, icon, loading, format: doFormat, suffix = '', subtitle }: DashboardStatCardProps) {
  const display = doFormat ? (value ?? 0).toLocaleString('fa-AF') : (value ?? 0);

  return (
    <Card className="border shadow-sm hover:shadow-md transition">
      <CardHeader className="flex flex-row justify-between pb-1">
        <CardTitle className="text-xs text-muted-foreground font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-16 rounded" />
        ) : (
          <div className="text-xl font-bold">{display}{suffix}</div>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
