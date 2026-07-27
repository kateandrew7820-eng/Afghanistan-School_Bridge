# Chat Phase 2 — Product Experience

## Audit: what already exists

| Area | Status |
|---|---|
| Conversation list, search, all/unread/group/direct filters | Done |
| New conversation flow (direct + group, user picker) | Done |
| Message grouping by sender + 5-min window, day separators | Done |
| Bubbles, avatars, sender name in groups, timestamps | Done |
| Read receipts (single/double check), typing, presence | Done |
| Attachments (upload, preview, drag/drop/paste, 20MB cap) | Done |
| Details panel: header, member list with online dots | Partial |
| Reactions, thread replies, pinned messages | Missing |
| Shared files tab, member platform roles (teacher/principal/...) | Missing |
| Loading skeletons, empty/error states, retry, optimistic send | Missing |
| Mobile: details panel unreachable, no back button in header | Missing |

## What I'll build

### 1. Backend (minimal, additive — no changes to existing tables)
- `message_reactions` (message_id, user_id, emoji, unique per triple) with grants + RLS scoped to conversation membership.
- `pinned_messages` (conversation_id, message_id, pinned_by) with grants + RLS: members read, members pin, pinner/conversation-admin unpin.
- Add both to realtime publication.
- `reply_to_id` already exists on `messages` — no migration needed for replies.

### 2. Chat interface
- **Reactions**: hover/long-press action bar on a bubble → 6-emoji quick picker (👍 ❤️ ✅ 🎉 😊 🙏). Reaction chips under the bubble with counts, highlighted when I reacted, toggle on click, live via realtime.
- **Replies**: "reply" action puts a quoted preview above the composer; sent messages carry `reply_to_id`. Bubbles render a compact quoted strip (sender + snippet) that scrolls to and briefly highlights the original.
- **Message actions**: reply, react, copy text, pin/unpin, and delete-own (soft delete via existing `deleted_at`).
- Sender info: show the member's platform role (معلم/مدیر/ولسوالی/…) next to the name on the first bubble of a group in group chats.
- Read status: tap the double-check on my message to see "خوانده شده توسط …" list in group chats.

### 3. Details sidebar
- Tabs: **اعضا / فایل‌ها / سنجاق‌شده**.
- Members: avatar, name, platform role badge, conversation role (مدیر/عضو), online state.
- Files: all attachments in the conversation, grouped image grid + document rows with size/date, click to open signed URL.
- Pinned: pinned messages list, click to jump to the message, unpin control for permitted users.
- Group info: title, created date, member count; group admins can rename the group and add/remove members.

### 4. UX
- Skeleton loaders for conversation list and message thread; shimmer instead of the current text.
- Empty states: no conversations (with CTA), no messages yet (start-the-conversation prompt), no search results, no files/pins.
- Error handling: send failures keep the draft and show a retry chip on the failed bubble; load failures show a retry banner instead of a silent blank list.
- Optimistic send so the bubble appears instantly and reconciles with the realtime insert (fixes the current send → full-reload jank).
- Scroll behavior: only auto-scroll when already at the bottom; otherwise show a "پیام‌های جدید" jump-to-bottom pill.
- Mobile: header back button returns to the list, details panel opens as a bottom/side sheet, composer respects safe-area, tap targets ≥44px.

## Technical notes
- New hooks: `useReactions`, `usePins`, `useConversationFiles`; `useMessages` extended with `reply_to_id`, optimistic queue, and reaction merge.
- `useConversations` extended to fetch each member's `profiles.role` so role badges work; unread counting stays as-is.
- New components: `MessageActions`, `ReactionBar`, `ReplyPreview`, `QuotedMessage`, `DetailsTabs` (`MembersTab`, `FilesTab`, `PinnedTab`), `ChatSkeletons`.
- All strings Dari, RTL-correct (`ms/me`, `ps/pe`), semantic tokens only, no heavy transitions per the low-end Android constraint.
- Out of scope: voice/video calls (buttons stay disabled), message editing, full-text message search.

## Order of work
1. Migration (reactions + pins).
2. `useMessages` optimistic send + replies; bubble actions and reply UI.
3. Reactions.
4. Details panel tabs (members/files/pinned) + group admin controls.
5. Skeletons, empty/error states, scroll pill, mobile layout.
