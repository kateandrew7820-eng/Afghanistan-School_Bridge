DROP POLICY IF EXISTS "read own signup challenge anon" ON public.signup_challenges;
REVOKE SELECT ON public.signup_challenges FROM anon;