
-- Add new role values to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'district_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'province_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ministry_admin';

-- Add district/province columns to profiles for hierarchy
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS province text;
