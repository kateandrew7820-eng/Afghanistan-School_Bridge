-- Add profile completion columns to profiles table
-- These columns track when a user completes their optional profile questionnaire

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_answers JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_completion_skipped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_skipped_at TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_completion_status 
ON public.profiles(user_id, is_profile_completed);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_profile_completed IS 'Whether user has completed optional profile questionnaire';
COMMENT ON COLUMN public.profiles.profile_answers IS 'JSON object containing answers to profile completion questions';
COMMENT ON COLUMN public.profiles.profile_completed_at IS 'Timestamp when profile was completed';
COMMENT ON COLUMN public.profiles.profile_completion_skipped IS 'Whether user skipped profile completion';
COMMENT ON COLUMN public.profiles.profile_skipped_at IS 'Timestamp when user skipped profile completion';
