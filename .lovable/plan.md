## Phase 2.5A — Chat Database Integrity & Security Fixes

Scope limited to data-integrity and permission hardening. No performance work, no RPCs, no realtime optimization, no attachment changes.

### Migration 1 — integrity triggers
- `AFTER INSERT ON public.messages` → `chat_bump_last_message()` (the function exists but no trigger is attached, so `conversations.last_message_at` never updates).
- `BEFORE UPDATE ON public.conversations` → `update_updated_at_column()`.
- One-time backfill: `conversations.last_message_at = max(messages.created_at)` where messages exist.

### Migration 2 — `messages.client_id`
- Add nullable `client_id uuid`.
- Partial unique index on `(conversation_id, client_id) WHERE client_id IS NOT NULL` so a double-submit is rejected by the database.

### Migration 3 — permission tightening
- **`conversations` UPDATE**: replace `is_conversation_member(...)` with `is_conversation_admin(...)` on `USING` and `WITH CHECK` (today any member can rename a group, change its avatar, or flip its type).
- **`conversation_members` INSERT**: drop the `created_by = auth.uid()` branch (it lets a demoted creator keep adding people). Keep `is_conversation_admin(...)`, plus a narrow bootstrap allowance for the creator inserting only their own row at creation time — without it, group creation breaks.
- **`message_reads` INSERT**: add a membership check so a receipt can only be written for a message in a conversation the user belongs to.

### Migration 4 — column-level guard triggers
- `BEFORE UPDATE ON conversations`: force `type` and `created_by` to their old values.
- `BEFORE UPDATE ON messages`: pin every column except `body`, `edited_at`, `deleted_at` to its old value, and set `edited_at` automatically when `body` changes. This closes the current hole where a sender can move an old message into a different conversation or rewrite its timestamp.

### Code change — optimistic reconciliation
`src/hooks/useMessages.ts` only:
- Generate `client_id` per optimistic message and send it in the insert (already generated locally; it just isn't persisted).
- Reconcile the incoming realtime INSERT strictly on `client_id`, falling back to `id` dedupe for older rows.
- Retry path re-sends the same `client_id`, so the unique index makes retry idempotent.
- Regenerate Supabase types after the migrations so `client_id` is typed.

### Verification after implementation
1. `tsgo` type check.
2. Confirm each migration applied (triggers present, policies replaced, index created).
3. Exercise: create direct conversation, create group, add member, rename group, send message, reply, edit, soft-delete, react, pin, mark-read.
4. Report any failure before starting Phase 2.5B.

### Risk
The policy changes are the highest blast radius — a mistake blocks group creation or sending. Group creation is the specific case to watch, since the members INSERT policy is tightened; the creator-bootstrap allowance covers it and will be tested explicitly. Everything else is additive.