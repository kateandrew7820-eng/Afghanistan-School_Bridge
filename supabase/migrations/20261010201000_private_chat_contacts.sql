CREATE INDEX IF NOT EXISTS users_chat_email_lookup_idx
  ON auth.users (lower(email))
  WHERE email IS NOT NULL;

CREATE TABLE public.chat_contacts (
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_user_id, contact_user_id),
  CHECK (owner_user_id <> contact_user_id)
);
CREATE INDEX chat_contacts_reverse_idx ON public.chat_contacts(contact_user_id, owner_user_id);
ALTER TABLE public.chat_contacts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.chat_contacts TO authenticated;
CREATE POLICY "users can read their own chat contacts"
  ON public.chat_contacts FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE TABLE public.chat_blocks (
  blocker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);
CREATE INDEX chat_blocks_reverse_idx ON public.chat_blocks(blocked_user_id, blocker_user_id);
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.chat_blocks TO authenticated;
CREATE POLICY "users can read blocks they created"
  ON public.chat_blocks FOR SELECT TO authenticated
  USING (blocker_user_id = auth.uid());

CREATE TABLE public.chat_discovery_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts >= 1)
);
ALTER TABLE public.chat_discovery_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved')),
  CHECK (reporter_user_id <> reported_user_id)
);
CREATE INDEX chat_reports_review_idx ON public.chat_reports(status, created_at DESC);
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.chat_reports TO authenticated;
GRANT UPDATE (status) ON public.chat_reports TO authenticated;
CREATE POLICY "admins can review chat reports"
  ON public.chat_reports FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "admins can update chat report status"
  ON public.chat_reports FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
REVOKE INSERT, DELETE ON public.chat_reports FROM authenticated;

CREATE OR REPLACE FUNCTION public.chat_users_blocked(_user uuid, _other uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_blocks AS block
    WHERE (block.blocker_user_id = _user AND block.blocked_user_id = _other)
       OR (block.blocker_user_id = _other AND block.blocked_user_id = _user)
  );
$$;
REVOKE ALL ON FUNCTION public.chat_users_blocked(uuid, uuid) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.can_send_chat_message(_conversation uuid, _sender uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT _sender = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.conversation_members AS mine
    WHERE mine.conversation_id = _conversation
      AND mine.user_id = _sender
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.conversations AS conversation
    JOIN public.conversation_members AS other_member
      ON other_member.conversation_id = conversation.id
    JOIN public.chat_blocks AS block
      ON (block.blocker_user_id = _sender AND block.blocked_user_id = other_member.user_id)
      OR (block.blocker_user_id = other_member.user_id AND block.blocked_user_id = _sender)
    WHERE conversation.id = _conversation
      AND conversation.type = 'direct'
      AND other_member.user_id <> _sender
  );
$$;
REVOKE ALL ON FUNCTION public.can_send_chat_message(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_chat_message(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_chat_discovery_attempt()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
  current_attempts integer;
BEGIN
  IF caller IS NULL THEN RETURN false; END IF;
  INSERT INTO public.chat_discovery_limits(user_id, window_started_at, attempts)
  VALUES (caller, now(), 1)
  ON CONFLICT (user_id) DO UPDATE
  SET window_started_at = CASE
        WHEN public.chat_discovery_limits.window_started_at < now() - interval '1 minute'
        THEN now() ELSE public.chat_discovery_limits.window_started_at END,
      attempts = CASE
        WHEN public.chat_discovery_limits.window_started_at < now() - interval '1 minute'
        THEN 1 ELSE least(public.chat_discovery_limits.attempts + 1, 31) END
  RETURNING attempts INTO current_attempts;
  RETURN current_attempts <= 30;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_chat_discovery_attempt() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.find_chat_user_by_email(_email text)
RETURNS TABLE(user_id uuid, full_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.consume_chat_discovery_attempt() THEN
    RAISE EXCEPTION 'Too many contact searches. Try again shortly.' USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY
  SELECT profile.user_id, profile.full_name, profile.role
  FROM auth.users AS account
  JOIN public.profiles AS profile ON profile.user_id = account.id
  WHERE lower(account.email) = lower(trim(_email))
    AND profile.status = 'verified'
    AND profile.user_id <> auth.uid()
    AND NOT public.chat_users_blocked(auth.uid(), profile.user_id)
  LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION public.find_chat_user_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_chat_user_by_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_direct_chat_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
  target uuid;
  existing_conversation uuid;
  new_conversation uuid;
  lock_key bigint;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;
  IF NOT public.consume_chat_discovery_attempt() THEN
    RAISE EXCEPTION 'Too many contact searches. Try again shortly.' USING ERRCODE = 'P0001';
  END IF;

  SELECT account.id INTO target
  FROM auth.users AS account
  JOIN public.profiles AS profile ON profile.user_id = account.id
  WHERE lower(account.email) = lower(trim(_email))
    AND profile.status = 'verified'
    AND account.id <> caller
  LIMIT 1;

  IF target IS NULL OR public.chat_users_blocked(caller, target) THEN
    RAISE EXCEPTION 'No reachable user was found.' USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles AS profile
    WHERE profile.user_id = caller AND profile.status = 'verified'
  ) THEN
    RAISE EXCEPTION 'A verified account is required to start a conversation.' USING ERRCODE = '42501';
  END IF;

  lock_key := hashtextextended(least(caller::text, target::text) || ':' || greatest(caller::text, target::text), 0);
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT conversation.id INTO existing_conversation
  FROM public.conversations AS conversation
  WHERE conversation.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.conversation_members AS member
      WHERE member.conversation_id = conversation.id AND member.user_id = caller
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_members AS member
      WHERE member.conversation_id = conversation.id AND member.user_id = target
    )
    AND (
      SELECT count(*) FROM public.conversation_members AS member
      WHERE member.conversation_id = conversation.id
    ) = 2
  ORDER BY conversation.created_at
  LIMIT 1;

  IF existing_conversation IS NOT NULL THEN
    INSERT INTO public.chat_contacts(owner_user_id, contact_user_id)
    VALUES (caller, target)
    ON CONFLICT DO NOTHING;
    RETURN existing_conversation;
  END IF;

  INSERT INTO public.conversations(type, created_by)
  VALUES ('direct', caller)
  RETURNING id INTO new_conversation;

  INSERT INTO public.conversation_members(conversation_id, user_id, role)
  VALUES
    (new_conversation, caller, 'admin'),
    (new_conversation, target, 'member');

  INSERT INTO public.chat_contacts(owner_user_id, contact_user_id)
  VALUES (caller, target)
  ON CONFLICT DO NOTHING;

  RETURN new_conversation;
END;
$$;
REVOKE ALL ON FUNCTION public.create_direct_chat_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_direct_chat_by_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_chat_contact(_contact_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL OR caller = _contact_user_id THEN
    RAISE EXCEPTION 'Invalid contact.' USING ERRCODE = '42501';
  END IF;
  IF public.chat_users_blocked(caller, _contact_user_id) THEN
    RAISE EXCEPTION 'This contact is unavailable.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_members AS mine
    JOIN public.conversation_members AS theirs USING (conversation_id)
    JOIN public.conversations AS conversation ON conversation.id = mine.conversation_id
    WHERE mine.user_id = caller
      AND theirs.user_id = _contact_user_id
      AND conversation.type = 'direct'
  ) THEN
    RAISE EXCEPTION 'A direct conversation is required to add this contact.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.chat_contacts(owner_user_id, contact_user_id)
  VALUES (caller, _contact_user_id)
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.add_chat_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_chat_contact(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_chat_contact_by_email(_email text)
RETURNS TABLE(user_id uuid, full_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
  target uuid;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles AS profile
    WHERE profile.user_id = caller AND profile.status = 'verified'
  ) THEN
    RAISE EXCEPTION 'A verified account is required to add contacts.' USING ERRCODE = '42501';
  END IF;
  IF NOT public.consume_chat_discovery_attempt() THEN
    RAISE EXCEPTION 'Too many contact searches. Try again shortly.' USING ERRCODE = 'P0001';
  END IF;
  SELECT account.id INTO target
  FROM auth.users AS account
  JOIN public.profiles AS profile ON profile.user_id = account.id
  WHERE lower(account.email) = lower(trim(_email))
    AND account.id <> caller
    AND profile.status = 'verified'
  LIMIT 1;
  IF target IS NULL OR public.chat_users_blocked(caller, target) THEN
    RAISE EXCEPTION 'No reachable user was found.' USING ERRCODE = 'P0002';
  END IF;
  INSERT INTO public.chat_contacts(owner_user_id, contact_user_id)
  VALUES (caller, target)
  ON CONFLICT DO NOTHING;
  RETURN QUERY
  SELECT profile.user_id, profile.full_name, profile.role
  FROM public.profiles AS profile
  WHERE profile.user_id = target;
END;
$$;
REVOKE ALL ON FUNCTION public.add_chat_contact_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_chat_contact_by_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_chat_contacts()
RETURNS TABLE(user_id uuid, email text, full_name text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT contact.user_id, account.email, contact.full_name, contact.role
  FROM public.chat_contacts AS saved
  JOIN auth.users AS account ON account.id = saved.contact_user_id
  JOIN public.profiles AS contact ON contact.user_id = saved.contact_user_id
  WHERE saved.owner_user_id = auth.uid()
    AND account.email IS NOT NULL
    AND NOT public.chat_users_blocked(auth.uid(), saved.contact_user_id)
  ORDER BY contact.full_name NULLS LAST, account.email;
$$;
REVOKE ALL ON FUNCTION public.list_chat_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_chat_contacts() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_chat_member_profiles(_user_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT profile.user_id, profile.full_name, profile.role
  FROM public.profiles AS profile
  WHERE auth.uid() IS NOT NULL
    AND profile.user_id = ANY(_user_ids)
    AND EXISTS (
      SELECT 1
      FROM public.conversation_members AS mine
      JOIN public.conversation_members AS theirs USING (conversation_id)
      WHERE mine.user_id = auth.uid()
        AND theirs.user_id = profile.user_id
    )
    AND NOT public.chat_users_blocked(auth.uid(), profile.user_id);
$$;
REVOKE ALL ON FUNCTION public.get_chat_member_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chat_member_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_chat_contact_details(_contact_user_id uuid)
RETURNS TABLE(user_id uuid, email text, full_name text, role text, phone_number text, mutual boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    contact.user_id,
    account.email,
    contact.full_name,
    contact.role,
    CASE WHEN EXISTS (
      SELECT 1
      FROM public.chat_contacts AS mine
      JOIN public.chat_contacts AS theirs
        ON theirs.owner_user_id = _contact_user_id
       AND theirs.contact_user_id = auth.uid()
      WHERE mine.owner_user_id = auth.uid()
        AND mine.contact_user_id = _contact_user_id
    ) THEN contact.phone_number ELSE NULL END AS phone_number,
    EXISTS (
      SELECT 1
      FROM public.chat_contacts AS mine
      JOIN public.chat_contacts AS theirs
        ON theirs.owner_user_id = _contact_user_id
       AND theirs.contact_user_id = auth.uid()
      WHERE mine.owner_user_id = auth.uid()
        AND mine.contact_user_id = _contact_user_id
    ) AS mutual
  FROM public.profiles AS contact
  JOIN auth.users AS account ON account.id = contact.user_id
  WHERE auth.uid() IS NOT NULL
    AND contact.user_id = _contact_user_id
    AND account.email IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.chat_contacts AS mine
      WHERE mine.owner_user_id = auth.uid()
        AND mine.contact_user_id = _contact_user_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.conversation_members AS mine
      JOIN public.conversation_members AS theirs USING (conversation_id)
      JOIN public.conversations AS conversation ON conversation.id = mine.conversation_id
      WHERE mine.user_id = auth.uid()
        AND theirs.user_id = _contact_user_id
        AND conversation.type = 'direct'
    )
    AND NOT public.chat_users_blocked(auth.uid(), _contact_user_id);
$$;
REVOKE ALL ON FUNCTION public.get_chat_contact_details(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chat_contact_details(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.block_chat_user(_blocked_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = _blocked_user_id THEN
    RAISE EXCEPTION 'Invalid user to block.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_members AS mine
    JOIN public.conversation_members AS theirs USING (conversation_id)
    WHERE mine.user_id = auth.uid() AND theirs.user_id = _blocked_user_id
  ) THEN
    RAISE EXCEPTION 'A shared conversation is required.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.chat_blocks(blocker_user_id, blocked_user_id)
  VALUES (auth.uid(), _blocked_user_id)
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.block_chat_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.block_chat_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.unblock_chat_user(_blocked_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.chat_blocks
  WHERE blocker_user_id = auth.uid()
    AND blocked_user_id = _blocked_user_id;
$$;
REVOKE ALL ON FUNCTION public.unblock_chat_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unblock_chat_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.report_chat_user(_reported_user_id uuid, _conversation_id uuid, _reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE report_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = _reported_user_id OR _reason IS NULL
     OR length(trim(_reason)) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'Invalid report.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_members AS mine
    JOIN public.conversation_members AS theirs USING (conversation_id)
    WHERE mine.conversation_id = _conversation_id
      AND mine.user_id = auth.uid()
      AND theirs.user_id = _reported_user_id
  ) THEN
    RAISE EXCEPTION 'A shared conversation is required.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.chat_reports(reporter_user_id, reported_user_id, conversation_id, reason)
  VALUES (auth.uid(), _reported_user_id, _conversation_id, trim(_reason))
  RETURNING id INTO report_id;
  RETURN report_id;
END;
$$;
REVOKE ALL ON FUNCTION public.report_chat_user(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_chat_user(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_use_chat_realtime(_topic text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE conversation uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  IF _topic ~ '^chat-control:[0-9a-fA-F-]{36}$' THEN
    RETURN split_part(_topic, ':', 2)::uuid = auth.uid();
  END IF;
  IF _topic !~ '^(presence|conv):[0-9a-fA-F-]{36}$' THEN RETURN false; END IF;
  conversation := split_part(_topic, ':', 2)::uuid;
  RETURN public.can_send_chat_message(conversation, auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.can_use_chat_realtime(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_use_chat_realtime(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_chat_block_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  conversation_ids uuid[];
BEGIN
  SELECT array_agg(DISTINCT mine.conversation_id) INTO conversation_ids
  FROM public.conversation_members AS mine
  JOIN public.conversation_members AS theirs USING (conversation_id)
  WHERE mine.user_id = NEW.blocker_user_id
    AND theirs.user_id = NEW.blocked_user_id;

  IF coalesce(array_length(conversation_ids, 1), 0) > 0 THEN
    PERFORM realtime.send(
      jsonb_build_object('conversationIds', conversation_ids),
      'access-refresh',
      'chat-control:' || NEW.blocked_user_id::text,
      true
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_chat_block_members() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_chat_block_members ON public.chat_blocks;
CREATE TRIGGER trg_notify_chat_block_members
  AFTER INSERT ON public.chat_blocks
  FOR EACH ROW EXECUTE FUNCTION public.notify_chat_block_members();

DROP POLICY IF EXISTS "verified users can create conversation" ON public.conversations;
CREATE POLICY "verified users can create group conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    type = 'group'
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.user_id = auth.uid() AND profile.status = 'verified'
    )
  );

DROP POLICY IF EXISTS "creator or admin can add members" ON public.conversation_members;
CREATE POLICY "creator or admin can add saved contacts"
  ON public.conversation_members FOR INSERT TO authenticated
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.conversations AS conversation
        WHERE conversation.id = conversation_id
          AND conversation.created_by = auth.uid()
          AND conversation.type = 'group'
          AND (
            user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.chat_contacts AS saved
              WHERE saved.owner_user_id = auth.uid()
                AND saved.contact_user_id = user_id
            )
          )
      )
      OR (
        public.is_conversation_admin(conversation_id, auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.chat_contacts AS saved
          WHERE saved.owner_user_id = auth.uid()
            AND saved.contact_user_id = user_id
        )
      )
    )
    AND NOT public.chat_users_blocked(auth.uid(), user_id)
  );

DROP POLICY IF EXISTS "members can send messages" ON public.messages;
CREATE POLICY "unblocked members can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.can_send_chat_message(conversation_id, auth.uid())
  );

CREATE POLICY "authorized users can receive private chat events"
  ON realtime.messages FOR SELECT TO authenticated
  USING (public.can_use_chat_realtime(realtime.topic()));
CREATE POLICY "authorized users can send private chat events"
  ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (public.can_use_chat_realtime(realtime.topic()));
