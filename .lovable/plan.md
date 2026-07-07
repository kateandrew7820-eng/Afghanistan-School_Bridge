
# Chat MVP — Plan

Ship a real-time chat feature at `/chat` for all verified users. Light theme, RTL Dari, three-column layout adapted from the reference screenshot. Round 1 = messaging fundamentals only; reactions/threads/voice/calls/AI deferred.

## 1. Scope this round

In:
- 1-to-1 direct messages and group conversations
- Real-time message delivery, typing indicator, online presence
- File attachments (image / PDF / Word / Excel / PowerPoint), inline image preview
- Read receipts (✓ sent, ✓✓ delivered, teal ✓✓ read)
- Unread badges + toast + in-app `NotificationBell` entry for new messages
- Search conversations by name
- New conversation modal: pick user(s) from verified profiles, optional group name

Out (later rounds):
- Reactions, threads, pinned/starred, mentions, edit/delete-for-everyone
- Voice notes, video/voice calls, GIF, location, contact cards
- Roles/permissions, moderation, archive, mute, AI features
- Global cross-content search (messages/users/schools/docs)

## 2. Layout & UX

New route `/chat` added to every role's sidebar (`SchoolLayout`, `DistrictLayout`, `ProvinceLayout`, `MinistryLayout`, `AdminLayout`) with a `MessageSquare` icon and unread badge.

Three-column layout, **light theme** using existing tokens (`background`, `card`, `muted`, `primary` teal accent). Full RTL — column order in visual space becomes: right = conversation list, center = active chat, left = details panel (mirrors screenshot in RTL).

Mobile (<768px): stack — list → chat → details as separate views with back navigation using existing `NavigationBackButton`.

```text
[ Details 300px | Active Chat (flex-1) | Conversation List 340px ]  (RTL)
```

Message bubbles:
- Incoming: `bg-muted text-foreground` right-aligned relative to sender (in RTL: left side of thread)
- Outgoing: `bg-primary text-primary-foreground` opposite side
- Time + read ticks under bubble; sender name shown in groups only
- Date separators (`امروز`, `دیروز`, weekday, full date)
- Grouping: consecutive messages by same sender within 5 min share one avatar

Composer: attachment button, textarea (Enter=send, Shift+Enter=newline), send button. Drag-drop + paste image supported.

## 3. Data model (new migration)

Tables (all in `public`, RLS on, GRANTs to `authenticated` + `service_role`, added to `supabase_realtime`):

- `conversations` — `id`, `type` ('direct' | 'group'), `title` (nullable, groups only), `avatar_url`, `created_by`, `last_message_at`, `created_at`, `updated_at`
- `conversation_members` — `conversation_id`, `user_id`, `role` ('member' | 'admin'), `joined_at`, `last_read_at`, `muted_until` — PK `(conversation_id, user_id)`
- `messages` — `id`, `conversation_id`, `sender_id`, `body` (text, nullable when attachment-only), `attachment_url`, `attachment_name`, `attachment_mime`, `attachment_size`, `reply_to_id` (nullable, reserved), `created_at`, `edited_at`, `deleted_at`
- `message_reads` — `message_id`, `user_id`, `read_at` — PK `(message_id, user_id)` — used for group "seen by N" and DM read ticks
- `typing_indicators` — ephemeral via Realtime broadcast (no table)

Storage bucket: `chat-attachments` (private). Path convention: `<conversation_id>/<message_id>/<filename>`. RLS on `storage.objects` restricts read/write to conversation members.

### RLS (open model)

- `conversations`: SELECT if `auth.uid()` is a member; INSERT allowed for any verified user (`profiles.status = 'verified'`); UPDATE by members (title/avatar for groups), admin only for member changes.
- `conversation_members`: SELECT own membership + membership of conversations you're in; INSERT by creator/admin or self-join to groups you're invited to; DELETE self (leave) or admin.
- `messages`: SELECT if member of conversation; INSERT if member and `sender_id = auth.uid()`; UPDATE only own message within 15 min for `body`, or set `deleted_at` on own message; no hard DELETE.
- `message_reads`: SELECT if member; INSERT own reads only.

Helper SECURITY DEFINER function `public.is_conversation_member(_conv uuid, _user uuid)` to avoid recursive RLS.

Trigger: on `messages` INSERT, update `conversations.last_message_at`.

## 4. Frontend structure

```
src/pages/Chat.tsx                    // route entry, three-column shell
src/components/chat/
  ConversationList.tsx                // search, filter pills (All/Unread/Groups/Direct), list rows
  ConversationRow.tsx
  NewConversationModal.tsx            // pick users from verified profiles, create direct or group
  ChatHeader.tsx                      // title, member count, actions (search placeholder)
  MessageThread.tsx                   // virtualized-ish scroll, date separators, grouping
  MessageBubble.tsx                   // text, attachment renderers, read ticks
  MessageComposer.tsx                 // textarea, attach, drop/paste
  TypingIndicator.tsx
  DetailsPanel.tsx                    // group info, members, shared files
  AttachmentPreview.tsx               // image/pdf/office icon renderers
src/hooks/
  useConversations.ts                 // list + realtime updates
  useMessages.ts                      // per-conversation messages + realtime INSERT/UPDATE
  useChatPresence.ts                  // Realtime presence channel per conversation for online + typing broadcast
  useUnreadCount.ts                   // total unread for sidebar badge
src/lib/chat/
  attachments.ts                      // upload to chat-attachments bucket, mime helpers
  readReceipts.ts                     // mark-read batching
```

Wire `useUnreadCount` into every role layout to render a small dot on the `/chat` nav item. Extend existing `NotificationBell` to also surface "new message from X" entries by inserting a row into `notifications` from a trigger on `messages` (only when recipient's `last_read_at < now()` and browser tab closed — recipient-side; simpler: trigger inserts, hook dedupes when user opens the conversation).

## 5. Realtime wiring

- Per-conversation postgres_changes subscription on `messages` filtered by `conversation_id=eq.<id>` for the open thread.
- Global subscription on `messages` filtered by conversations the user is in (via `conversation_members` join done client-side after initial fetch) to update sidebar list ordering + unread counts.
- Presence + typing: `supabase.channel('conv:'+id, { config: { presence: { key: userId }}})`, broadcast event `typing` throttled to 1/2s, auto-clear after 3s idle.

All subscriptions live in `useEffect` with cleanup — followed strictly to avoid Realtime bill blow-up.

## 6. Files created / edited

New:
- migration (tables, RLS, GRANTs, realtime, helper fn, trigger, storage bucket policies)
- `src/pages/Chat.tsx`, 10 components under `src/components/chat/`, 4 hooks under `src/hooks/`, 2 libs under `src/lib/chat/`

Edited:
- `src/App.tsx` — add `/chat` route (protected, requires verified profile)
- `src/components/layouts/{School,District,Province,Ministry,Admin}Layout.tsx` — add "گفتگو" nav entry with unread dot
- `src/i18n/locales/fa.json` — chat strings

Storage bucket `chat-attachments` created via storage tool (private).

## 7. Verification

- Two-browser manual check: send text + image both ways, see realtime delivery, typing indicator, read ticks flip.
- Create a group with 3 users, verify member list, unread badges.
- Refresh mid-thread; messages restore ordered by `created_at`.
- Sidebar unread dot appears/clears correctly.
- RLS spot check via `read_query`: user not in conversation cannot select its messages.

## Technical notes

- Message pagination: initial load last 50, infinite scroll upward loads 50 more (keyset on `created_at`).
- Attachment size cap 20 MB client-side, mime allowlist enforced by storage policy.
- `messages.body` sanitized on render (plain text only round 1, no markdown/HTML).
- Read receipts written in batches on scroll / focus — one row per (message, user) via upsert.
- Design system: no hardcoded colors; teal accent already lives on `--primary`.
