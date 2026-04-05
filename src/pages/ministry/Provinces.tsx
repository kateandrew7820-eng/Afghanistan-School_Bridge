import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, School } from 'lucide-react';

interface ProvinceInfo {
  name: string;
  schoolCount: number;
  districtCount: number;
}

export default function MinistryProvinces() {
  const { data: provinces, isLoading } = useQuery({
    queryKey: ['ministry-provinces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('province, district')
        .eq('is_active', true);
      if (error) throw error;

      const map = new Map<string, { schools: number; districts: Set<string> }>();
      for (const row of data ?? []) {
        if (!row.province) continue;
        const entry = map.get(row.province) ?? { schools: 0, districts: new Set<string>() };
        entry.schools++;
        if (row.district) entry.districts.add(row.district);
        map.set(row.province, entry);
      }

      return Array.from(map.entries())
        .map(([name, info]): ProvinceInfo => ({
          name,
          schoolCount: info.schools,
          districtCount: info.districts.size,
        }))
        .sort((a, b) => b.schoolCount - a.schoolCount);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-6 w-6" />
          ولایات
        </h1>
        <p className="text-muted-foreground">نمای کلی تمام ولایات افغانستان</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !provinces?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Map className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">هیچ داده‌ای ثبت نشده است</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {provinces.map(p => (
            <Card key={p.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3 text-xs text-muted-foreground">
                <Badge variant="outline">{p.districtCount} ولسوالی</Badge>
                <Badge variant="outline">{p.schoolCount} مکتب</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
