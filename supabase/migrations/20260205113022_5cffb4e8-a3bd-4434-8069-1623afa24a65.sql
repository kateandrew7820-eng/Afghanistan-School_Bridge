-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'school');

-- Create profiles table to link users with additional info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  province TEXT,
  district TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for profiles.school_id
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;

-- Create statistics submissions table
CREATE TABLE public.statistics_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  academic_year TEXT NOT NULL,
  total_students INTEGER DEFAULT 0,
  male_students INTEGER DEFAULT 0,
  female_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,2),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create report submissions table (for file uploads)
CREATE TABLE public.report_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create form submissions table
CREATE TABLE public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  form_type TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create اعلانات table (center to schools)
CREATE TABLE public.اعلانات (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create center documents table (for shared documents)
CREATE TABLE public.center_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create deadlines table
CREATE TABLE public.deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.اعلانات ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id
  FROM public.profiles
  WHERE user_id = _user_id
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can مشاهده همه profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- Schools policies
CREATE POLICY "Schools viewable by authenticated users" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage schools" ON public.schools FOR ALL USING (public.is_admin());

-- Statistics submissions policies
CREATE POLICY "Schools can view own stats" ON public.statistics_submissions FOR SELECT USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Schools can insert own stats" ON public.statistics_submissions FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Schools can update own stats" ON public.statistics_submissions FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Admins can مشاهده همه stats" ON public.statistics_submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update stats" ON public.statistics_submissions FOR UPDATE USING (public.is_admin());

-- Report submissions policies
CREATE POLICY "Schools can view own reports" ON public.report_submissions FOR SELECT USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Schools can insert own reports" ON public.report_submissions FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Schools can delete own reports" ON public.report_submissions FOR DELETE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Admins can مشاهده همه reports" ON public.report_submissions FOR SELECT USING (public.is_admin());

-- Form submissions policies
CREATE POLICY "Schools can view own forms" ON public.form_submissions FOR SELECT USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Schools can insert own forms" ON public.form_submissions FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Schools can update own forms" ON public.form_submissions FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Admins can مشاهده همه forms" ON public.form_submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update forms" ON public.form_submissions FOR UPDATE USING (public.is_admin());

-- اعلانات policies (public read, admin write)
CREATE POLICY "Anyone can view published اعلانات" ON public.اعلانات FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage اعلانات" ON public.اعلانات FOR ALL USING (public.is_admin());

-- Center documents policies (public read, admin write)
CREATE POLICY "Anyone can view documents" ON public.center_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage documents" ON public.center_documents FOR ALL USING (public.is_admin());

-- Deadlines policies (public read, admin write)
CREATE POLICY "Anyone can view deadlines" ON public.deadlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage deadlines" ON public.deadlines FOR ALL USING (public.is_admin());

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('school-reports', 'school-reports', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('center-documents', 'center-documents', true);

-- Storage policies for school-reports bucket
CREATE POLICY "Schools can upload own reports" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-reports' AND (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text);

CREATE POLICY "Schools can view own reports" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-reports' AND (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text);

CREATE POLICY "Admins can مشاهده همه reports" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-reports' AND public.is_admin());

-- Storage policies for center-documents bucket
CREATE POLICY "Anyone can view center documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'center-documents');

CREATE POLICY "Admins can upload center documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'center-documents' AND public.is_admin());

CREATE POLICY "Admins can delete center documents" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'center-documents' AND public.is_admin());

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_statistics_updated_at BEFORE UPDATE ON public.statistics_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.form_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_اعلانات_updated_at BEFORE UPDATE ON public.اعلانات FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();