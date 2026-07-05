import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/sanitizeError';
import { Map, Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';

type Province = { id: string; name: string; code: string | null };
type District = { id: string; name: string; province_id: string; code: string | null };

export default function Regions() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'provinces' | 'districts'>('provinces');

  const { data: provinces = [], isLoading: pLoad } = useQuery({
    queryKey: ['regions-provinces'],
    queryFn: async (): Promise<Province[]> => {
      const { data, error } = await supabase.from('provinces').select('id,name,code').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: districts = [], isLoading: dLoad } = useQuery({
    queryKey: ['regions-districts'],
    queryFn: async (): Promise<District[]> => {
      const { data, error } = await supabase.from('districts').select('id,name,province_id,code').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Province dialog state
  const [pOpen, setPOpen] = useState(false);
  const [pEdit, setPEdit] = useState<Province | null>(null);
  const [pName, setPName] = useState('');
  const [pCode, setPCode] = useState('');
  const [busy, setBusy] = useState(false);

  const openNewProvince = () => { setPEdit(null); setPName(''); setPCode(''); setPOpen(true); };
  const openEditProvince = (p: Province) => { setPEdit(p); setPName(p.name); setPCode(p.code ?? ''); setPOpen(true); };

  const saveProvince = async () => {
    if (!pName.trim()) return;
    setBusy(true);
    const payload = { name: pName.trim(), code: pCode.trim() || null };
    const { error } = pEdit
      ? await supabase.from('provinces').update(payload).eq('id', pEdit.id)
      : await supabase.from('provinces').insert(payload);
    setBusy(false);
    if (error) return toast({ title: 'خطا', description: sanitizeError(error), variant: 'destructive' });
    toast({ title: pEdit ? 'ولایت به‌روزرسانی شد' : 'ولایت افزوده شد' });
    setPOpen(false);
    qc.invalidateQueries({ queryKey: ['regions-provinces'] });
    qc.invalidateQueries({ queryKey: ['master-provinces'] });
  };

  const deleteProvince = async (p: Province) => {
    if (!confirm(`حذف ولایت «${p.name}» و همه ولسوالی‌های آن؟`)) return;
    const { error } = await supabase.from('provinces').delete().eq('id', p.id);
    if (error) return toast({ title: 'خطا', description: sanitizeError(error), variant: 'destructive' });
    toast({ title: 'حذف شد' });
    qc.invalidateQueries({ queryKey: ['regions-provinces'] });
    qc.invalidateQueries({ queryKey: ['regions-districts'] });
  };

  // District dialog state
  const [dOpen, setDOpen] = useState(false);
  const [dEdit, setDEdit] = useState<District | null>(null);
  const [dName, setDName] = useState('');
  const [dProv, setDProv] = useState('');
  const [dCode, setDCode] = useState('');
  const [dSearch, setDSearch] = useState('');
  const [dFilterProv, setDFilterProv] = useState('');

  const openNewDistrict = () => { setDEdit(null); setDName(''); setDProv(''); setDCode(''); setDOpen(true); };
  const openEditDistrict = (d: District) => { setDEdit(d); setDName(d.name); setDProv(d.province_id); setDCode(d.code ?? ''); setDOpen(true); };

  const saveDistrict = async () => {
    if (!dName.trim() || !dProv) return;
    setBusy(true);
    const payload = { name: dName.trim(), province_id: dProv, code: dCode.trim() || null };
    const { error } = dEdit
      ? await supabase.from('districts').update(payload).eq('id', dEdit.id)
      : await supabase.from('districts').insert(payload);
    setBusy(false);
    if (error) return toast({ title: 'خطا', description: sanitizeError(error), variant: 'destructive' });
    toast({ title: dEdit ? 'ولسوالی به‌روزرسانی شد' : 'ولسوالی افزوده شد' });
    setDOpen(false);
    qc.invalidateQueries({ queryKey: ['regions-districts'] });
  };

  const deleteDistrict = async (d: District) => {
    if (!confirm(`حذف ولسوالی «${d.name}»؟`)) return;
    const { error } = await supabase.from('districts').delete().eq('id', d.id);
    if (error) return toast({ title: 'خطا', description: sanitizeError(error), variant: 'destructive' });
    toast({ title: 'حذف شد' });
    qc.invalidateQueries({ queryKey: ['regions-districts'] });
  };

  const provinceName = (id: string) => provinces.find((p) => p.id === id)?.name ?? '—';
  const filteredDistricts = districts.filter((d) =>
    (!dFilterProv || d.province_id === dFilterProv) &&
    (!dSearch || d.name.toLowerCase().includes(dSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-6 w-6" />
          مدیریت ولایت‌ها و ولسوالی‌ها
        </h1>
        <p className="text-muted-foreground text-sm">افزودن، ویرایش و حذف واحدهای اداری کشور</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="provinces">ولایت‌ها ({provinces.length})</TabsTrigger>
          <TabsTrigger value="districts">ولسوالی‌ها ({districts.length})</TabsTrigger>
        </TabsList>

        {/* ---- Provinces ---- */}
        <TabsContent value="provinces" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={pOpen} onOpenChange={setPOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewProvince}><Plus className="h-4 w-4 ml-1" /> افزودن ولایت</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{pEdit ? 'ویرایش ولایت' : 'افزودن ولایت'}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>نام *</Label><Input value={pName} onChange={(e) => setPName(e.target.value)} /></div>
                  <div><Label>کد</Label><Input value={pCode} onChange={(e) => setPCode(e.target.value)} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={saveProvince} disabled={busy || !pName.trim()}>
                    {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} ذخیره
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {pLoad ? <p className="text-muted-foreground">در حال بارگذاری…</p> : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {provinces.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      {p.code && <p className="text-xs text-muted-foreground">{p.code}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditProvince(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteProvince(p)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {districts.filter((d) => d.province_id === p.id).length} ولسوالی
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- Districts ---- */}
        <TabsContent value="districts" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="جستجوی ولسوالی…" value={dSearch} onChange={(e) => setDSearch(e.target.value)} className="pr-10" />
              </div>
              <select value={dFilterProv} onChange={(e) => setDFilterProv(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background border-input text-sm">
                <option value="">همه ولایت‌ها</option>
                {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Dialog open={dOpen} onOpenChange={setDOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDistrict}><Plus className="h-4 w-4 ml-1" /> افزودن ولسوالی</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{dEdit ? 'ویرایش ولسوالی' : 'افزودن ولسوالی'}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>ولایت *</Label>
                    <select value={dProv} onChange={(e) => setDProv(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background border-input">
                      <option value="">انتخاب ولایت</option>
                      {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div><Label>نام *</Label><Input value={dName} onChange={(e) => setDName(e.target.value)} /></div>
                  <div><Label>کد</Label><Input value={dCode} onChange={(e) => setDCode(e.target.value)} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={saveDistrict} disabled={busy || !dName.trim() || !dProv}>
                    {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} ذخیره
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {dLoad ? <p className="text-muted-foreground">در حال بارگذاری…</p> : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredDistricts.map((d) => (
                <div key={d.id} className="flex items-center justify-between border rounded-lg px-3 py-2 bg-card">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{provinceName(d.province_id)}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDistrict(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteDistrict(d)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredDistricts.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">ولسوالی یافت نشد</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
