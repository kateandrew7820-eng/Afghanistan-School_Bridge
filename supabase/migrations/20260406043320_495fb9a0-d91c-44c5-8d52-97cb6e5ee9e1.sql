
-- Phase 1D: Fix is_admin() to include ministry_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'ministry_admin')
$$;

-- Phase 1B: Drop any existing conflicting storage policies then recreate
DROP POLICY IF EXISTS "Authenticated users can view center documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload center documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete center documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view school reports" ON storage.objects;
DROP POLICY IF EXISTS "School users can upload reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete school reports" ON storage.objects;

CREATE POLICY "Authenticated users can view center documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'center-documents');

CREATE POLICY "Admins can upload center documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'center-documents' AND public.is_admin());

CREATE POLICY "Admins can delete center documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'center-documents' AND public.is_admin());

CREATE POLICY "Authenticated users can view school reports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-reports');

CREATE POLICY "School users can upload reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'school-reports'
  AND (
    public.is_admin()
    OR public.has_role(auth.uid(), 'school'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
    OR public.has_role(auth.uid(), 'principal'::public.app_role)
  )
);

CREATE POLICY "Admins can delete school reports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'school-reports' AND public.is_admin());

-- Phase 1C: Create master provinces table
CREATE TABLE IF NOT EXISTS public.provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view provinces" ON public.provinces;
CREATE POLICY "Anyone authenticated can view provinces"
ON public.provinces FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage provinces" ON public.provinces;
CREATE POLICY "Admins can manage provinces"
ON public.provinces FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  province_id uuid NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, province_id)
);
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view districts" ON public.districts;
CREATE POLICY "Anyone authenticated can view districts"
ON public.districts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage districts" ON public.districts;
CREATE POLICY "Admins can manage districts"
ON public.districts FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Add reference columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province_id uuid REFERENCES public.provinces(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS province_id uuid REFERENCES public.provinces(id);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);

-- Seed provinces
INSERT INTO public.provinces (name, code) VALUES
  ('کابل', 'KBL'), ('هرات', 'HRT'), ('بلخ', 'BLK'), ('قندهار', 'KDH'),
  ('ننگرهار', 'NNG'), ('بدخشان', 'BDK'), ('غزنی', 'GHZ'), ('پکتیا', 'PKT'),
  ('بامیان', 'BMY'), ('فاریاب', 'FRB'), ('جوزجان', 'JZJ'), ('کندز', 'KDZ'),
  ('تخار', 'TKH'), ('بغلان', 'BGL'), ('سمنگان', 'SMN'), ('سرپل', 'SRP'),
  ('دایکندی', 'DKD'), ('غور', 'GHR'), ('نورستان', 'NRS'), ('بادغیس', 'BDG'),
  ('هلمند', 'HLM'), ('زابل', 'ZBL'), ('ارزگان', 'URZ'), ('فراه', 'FRH'),
  ('نیمروز', 'NMR'), ('پکتیکا', 'PKA'), ('خوست', 'KHS'), ('لغمان', 'LGM'),
  ('کاپیسا', 'KPS'), ('پروان', 'PRW'), ('وردک', 'WRD'), ('لوگر', 'LGR'),
  ('پنجشیر', 'PNJ'), ('کنر', 'KNR')
ON CONFLICT (name) DO NOTHING;

-- Seed key districts
INSERT INTO public.districts (name, province_id) VALUES
  ('ناحیه اول', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('ناحیه دوم', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('ناحیه سوم', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('ناحیه چهارم', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('ناحیه پنجم', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('پغمان', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('چهارآسیاب', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('بگرامی', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('ده سبز', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('شکردره', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('میربچه کوت', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('قره باغ', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('گلدره', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('فرزه', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('موسهی', (SELECT id FROM public.provinces WHERE code='KBL')),
  ('هرات مرکزی', (SELECT id FROM public.provinces WHERE code='HRT')),
  ('انجیل', (SELECT id FROM public.provinces WHERE code='HRT')),
  ('گذره', (SELECT id FROM public.provinces WHERE code='HRT')),
  ('زنده جان', (SELECT id FROM public.provinces WHERE code='HRT')),
  ('پشتون زرغون', (SELECT id FROM public.provinces WHERE code='HRT')),
  ('کرخ', (SELECT id FROM public.provinces WHERE code='HRT')),
  ('اوبه', (SELECT id FROM public.provinces WHERE code='HRT')),
  ('چشت شریف', (SELECT id FROM public.provinces WHERE code='HRT')),
  ('مزارشریف', (SELECT id FROM public.provinces WHERE code='BLK')),
  ('نهرشاهی', (SELECT id FROM public.provinces WHERE code='BLK')),
  ('دهدادی', (SELECT id FROM public.provinces WHERE code='BLK')),
  ('بلخ', (SELECT id FROM public.provinces WHERE code='BLK')),
  ('چمتال', (SELECT id FROM public.provinces WHERE code='BLK')),
  ('شولگره', (SELECT id FROM public.provinces WHERE code='BLK')),
  ('قندهار مرکزی', (SELECT id FROM public.provinces WHERE code='KDH')),
  ('دامان', (SELECT id FROM public.provinces WHERE code='KDH')),
  ('ارغنداب', (SELECT id FROM public.provinces WHERE code='KDH')),
  ('پنجوایی', (SELECT id FROM public.provinces WHERE code='KDH')),
  ('سپین بولدک', (SELECT id FROM public.provinces WHERE code='KDH')),
  ('جلال آباد', (SELECT id FROM public.provinces WHERE code='NNG')),
  ('بهسود', (SELECT id FROM public.provinces WHERE code='NNG')),
  ('سرخ رود', (SELECT id FROM public.provinces WHERE code='NNG')),
  ('خوگیانی', (SELECT id FROM public.provinces WHERE code='NNG')),
  ('شینوار', (SELECT id FROM public.provinces WHERE code='NNG')),
  ('کندز مرکزی', (SELECT id FROM public.provinces WHERE code='KDZ')),
  ('خان آباد', (SELECT id FROM public.provinces WHERE code='KDZ')),
  ('امام صاحب', (SELECT id FROM public.provinces WHERE code='KDZ')),
  ('علی آباد', (SELECT id FROM public.provinces WHERE code='KDZ')),
  ('فیض آباد', (SELECT id FROM public.provinces WHERE code='BDK')),
  ('جرم', (SELECT id FROM public.provinces WHERE code='BDK')),
  ('بهارک', (SELECT id FROM public.provinces WHERE code='BDK')),
  ('کشم', (SELECT id FROM public.provinces WHERE code='BDK')),
  ('غزنی مرکزی', (SELECT id FROM public.provinces WHERE code='GHZ')),
  ('قره باغ غزنی', (SELECT id FROM public.provinces WHERE code='GHZ')),
  ('جغتو', (SELECT id FROM public.provinces WHERE code='GHZ'))
ON CONFLICT (name, province_id) DO NOTHING;
