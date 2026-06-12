import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Map } from 'lucide-react';

interface ProvinceInfo {
  name: string;
  schoolCount: number;
  districtCount: number;
}

export default function MinistryProvinces() {
  const { data: provinces, isLoading } = useQuery({
    queryKey: ['ministry-provinces'],
    queryFn: async () => {
      const { data, error } = await supabase.from('schools').select('province, district').eq('is_active', true);
      if (error) throw error;
      const map: Record<string, { schools: number; districts: Set<string> }> = {};
      for (const row of data ?? []) {
        if (!row.province) continue;
        if (!map[row.province]) map[row.province] = { schools: 0, districts: new Set<string>() };
        map[row.province].schools++;
        if (row.district) map[row.province].districts.add(row.district);
      }
      return Object.entries(map)
        .map(([name, info]): ProvinceInfo => ({ name, schoolCount: info.schools, districtCount: info.districts.size }))
        .sort((a, b) => b.schoolCount - a.schoolCount);
    },
  });

  const columns = useMemo<ColumnDef<ProvinceInfo>[]>(() => [
    {
      accessorKey: 'name',
      header: 'ولایت',
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <Map className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </span>
      ),
    },
    {
      accessorKey: 'districtCount',
      header: 'ولسوالی‌ها',
      cell: ({ row }) => <Badge variant="outline">{row.original.districtCount}</Badge>,
    },
    {
      accessorKey: 'schoolCount',
      header: 'مکاتب',
      cell: ({ row }) => <Badge variant="outline">{row.original.schoolCount}</Badge>,
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-6 w-6" />
          ولایات
        </h1>
        <p className="text-muted-foreground">نمای کلی تمام ولایات افغانستان</p>
      </div>

      <DataTable
        columns={columns}
        data={provinces ?? []}
        loading={isLoading}
        searchPlaceholder="جستجوی ولایت..."
        searchableKeys={['name']}
        exportFilename="provinces"
        pageSize={15}
      />
    </div>
  );
}
