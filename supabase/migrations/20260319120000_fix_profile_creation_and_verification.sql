-- This migration fixes the profile creation issue and adds verification workflow

-- ============================================================================
-- 1. Add missing columns for verification workflow
-- ============================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('student', 'teacher', 'principal', 'district_admin', 'province_admin', 'ministry_admin')),
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============================================================================
-- 2. Create trigger function to auto-create profiles for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, created_at, updated_at)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', now(), now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when new users are created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- ============================================================================
-- 3. Create trigger function to auto-create user_roles for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_user_role_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Give new users the 'school' role by default (they'll update it during setup)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'school'::"app_role")
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Create trigger that fires when new users are created in auth.users
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_role_for_new_user();

-- ============================================================================
-- 4. Create or update verification policies
-- ============================================================================

-- Allow users to update their own profile (including verification fields)
CREATE POLICY "Users can update own profile including status" ON public.profiles 
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile including status" ON public.profiles 
FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Create verification audit table for tracking approvals
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for verification_audit
ALTER TABLE public.verification_audit ENABLE ROW LEVEL SECURITY;

-- Create audit policies
CREATE POLICY "Admins can view audit logs" ON public.verification_audit 
FOR SELECT USING (true); -- Adjust this based on actual admin roles

-- ============================================================================
-- 6. Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at ON public.profiles(verified_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_user_id ON public.verification_audit(user_id);

-- ============================================================================
-- 7. Helper function to approve a pending user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.approve_user(
  p_user_id UUID,
  p_approved_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update profile status
  UPDATE public.profiles
  SET status = 'verified',
      verified_by_user_id = p_approved_by,
      verified_at = now(),
      rejection_reason = NULL,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log to audit table
  INSERT INTO public.verification_audit (user_id, verified_by_user_id, action)
  VALUES (p_user_id, p_approved_by, 'approved');

  RETURN json_build_object(
    'success', true,
    'message', 'User approved successfully'
  );
END;
$$;

-- ============================================================================
-- 8. Helper function to reject a pending user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reject_user(
  p_user_id UUID,
  p_rejected_by UUID,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile status
  UPDATE public.profiles
  SET status = 'rejected',
      verified_by_user_id = p_rejected_by,
      rejection_reason = p_reason,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log to audit table
  INSERT INTO public.verification_audit (user_id, verified_by_user_id, action, rejection_reason)
  VALUES (p_user_id, p_rejected_by, 'rejected', p_reason);

  RETURN json_build_object(
    'success', true,
    'message', 'User rejected successfully',
    'rejection_reason', p_reason
  );
END;
$$;
