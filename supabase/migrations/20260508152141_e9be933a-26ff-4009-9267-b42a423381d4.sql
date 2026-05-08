DROP POLICY IF EXISTS "Anyone can view published announcements" ON public.announcements;
CREATE POLICY "Anyone can view published announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (is_published = true);