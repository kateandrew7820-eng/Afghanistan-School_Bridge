
CREATE TABLE public.nesp_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text UNIQUE NOT NULL,
  metric_label_fa text NOT NULL,
  category text NOT NULL,
  baseline_value numeric,
  target_value numeric,
  target_year integer,
  unit text,
  source_page integer,
  notes_fa text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nesp_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read NESP reference"
  ON public.nesp_reference FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Ministry admins manage NESP reference"
  ON public.nesp_reference FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ministry_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'ministry_admin'));

CREATE TRIGGER nesp_reference_updated_at
  BEFORE UPDATE ON public.nesp_reference
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.nesp_reference
  (metric_key, metric_label_fa, category, baseline_value, target_value, target_year, unit, source_page, notes_fa)
VALUES
  ('total_students',        'مجموع شاگردان ثبت‌نام شده',         'enrollment',  5400000, 7700000, 1389, 'نفر',   12, 'پایه ۵.۴ میلیون (۳۵٪ دختر) → هدف ۷.۷ میلیون.'),
  ('primary_ger_boys',      'نسبت ناخالص ثبت‌نام پسران (ابتدایی)', 'enrollment',  NULL,    75,      1389, '٪',     12, 'هدف ۷۵٪ شمولیت ابتدایی پسران.'),
  ('primary_ger_girls',     'نسبت ناخالص ثبت‌نام دختران (ابتدایی)','enrollment',  NULL,    60,      1389, '٪',     12, 'هدف ۶۰٪ شمولیت ابتدایی دختران.'),
  ('teachers_qualified_pct','معلمان واجد شرایط (صنف ۱۴ به بالا)',  'teachers',    22,      70,      1389, '٪',     12, 'هدف عبور ۷۰٪ معلمان از آزمون صلاحیت.'),
  ('female_teachers_pct',   'سهم معلمان زن',                       'teachers',    28,      40,      1389, '٪',     12, 'افزایش زنان در کادر تدریس.'),
  ('schools_with_buildings','مکاتب دارای ساختمان قابل استفاده',    'infrastructure', 25,   90,      1389, '٪',     12, 'هدف ۹۰٪ از مکاتب دارای ساختمان مناسب.'),
  ('illiterate_adults',     'بزرگسالان بی‌سواد',                    'literacy',    11000000,8000000, 1389, 'نفر',   13, 'کاهش از ۱۱ میلیون به کمتر از ۸ میلیون.'),
  ('new_schools_target',    'مکاتب جدید در حال ایجاد',              'expansion',   0,       4900,    1389, 'مکتب',  15, 'احداث ۴٬۹۰۰ مکتب جدید + ۴٬۸۰۰ صنف خارج از مرکز.'),
  ('outreach_classes',      'صنف‌های جامعه‌محور خارج از مرکز',      'expansion',   0,       4800,    1389, 'صنف',   15, 'برای دسترسی نواحی دور افتاده.'),
  ('total_in_school_target','شاگردان صنوف ۱ تا ۱۲',                 'enrollment',  NULL,    7400000, 1389, 'نفر',   15, 'هدف کلی صنوف ۱-۱۲.'),
  ('hs_grad_meets_tertiary','فارغان لیسه آماده دانشگاه',            'quality',     33,      50,      1389, '٪',     13, 'سهم فارغانی که معیار ورود به تحصیلات عالی را دارند.'),
  ('schools_burned_pct',    'مکاتب آسیب‌دیده/تعطیل (تروریزم)',      'safety',      6,       0,       1389, '٪',     12, 'کاهش حملات بر مکاتب در ۱۸ ماه گذشته.');
