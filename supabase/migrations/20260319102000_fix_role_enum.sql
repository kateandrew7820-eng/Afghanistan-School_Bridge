-- CRITICAL FIX: Ensure the app_role enum supports all required roles
-- This must be the first migration to run before other changes

-- Check current enum and update if needed
DO $$
DECLARE
  enum_exists BOOLEAN;
BEGIN
  -- Check if app_role enum exists
  SELECT EXISTS(SELECT 1 FROM information_schema.enums WHERE typname = 'app_role') INTO enum_exists;
  
  IF enum_exists THEN
    -- Drop and recreate with all values to avoid duplicate errors
    ALTER TYPE public.app_role RENAME TO app_role_old;
    
    CREATE TYPE public.app_role AS ENUM (
      'school',
      'teacher',
      'principal',
      'district_admin',
      'province_admin',
      'ministry_admin',
      'admin'
    );
    
    -- Migrate existing data
    ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
    
    -- Drop old enum
    DROP TYPE public.app_role_old;
  ELSE
    -- Create new if doesn't exist
    CREATE TYPE public.app_role AS ENUM (
      'school',
      'teacher',
      'principal',
      'district_admin',
      'province_admin',
      'ministry_admin',
      'admin'
    );
  END IF;
END $$;
