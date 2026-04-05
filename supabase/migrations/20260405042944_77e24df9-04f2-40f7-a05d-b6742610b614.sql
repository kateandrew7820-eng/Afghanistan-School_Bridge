-- ============================================================
-- Phase 1A: Fix self-approval vulnerability in profiles
-- ============================================================

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restricted update policy that prevents modifying sensitive fields
-- Users can only update: full_name, phone_number, school_name, district, province, role
CREATE POLICY "Users can update own non-sensitive profile fields"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a SECURITY DEFINER function for admin-only status changes
CREATE OR REPLACE FUNCTION public.admin_update_profile_status(
  _target_user_id uuid,
  _status text,
  _rejection_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins/ministry can change status
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ministry_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can change profile status';
  END IF;

  UPDATE public.profiles
  SET
    status = _status,
    verified_at = CASE WHEN _status = 'verified' THEN now() ELSE verified_at END,
    verified_by_user_id = CASE WHEN _status = 'verified' THEN auth.uid() ELSE verified_by_user_id END,
    rejection_reason = COALESCE(_rejection_reason, rejection_reason),
    updated_at = now()
  WHERE user_id = _target_user_id;

  RETURN FOUND;
END;
$$;

-- Create a trigger to prevent users from modifying sensitive columns
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is not an admin, prevent changes to sensitive fields
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ministry_admin')
  ) THEN
    NEW.status := OLD.status;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by_user_id := OLD.verified_by_user_id;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_sensitive_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_sensitive_profile_update();

-- ============================================================
-- Phase 1E: Input length constraints
-- ============================================================

ALTER TABLE public.profiles
  ALTER COLUMN full_name TYPE VARCHAR(255),
  ALTER COLUMN phone_number TYPE VARCHAR(50),
  ALTER COLUMN district TYPE VARCHAR(255),
  ALTER COLUMN province TYPE VARCHAR(255),
  ALTER COLUMN school_name TYPE VARCHAR(255),
  ALTER COLUMN rejection_reason TYPE VARCHAR(1000);

-- Update handle_new_user to truncate
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    LEFT(NEW.raw_user_meta_data ->> 'full_name', 255)
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- Phase 1G: Storage DELETE policy for school-reports
-- ============================================================

CREATE POLICY "Schools can delete own report files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'school-reports'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text
);

-- ============================================================
-- Phase 3B: Form data JSONB size validation trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_form_data_size()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF octet_length(NEW.form_data::text) > 102400 THEN
    RAISE EXCEPTION 'form_data exceeds maximum size of 100KB';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_form_data_size
BEFORE INSERT OR UPDATE ON public.form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.validate_form_data_size();