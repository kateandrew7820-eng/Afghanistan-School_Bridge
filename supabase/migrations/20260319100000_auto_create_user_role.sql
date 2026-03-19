-- Create trigger function to automatically assign default role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'school'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a new profile is created
DROP TRIGGER IF EXISTS assign_default_role_trigger ON public.profiles;
CREATE TRIGGER assign_default_role_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_default_role();

-- Allow the trigger function to bypass RLS by using SECURITY DEFINER
GRANT EXECUTE ON FUNCTION public.assign_default_role() TO authenticated, anon;
