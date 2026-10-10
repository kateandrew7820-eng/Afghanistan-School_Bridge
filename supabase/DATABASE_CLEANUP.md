# Database cleanup: signup challenges

## Audit

`public.signup_challenges` was created for a temporary signup challenge flow. A repository-wide reference audit found no application reads or writes, Edge Function use, foreign keys, or dependent views. Its only code-level remnant was a generated Supabase type declaration, which has been removed. The earlier migrations that create and secure the table remain in history and must not be edited.

Other temporary-looking tables were not included: `verification_audit` is written by profile-verification triggers, `submission_events` and `submission_comments` are used by submission workflows, and `message_reads` is used by chat.

The challenge table contains user identifiers, email addresses, and challenge answers. Because deployed row counts cannot be established from the repository, the migration preserves every row if any exist. It locks the table against concurrent writes, removes it from Supabase Realtime if present, rejects known inbound foreign-key/view dependencies, then moves non-empty data to the unexposed `schoolbridge_archive` schema with application-role access revoked. If the table is empty, it drops the table. The migration aborts on unexpected dependency or schema state rather than forcing a cascade.

This audit covers repository code and migration history; it cannot rule out external clients, dashboard SQL, or dynamically constructed SQL outside the repository. Confirm those consumers with the database owner before deployment.

## Apply and validate

Apply through the project's normal reviewed Supabase migration process; do not run the cleanup directly against production without first taking the deployment's normal database backup. The migration's row check and archive/drop decision run atomically under an exclusive table lock.

After applying, verify:

```sql
-- The public API table must no longer exist.
SELECT to_regclass('public.signup_challenges');

-- If the table held rows, it must be retained in this private archive schema.
SELECT to_regclass('schoolbridge_archive.signup_challenges_20261010');

-- Confirm the archived relation is not in the Realtime publication.
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'signup_challenges_20261010';
```

Run the following privilege check only when the archived relation exists:

```sql
-- Confirm API roles have no schema/table access to archived rows.
SELECT
  has_schema_privilege('anon', 'schoolbridge_archive', 'USAGE') AS anon_schema_access,
  has_schema_privilege('authenticated', 'schoolbridge_archive', 'USAGE') AS authenticated_schema_access,
  has_table_privilege('service_role', 'schoolbridge_archive.signup_challenges_20261010', 'SELECT') AS service_role_table_access;
```

If the table was empty, `schoolbridge_archive` and the archived relation will not exist; the first query should still return `NULL`.

## Rollback

If the table was archived, restore it without copying or transforming its data:

```sql
ALTER TABLE schoolbridge_archive.signup_challenges_20261010 SET SCHEMA public;
ALTER TABLE public.signup_challenges_20261010 RENAME TO signup_challenges;
GRANT SELECT ON public.signup_challenges TO authenticated;
GRANT ALL ON public.signup_challenges TO service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signup_challenges;
```

The archived table retains its columns, constraints, indexes, RLS policies, and update trigger. The original anon policy and anon grant had already been removed by an earlier migration and must not be restored.

If the table had been empty and dropped, recreate the empty relation and its prior authenticated behavior:

```sql
CREATE TABLE public.signup_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  correct_number int NOT NULL CHECK (correct_number BETWEEN 10 AND 99),
  decoys int[] NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'mismatched', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.signup_challenges TO authenticated;
GRANT ALL ON public.signup_challenges TO service_role;
ALTER TABLE public.signup_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own signup challenge by user"
  ON public.signup_challenges FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER trg_signup_challenges_updated
  BEFORE UPDATE ON public.signup_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.signup_challenges;
```

Restore the application migration/type state that requires this table only if the deprecated signup challenge flow is also being reintroduced. Do not drop the archive schema as part of routine cleanup; retain it until the archived data has been reviewed and an authorized retention decision has been made.
