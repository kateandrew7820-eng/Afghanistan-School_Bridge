-- Add verification fields to profiles table
-- Supports the user setup and verification workflow

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_verification';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at ON public.profiles(verified_at DESC);

-- Create a verification audit table for tracking approvals/rejections
CREATE TABLE IF NOT EXISTS public.verification_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'approved' or 'rejected'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, created_at)
);

-- Enable RLS on verification_audit
ALTER TABLE public.verification_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can read verification audits
CREATE POLICY "Admins can read verification audits" ON public.verification_audit
  FOR SELECT USING (public.is_admin());

-- Only system can insert verification audits
CREATE POLICY "Only system can insert verification audits" ON public.verification_audit
  FOR INSERT WITH CHECK (false); -- Trigger will handle inserts
