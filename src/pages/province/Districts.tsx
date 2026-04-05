import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, School } from 'lucide-react';

interface DistrictInfo {
  name: string;
  schoolCount: number;
}

export default function ProvinceDistricts() {
  const { profile } = useAuth();

  const { data: districts, isLoading } = useQuery({
    queryKey: ['province-districts', profile?.province],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('district')
        .eq('province', profile?.province ?? '')
        .eq('is_active', true);
      if (error) throw error;

      const map = new Map<string, number>();
      for (const row of data ?? []) {
        if (row.district) {
          map.set(row.district, (map.get(row.district) ?? 0) + 1);
        }
      }

      return Array.from(map.entries())
        .map(([name, schoolCount]): DistrictInfo => ({ name, schoolCount }))
        .sort((a, b) => b.schoolCount - a.schoolCount);
    },
    enabled: !!profile?.province,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          ولسوالی‌ها
        </h1>
        <p className="text-muted-foreground">نمای کلی ولسوالی‌های ولایت {profile?.province}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !districts?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">هیچ ولسوالی‌ای ثبت نشده است</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {districts.map(d => (
            <Card key={d.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{d.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <School className="h-4 w-4" />
                  <span>{d.schoolCount} مکتب</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
