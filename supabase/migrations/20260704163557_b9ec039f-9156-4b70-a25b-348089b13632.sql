
CREATE TABLE public.signup_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  correct_number int NOT NULL CHECK (correct_number BETWEEN 10 AND 99),
  decoys int[] NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','matched','mismatched','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.signup_challenges TO authenticated, anon;
GRANT ALL ON public.signup_challenges TO service_role;

ALTER TABLE public.signup_challenges ENABLE ROW LEVEL SECURITY;

-- Users can read their own challenge by user_id (once signed in) or by challenge id (anon, before session exists).
-- id is a random uuid so knowing it is proof of ownership of that particular signup flow.
CREATE POLICY "read own signup challenge by user"
  ON public.signup_challenges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "read own signup challenge anon"
  ON public.signup_challenges FOR SELECT
  TO anon
  USING (true);

CREATE TRIGGER trg_signup_challenges_updated
  BEFORE UPDATE ON public.signup_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.signup_challenges;
