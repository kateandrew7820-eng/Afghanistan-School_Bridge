import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { School, Phone, Mail } from 'lucide-react';

export default function DistrictSchools() {
  const { profile } = useAuth();

  const { data: schools, isLoading } = useQuery({
    queryKey: ['district-schools', profile?.district],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('district', profile?.district ?? '')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.district,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <School className="h-6 w-6" />
          مکاتب ولسوالی
        </h1>
        <p className="text-muted-foreground">لیست مکاتب ولسوالی {profile?.district}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !schools?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">هیچ مکتبی در این ولسوالی ثبت نشده است</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map(school => (
            <Card key={school.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{school.name}</span>
                  {school.code && <Badge variant="outline" className="text-xs">{school.code}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                {school.contact_phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    <span dir="ltr">{school.contact_phone}</span>
                  </div>
                )}
                {school.contact_email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    <span>{school.contact_email}</span>
                  </div>
                )}
                <div className="text-xs pt-1">
                  {school.province} — {school.district}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
