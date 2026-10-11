CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  salt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_history_user_created_idx
  ON public.password_history (user_id, created_at DESC);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.password_history FROM anon, authenticated, public;
GRANT ALL ON public.password_history TO service_role;

CREATE TABLE IF NOT EXISTS public.password_change_attempts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_change_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.password_change_attempts FROM anon, authenticated, public;
GRANT ALL ON public.password_change_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.password_change_lock_status(target_user_id uuid)
RETURNS TABLE (is_locked boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_expiry timestamptz;
BEGIN
  SELECT locked_until INTO lock_expiry
  FROM public.password_change_attempts
  WHERE user_id = target_user_id;

  RETURN QUERY SELECT
    COALESCE(lock_expiry > now(), false),
    GREATEST(0, CEIL(EXTRACT(EPOCH FROM (lock_expiry - now())))::integer);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_password_change_failure(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  INSERT INTO public.password_change_attempts AS attempts (user_id, failed_attempts, window_started_at, locked_until)
  VALUES (target_user_id, 1, now(), NULL)
  ON CONFLICT (user_id) DO UPDATE SET
    failed_attempts = CASE
      WHEN attempts.window_started_at < now() - interval '15 minutes' THEN 1
      ELSE attempts.failed_attempts + 1
    END,
    window_started_at = CASE
      WHEN attempts.window_started_at < now() - interval '15 minutes' THEN now()
      ELSE attempts.window_started_at
    END,
    locked_until = CASE
      WHEN (CASE
        WHEN attempts.window_started_at < now() - interval '15 minutes' THEN 1
        ELSE attempts.failed_attempts + 1
      END) >= 5 THEN now() + interval '15 minutes'
      ELSE NULL
    END,
    updated_at = now()
  RETURNING failed_attempts INTO updated_count;

  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_password_change_failures(target_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.password_change_attempts WHERE user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.append_password_history(target_user_id uuid, encoded_hash text, encoded_salt text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(target_user_id::text, 0));

  INSERT INTO public.password_history (user_id, password_hash, salt)
  VALUES (target_user_id, encoded_hash, encoded_salt)
  RETURNING id INTO inserted_id;

  DELETE FROM public.password_history
  WHERE id IN (
    SELECT id FROM public.password_history
    WHERE user_id = target_user_id
    ORDER BY created_at DESC, id DESC
    OFFSET 5
  );

  RETURN inserted_id;
END;
$$;

REVOKE ALL ON FUNCTION public.password_change_lock_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_password_change_failure(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.clear_password_change_failures(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.append_password_history(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.password_change_lock_status(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_password_change_failure(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_password_change_failures(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.append_password_history(uuid, text, text) TO service_role;

DROP POLICY IF EXISTS "District admins can manage schools in their district" ON public.schools;
DROP POLICY IF EXISTS "District admins can update schools" ON public.schools;
DROP POLICY IF EXISTS "Province admins can update province schools" ON public.schools;
DROP POLICY IF EXISTS "Admins can manage schools" ON public.schools;
DROP POLICY IF EXISTS "Ministry admins manage all schools" ON public.schools;
DROP POLICY IF EXISTS "Ministry admins can manage all schools" ON public.schools;

CREATE POLICY "District and higher admins can insert schools"
  ON public.schools FOR INSERT TO authenticated
  WITH CHECK (public.is_district_admin_or_higher());

CREATE POLICY "Ministry admins can update schools"
  ON public.schools FOR UPDATE TO authenticated
  USING (public.is_ministry_admin())
  WITH CHECK (public.is_ministry_admin());

CREATE POLICY "Ministry admins can delete schools"
  ON public.schools FOR DELETE TO authenticated
  USING (public.is_ministry_admin());
