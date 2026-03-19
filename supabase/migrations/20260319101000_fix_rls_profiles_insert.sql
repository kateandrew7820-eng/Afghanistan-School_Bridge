-- Add INSERT policy for users on profiles table
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for user_roles table to allow authenticated users to insert
CREATE POLICY "Users can create their own roles" ON public.user_roles FOR INSERT 
WITH CHECK (auth.uid() = user_id);
