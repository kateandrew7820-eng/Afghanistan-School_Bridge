-- 1. Remove privilege escalation: drop self-assign role policy
DROP POLICY IF EXISTS "Users can create their own roles" ON public.user_roles;

-- 2. Make center-اسناد bucket private
UPDATE storage.buckets SET public = false WHERE id = 'center-اسناد';