import { useEffect, useState } from 'react';
import { sanitizeError } from '@/lib/sanitizeError';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { School, Plus, Loader2, Search } from 'lucide-react';

interface SchoolData {
  id: string;
  name: string;
  code: string | null;
  province: string | null;
  district: string | null;
  contact_email: string | null;
  is_active: boolean;
}

export default function ManageSchools() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    province: '',
    district: '',
    contact_email: ''
  });

  // Load provinces from master table
  const { data: masterProvinces } = useQuery({
    queryKey: ['master-provinces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provinces')
        .select('id, name, code')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Load districts filtered by selected province
  const { data: masterDistricts } = useQuery({
    queryKey: ['master-districts', selectedProvince],
    queryFn: async () => {
      if (!selectedProvince) return [];
      const province = masterProvinces?.find(p => p.name === selectedProvince);
      if (!province) return [];
      const { data, error } = await supabase
        .from('districts')
        .select('id, name')
        .eq('province_id', province.id)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedProvince && !!masterProvinces?.length,
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({ title: 'خطا در بارگذاری مکاتب', description: sanitizeError(error), variant: 'destructive' });
    } else if (data) {
      setSchools(data);
    }
    setLoading(false);
  }

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) {
      toast({ title: "خطا", description: "لطفاً دوباره وارد سیستم شوید", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase.from('schools').insert({
      name: newSchool.name,
      code: newSchool.code || null,
      province: newSchool.province || null,
      district: newSchool.district || null,
      contact_email: newSchool.contact_email || null
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "افزودن مکتب ناموفق",
        description: sanitizeError(error),
        variant: "destructive"
      });
      return;
    }

    toast({
        title: "مکتب افزوده شد",
        description: `${newSchool.name} با موفقیت افزوده شد.`,
    });

    setIsAddDialogOpen(false);
    setNewSchool({ name: '', code: '', province: '', district: '', contact_email: '' });
    setSelectedProvince('');
    fetchSchools();
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.province?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6" />
            مدیریت مکاتب
          </h1>
          <p className="text-muted-foreground">افزودن و مدیریت حسابهای مکتب</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              افزودن مکتب
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن مکتب جدید</DialogTitle>
              <DialogDescription>ثبت نام یک مکتب جدید در سیستم</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSchool} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام مکتب *</Label>
                <Input
                  id="name"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  placeholder="مکتب احمد شاه"
                  required
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">کد مکتب</Label>
                  <Input
                    id="code"
                    value={newSchool.code}
                    onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })}
                    placeholder="KBL-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">ایمیل تماس</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newSchool.contact_email}
                    onChange={(e) => setNewSchool({ ...newSchool, contact_email: e.target.value })}
                    placeholder="school@example.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="province">ولایت</Label>
                  <select
                    id="province"
                    value={newSchool.province}
                    onChange={(e) => {
                      setNewSchool({ ...newSchool, province: e.target.value, district: '' });
                      setSelectedProvince(e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-md bg-background border-input"
                  >
                    <option value="">انتخاب ولایت</option>
                    {(masterProvinces ?? []).map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">ولسوالی</Label>
                  <select
                    id="district"
                    value={newSchool.district}
                    onChange={(e) => setNewSchool({ ...newSchool, district: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background border-input"
                    disabled={!selectedProvince}
                  >
                    <option value="">انتخاب ولسوالی</option>
                    {(masterDistricts ?? []).map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    درحال افزودن...
                  </>
                ) : (
                  'افزودن مکتب'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="جستجوی مکاتب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Schools List */}
      {loading ? (
        <p className="text-muted-foreground">درحال بارگذاری مکاتب...</p>
      ) : filteredSchools.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'مکتبی با این جستجو یافت نشد' : 'مکتبی ثبت نشده است'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => (
            <Card key={school.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                  <Badge variant={school.is_active ? 'default' : 'secondary'}>
                    {school.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
                {school.code && (
                  <CardDescription>کد: {school.code}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  {school.province && <p>ولایت: {school.province}</p>}
                  {school.district && <p>ولسوالی: {school.district}</p>}
                  {school.contact_email && <p>ایمیل: {school.contact_email}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
