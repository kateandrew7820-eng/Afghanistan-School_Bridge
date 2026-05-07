import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Row = {
  id: string;
  metric_key: string;
  metric_label_fa: string;
  category: string;
  baseline_value: number | null;
  target_value: number | null;
  target_year: number | null;
  unit: string | null;
};

interface Props {
  /** Optional live values keyed by metric_key to display current vs target */
  liveValues?: Record<string, number>;
}

function formatNumber(n: number, unit?: string | null) {
  if (unit === '٪') return `${n}%`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fa-AF', { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${Math.round(n / 1000).toLocaleString('fa-AF')}K`;
  return n.toLocaleString('fa-AF');
}

export const NationalTargetsCard = memo(function NationalTargetsCard({ liveValues = {} }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['nesp-reference'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nesp_reference' as never)
        .select('*')
        .order('category');
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
    staleTime: 60 * 60 * 1000,
  });

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4" />
          اهداف ملی NESP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (data ?? []).map((m) => {
          const target = m.target_value ?? 0;
          const current = liveValues[m.metric_key] ?? m.baseline_value ?? 0;
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          return (
            <div key={m.id} className="p-3 rounded-lg border hover:bg-muted/50 transition">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm">{m.metric_label_fa}</span>
                <Badge variant="outline" className="text-xs">
                  {formatNumber(current, m.unit)} / {formatNumber(target, m.unit)} {m.unit && m.unit !== '٪' ? m.unit : ''}
                </Badge>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                  aria-label={`${pct}%`}
                />
              </div>
            </div>
          );
        })}
        <p className="text-[11px] text-muted-foreground pt-1">
          منبع: پلان ستراتیژی ملی معارف افغانستان (NESP).
        </p>
      </CardContent>
    </Card>
  );
});
