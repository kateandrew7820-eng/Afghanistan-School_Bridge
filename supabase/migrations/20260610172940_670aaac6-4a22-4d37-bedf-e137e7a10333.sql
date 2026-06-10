
-- Review stage enum for chained approval
DO $$ BEGIN
  CREATE TYPE public.review_stage AS ENUM ('school', 'district', 'province', 'ministry', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add current_stage to submission tables
ALTER TABLE public.statistics_submissions
  ADD COLUMN IF NOT EXISTS current_stage public.review_stage NOT NULL DEFAULT 'district';
ALTER TABLE public.report_submissions
  ADD COLUMN IF NOT EXISTS current_stage public.review_stage NOT NULL DEFAULT 'district';
ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS current_stage public.review_stage NOT NULL DEFAULT 'district';

CREATE INDEX IF NOT EXISTS idx_stats_stage ON public.statistics_submissions(current_stage);
CREATE INDEX IF NOT EXISTS idx_reports_stage ON public.report_submissions(current_stage);
CREATE INDEX IF NOT EXISTS idx_forms_stage ON public.form_submissions(current_stage);

-- Audit/event log for submissions
CREATE TABLE IF NOT EXISTS public.submission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  submission_table text NOT NULL CHECK (submission_table IN ('statistics_submissions','report_submissions','form_submissions')),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  from_stage public.review_stage,
  to_stage public.review_stage,
  action text NOT NULL CHECK (action IN ('submit','approve','reject','request_changes','resubmit','comment')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.submission_events TO authenticated;
GRANT ALL ON public.submission_events TO service_role;

ALTER TABLE public.submission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actors and admins can read events"
  ON public.submission_events FOR SELECT TO authenticated
  USING (
    actor_user_id = auth.uid()
    OR public.is_admin()
    OR public.has_role(auth.uid(), 'province_admin')
    OR public.has_role(auth.uid(), 'district_admin')
  );

CREATE POLICY "Authenticated can insert their own events"
  ON public.submission_events FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_submission_events_sub ON public.submission_events(submission_table, submission_id);

-- Comments / change-requests on submissions
CREATE TABLE IF NOT EXISTS public.submission_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  submission_table text NOT NULL CHECK (submission_table IN ('statistics_submissions','report_submissions','form_submissions')),
  author_user_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_comments TO authenticated;
GRANT ALL ON public.submission_comments TO service_role;

ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors and reviewers can read comments"
  ON public.submission_comments FOR SELECT TO authenticated
  USING (
    author_user_id = auth.uid()
    OR public.is_admin()
    OR public.has_role(auth.uid(), 'province_admin')
    OR public.has_role(auth.uid(), 'district_admin')
    OR public.has_role(auth.uid(), 'principal')
    OR public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Authenticated can add comments"
  ON public.submission_comments FOR INSERT TO authenticated
  WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "Authors can edit own comments"
  ON public.submission_comments FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "Authors can delete own comments"
  ON public.submission_comments FOR DELETE TO authenticated
  USING (author_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_submission_comments_sub ON public.submission_comments(submission_table, submission_id);

CREATE TRIGGER trg_submission_comments_updated_at
  BEFORE UPDATE ON public.submission_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
