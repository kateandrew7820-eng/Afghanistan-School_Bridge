DO $migration$
DECLARE
  challenge_table oid;
BEGIN
  challenge_table := to_regclass('public.signup_challenges');
  IF challenge_table IS NULL THEN
    RAISE EXCEPTION 'Expected public.signup_challenges to exist before cleanup.';
  END IF;

  EXECUTE 'LOCK TABLE public.signup_challenges IN ACCESS EXCLUSIVE MODE';

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE contype = 'f'
      AND confrelid = challenge_table
  ) THEN
    RAISE EXCEPTION 'signup_challenges has inbound foreign keys; cleanup aborted.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_depend AS dependency
    JOIN pg_rewrite AS rewrite_rule
      ON dependency.classid = 'pg_rewrite'::regclass
      AND dependency.objid = rewrite_rule.oid
    JOIN pg_class AS dependent_relation
      ON dependent_relation.oid = rewrite_rule.ev_class
    WHERE dependency.refclassid = 'pg_class'::regclass
      AND dependency.refobjid = challenge_table
      AND dependent_relation.relkind IN ('v', 'm')
  ) THEN
    RAISE EXCEPTION 'signup_challenges has dependent views; cleanup aborted.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
      AND puballtables
  ) THEN
    RAISE EXCEPTION 'supabase_realtime publishes every table; cleanup aborted.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'signup_challenges'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.signup_challenges';
  END IF;

  IF EXISTS (SELECT 1 FROM public.signup_challenges LIMIT 1) THEN
    EXECUTE 'CREATE SCHEMA schoolbridge_archive';
    EXECUTE 'REVOKE ALL ON SCHEMA schoolbridge_archive FROM PUBLIC, anon, authenticated, service_role';
    EXECUTE 'ALTER TABLE public.signup_challenges SET SCHEMA schoolbridge_archive';
    EXECUTE 'ALTER TABLE schoolbridge_archive.signup_challenges RENAME TO signup_challenges_20261010';
    EXECUTE 'REVOKE ALL ON TABLE schoolbridge_archive.signup_challenges_20261010 FROM PUBLIC, anon, authenticated, service_role';
  ELSE
    EXECUTE 'DROP TABLE public.signup_challenges';
  END IF;
END
$migration$;
